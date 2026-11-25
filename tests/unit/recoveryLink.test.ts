import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'
import {
  RECOVERY_CHECK_TIMEOUT_MS,
  armRecoveryCheckTimeout,
  classifyRecoveryFailure,
  nextRecoveryLocation,
  postRecoveryCode,
  readRecoveryUrl,
  readStoredVerifier,
  recoveryArrival,
  recoveryVerifierRaw,
} from '../../src/lib/recoveryLink.ts'

const ORIGIN = 'https://quest-forge.example'

test('an otp_expired redirect is the combined expired link, in the hash, the query, or an older status code', () => {
  const description = 'Email link is invalid or has expired'
  const hash = `${ORIGIN}/auth?mode=update-password#error=access_denied&error_code=otp_expired&error_description=${encodeURIComponent(description)}`
  const query = `${ORIGIN}/auth?mode=update-password&error=access_denied&error_code=otp_expired&error_description=${encodeURIComponent(description)}`
  for (const href of [hash, query]) {
    assert.equal(readRecoveryUrl(href).kind, 'expired')
    assert.equal(recoveryArrival(href), 'expired')
  }
  const legacy = `${ORIGIN}/auth?mode=update-password#error=unauthorized_client&error_code=401&error_description=${encodeURIComponent(description)}`
  assert.equal(readRecoveryUrl(legacy).kind, 'expired')
})

test('a missing token is not an expired link, and another error is the generic invalid link', () => {
  assert.equal(recoveryArrival(`${ORIGIN}/auth?mode=update-password`), 'none')
  assert.equal(recoveryArrival(`${ORIGIN}/auth`), 'none')
  const other = `${ORIGIN}/auth?mode=update-password#error=access_denied&error_code=flow_state_not_found&error_description=Flow+state+not+found`
  assert.equal(readRecoveryUrl(other).kind, 'invalid')
  assert.equal(recoveryArrival(other), 'invalid')
})

test('a recovery code or an implicit session still has to be checked', () => {
  const code = readRecoveryUrl(`${ORIGIN}/auth?mode=update-password&code=abc&sb_flow_id=flow1234`)
  assert.deepEqual(code, { kind: 'code', code: 'abc', flowId: 'flow1234' })
  assert.equal(recoveryArrival(`${ORIGIN}/auth?mode=update-password&code=abc`), 'check')

  const implicit = readRecoveryUrl(
    `${ORIGIN}/auth?mode=update-password#access_token=atk&refresh_token=rtk&type=recovery`,
  )
  assert.deepEqual(implicit, { kind: 'implicit', accessToken: 'atk', refreshToken: 'rtk' })
  assert.equal(recoveryArrival(`${ORIGIN}/auth?mode=update-password#access_token=atk&refresh_token=rtk`), 'check')
})

test('otp_expired and the shared sentence are expired; an unknown code and a dropped connection are not', () => {
  assert.equal(
    classifyRecoveryFailure(new AuthApiError('Email link is invalid or has expired', 403, 'otp_expired')),
    'expired',
  )
  assert.equal(classifyRecoveryFailure({ code: 'flow_state_expired', message: 'expired' }), 'expired')
  assert.equal(
    classifyRecoveryFailure({ message: 'Email link is invalid or has expired' }),
    'expired',
  )
  assert.equal(
    classifyRecoveryFailure({ details: { code: 'otp_expired' }, message: 'Email link is invalid or has expired' }),
    'expired',
  )
  assert.equal(classifyRecoveryFailure(new AuthApiError('missing', 404, 'flow_state_not_found')), 'invalid')
  assert.equal(classifyRecoveryFailure(new AuthRetryableFetchError('Failed to fetch', 0)), 'unreachable')
  assert.equal(classifyRecoveryFailure({ status: 0 }), 'unreachable')
  assert.equal(classifyRecoveryFailure({ status: 503, message: 'unavailable' }), 'unreachable')
  assert.equal(classifyRecoveryFailure(new AuthApiError('nope', 400, 'unexpected_failure')), 'invalid')
})

test('the stored verifier drops the recovery marker, and a flow id does not borrow another flow', () => {
  assert.equal(readStoredVerifier(JSON.stringify('verifier-value/recovery')), 'verifier-value')
  assert.equal(readStoredVerifier('plain-verifier'), 'plain-verifier')
  assert.equal(readStoredVerifier(null), null)
  assert.equal(readStoredVerifier(''), null)

  const storage = new Map<string, string>([
    ['sb-mock-auth-token-code-verifier', JSON.stringify('legacy/recovery')],
    ['sb-mock-auth-token-flow-flow1234-code-verifier', JSON.stringify('slotted/recovery')],
  ])
  const read = (key: string) => storage.get(key) ?? null
  assert.equal(
    recoveryVerifierRaw(read, 'https://mock.supabase.co', null),
    JSON.stringify('legacy/recovery'),
  )
  assert.equal(
    recoveryVerifierRaw(read, 'https://mock.supabase.co', 'flow1234'),
    JSON.stringify('slotted/recovery'),
  )
  assert.equal(recoveryVerifierRaw(read, 'https://mock.supabase.co', 'missing1'), null)
})

test('expired and a saved password drop the recovery material; a failed check keeps it', () => {
  const expiredHref = `${ORIGIN}/auth?mode=update-password&code=abc#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`
  assert.equal(nextRecoveryLocation(expiredHref, 'expired'), '/auth?mode=update-password')
  assert.equal(nextRecoveryLocation(expiredHref, 'unreachable'), null)
  assert.equal(nextRecoveryLocation(expiredHref, 'checking'), null)
  assert.equal(
    nextRecoveryLocation(`${ORIGIN}/auth?mode=update-password&code=abc`, 'form'),
    '/auth?mode=update-password',
  )
  assert.equal(nextRecoveryLocation(`${ORIGIN}/auth?mode=update-password`, 'form'), null)
  assert.equal(nextRecoveryLocation(`${ORIGIN}/auth?mode=update-password`, 'done'), '/auth')
  assert.equal(
    nextRecoveryLocation(`${ORIGIN}/auth?mode=update-password#access_token=atk&refresh_token=rtk`, 'done'),
    '/auth',
  )
})

test('the recovery check gives up at 10 seconds', () => {
  assert.equal(RECOVERY_CHECK_TIMEOUT_MS, 10_000)
  mock.timers.enable({ apis: ['setTimeout'] })
  try {
    const fired: string[] = []
    const cancel = armRecoveryCheckTimeout(() => fired.push('timeout'))
    mock.timers.tick(RECOVERY_CHECK_TIMEOUT_MS - 1)
    assert.deepEqual(fired, [])
    mock.timers.tick(1)
    assert.deepEqual(fired, ['timeout'])

    const cancelled: string[] = []
    const stop = armRecoveryCheckTimeout(() => cancelled.push('timeout'))
    stop()
    mock.timers.tick(RECOVERY_CHECK_TIMEOUT_MS)
    assert.deepEqual(cancelled, [])
  } finally {
    mock.timers.reset()
  }
})

test('posting the recovery code reports expiry, a dropped connection, and a session', async () => {
  const expired = await postRecoveryCode({
    supabaseUrl: 'https://mock.supabase.co',
    supabaseKey: 'anon',
    code: 'abc',
    verifier: 'verifier-value',
    signal: new AbortController().signal,
    fetch: async () => new Response(JSON.stringify({
      error_code: 'otp_expired',
      msg: 'Email link is invalid or has expired',
    }), { status: 403 }),
  })
  assert.deepEqual(expired, { status: 'expired' })

  const dropped = await postRecoveryCode({
    supabaseUrl: 'https://mock.supabase.co',
    supabaseKey: 'anon',
    code: 'abc',
    verifier: 'verifier-value',
    signal: new AbortController().signal,
    fetch: async () => {
      throw new TypeError('Failed to fetch')
    },
  })
  assert.deepEqual(dropped, { status: 'unreachable' })

  const controller = new AbortController()
  controller.abort()
  const aborted = await postRecoveryCode({
    supabaseUrl: 'https://mock.supabase.co',
    supabaseKey: 'anon',
    code: 'abc',
    verifier: 'verifier-value',
    signal: controller.signal,
    fetch: async (_url, init) => {
      assert.equal(init?.signal, controller.signal)
      throw Object.assign(new Error('aborted'), { name: 'AbortError' })
    },
  })
  assert.deepEqual(aborted, { status: 'aborted' })

  let sent: { url: string; body: string } | null = null
  const session = await postRecoveryCode({
    supabaseUrl: 'https://mock.supabase.co',
    supabaseKey: 'anon',
    code: 'abc',
    verifier: 'verifier-value',
    signal: new AbortController().signal,
    fetch: async (url, init) => {
      sent = { url: String(url), body: String(init?.body) }
      return new Response(JSON.stringify({
        access_token: 'atk',
        refresh_token: 'rtk',
        expires_in: 3600,
        token_type: 'bearer',
        user: { email: 'hero@example.com' },
      }), { status: 200 })
    },
  })
  assert.deepEqual(session, {
    status: 'session',
    email: 'hero@example.com',
    accessToken: 'atk',
    refreshToken: 'rtk',
  })
  assert.equal(sent?.url, 'https://mock.supabase.co/auth/v1/token?grant_type=pkce')
  assert.deepEqual(JSON.parse(sent?.body ?? '{}'), { auth_code: 'abc', code_verifier: 'verifier-value' })
})
