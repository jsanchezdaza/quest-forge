import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AuthApiError, AuthRetryableFetchError, AuthSessionMissingError, AuthWeakPasswordError } from '@supabase/supabase-js'
import { en } from '../../src/i18n/en.ts'
import { es } from '../../src/i18n/es.ts'
import type { TranslationKey } from '../../src/i18n/index.ts'
import {
  UPDATE_PASSWORD_CHECKING_MS,
  beginUpdatePassword,
  createRecoveryHold,
  retainedPassword,
  isUpdatePasswordSearch,
  recoveryHoldAfterAuthEvent,
  shouldRedirectSignedInToGame,
  signOutInBackground,
  signOutLocalSession,
  showUpdatePasswordChecking,
  updatePasswordHelp,
  updatePasswordReducer,
  type UpdatePasswordState,
} from '../../src/lib/updatePassword.ts'

function form(fieldError: TranslationKey | null = null): UpdatePasswordState {
  return { status: 'form', email: 'hero@example.com', fieldError }
}

const saving: UpdatePasswordState = { status: 'saving', email: 'hero@example.com' }

test('auth stays on the checking state until the recovery session is known', () => {
  assert.deepEqual(beginUpdatePassword({ initializing: true, signedIn: false, email: '' }), {
    status: 'checking',
  })
  assert.deepEqual(beginUpdatePassword({ initializing: true, signedIn: true, email: 'hero@example.com' }), {
    status: 'checking',
  })
  assert.equal(showUpdatePasswordChecking({ status: 'checking' }, UPDATE_PASSWORD_CHECKING_MS - 1), false)
  assert.equal(showUpdatePasswordChecking({ status: 'checking' }, UPDATE_PASSWORD_CHECKING_MS), true)
  assert.equal(UPDATE_PASSWORD_CHECKING_MS, 300)
  assert.equal(showUpdatePasswordChecking(form(), UPDATE_PASSWORD_CHECKING_MS), false)
})

test('a resolved recovery session opens the form and no session is an invalid link', () => {
  const checking: UpdatePasswordState = { status: 'checking' }
  assert.deepEqual(
    updatePasswordReducer(checking, { type: 'resolved', signedIn: true, email: 'hero@example.com' }),
    form(),
  )
  assert.deepEqual(
    updatePasswordReducer(checking, { type: 'resolved', signedIn: false, email: '' }),
    { status: 'invalid' },
  )
  assert.deepEqual(
    beginUpdatePassword({ initializing: false, signedIn: true, email: 'hero@example.com' }),
    form(),
  )
  assert.deepEqual(beginUpdatePassword({ initializing: false, signedIn: false, email: '' }), {
    status: 'invalid',
  })
})

test('a late auth result does not leave the confirmation or the invalid link', () => {
  const done: UpdatePasswordState = { status: 'done' }
  const invalid: UpdatePasswordState = { status: 'invalid' }
  const expired: UpdatePasswordState = { status: 'expired' }
  const unreachable: UpdatePasswordState = { status: 'unreachable', retrying: false }
  const resolved = { type: 'resolved' as const, signedIn: false, email: '' }
  assert.deepEqual(updatePasswordReducer(done, resolved), done)
  assert.deepEqual(updatePasswordReducer(invalid, { type: 'resolved', signedIn: true, email: 'hero@example.com' }), invalid)
  assert.deepEqual(updatePasswordReducer(expired, resolved), expired)
  assert.deepEqual(updatePasswordReducer(unreachable, { type: 'resolved', signedIn: true, email: 'hero@example.com' }), unreachable)
  assert.deepEqual(updatePasswordReducer(saving, resolved), saving)
})

test('an expired redirect is not the generic invalid link, and a pending code is not either', () => {
  const checking: UpdatePasswordState = { status: 'checking' }
  assert.deepEqual(
    beginUpdatePassword({ initializing: false, signedIn: false, email: '', arrival: 'expired' }),
    { status: 'expired' },
  )
  assert.deepEqual(
    beginUpdatePassword({ initializing: true, signedIn: false, email: '', arrival: 'expired' }),
    { status: 'expired' },
  )
  assert.deepEqual(
    beginUpdatePassword({ initializing: false, signedIn: true, email: 'hero@example.com', arrival: 'invalid' }),
    { status: 'invalid' },
  )
  assert.deepEqual(
    beginUpdatePassword({ initializing: false, signedIn: false, email: '', arrival: 'check' }),
    checking,
  )
  assert.deepEqual(
    updatePasswordReducer(checking, { type: 'resolved', signedIn: false, email: '', linkPending: true }),
    checking,
  )
  assert.deepEqual(
    updatePasswordReducer(checking, { type: 'checked', outcome: 'expired' }),
    { status: 'expired' },
  )
  assert.deepEqual(
    updatePasswordReducer(checking, { type: 'checked', outcome: 'session', email: 'hero@example.com' }),
    form(),
  )
})

test('a check that runs long or fails the network can be tried again with the same link', () => {
  const checking: UpdatePasswordState = { status: 'checking' }
  const idle: UpdatePasswordState = { status: 'unreachable', retrying: false }
  const retrying: UpdatePasswordState = { status: 'unreachable', retrying: true }
  assert.deepEqual(updatePasswordReducer(checking, { type: 'timed-out' }), idle)
  assert.deepEqual(updatePasswordReducer(checking, { type: 'checked', outcome: 'unreachable' }), idle)
  assert.deepEqual(updatePasswordReducer(idle, { type: 'retry' }), retrying)
  assert.deepEqual(updatePasswordReducer(retrying, { type: 'retry' }), retrying)
  assert.deepEqual(updatePasswordReducer(retrying, { type: 'timed-out' }), idle)
  assert.deepEqual(updatePasswordReducer(retrying, { type: 'checked', outcome: 'expired' }), { status: 'expired' })
  assert.deepEqual(updatePasswordReducer(idle, { type: 'checked', outcome: 'session', email: 'hero@example.com' }), idle)
  assert.deepEqual(updatePasswordReducer(form(), { type: 'timed-out' }), form())
})

test('submit stays on the form until the new password meets the sign-up rules', () => {
  assert.deepEqual(updatePasswordReducer(form(), { type: 'submit', password: '' }), form('auth.passwordRequired'))
  assert.deepEqual(updatePasswordReducer(form(), { type: 'submit', password: 'abc1234' }), form('auth.passwordTooShort'))
  assert.deepEqual(updatePasswordReducer(form(), { type: 'submit', password: 'abcdefgh' }), form('auth.passwordNeedsNumber'))
  assert.deepEqual(updatePasswordReducer(form(), { type: 'submit', password: '12345678' }), form('auth.passwordNeedsLetter'))
  assert.deepEqual(updatePasswordReducer(form(), { type: 'submit', password: 'abcd1234' }), saving)
  assert.deepEqual(updatePasswordReducer(saving, { type: 'submit', password: 'abcd1234' }), saving)
})

test('the typed password is dropped once the card leaves the form', () => {
  assert.equal(retainedPassword('form', 'abcd1234'), 'abcd1234')
  assert.equal(retainedPassword('saving', 'abcd1234'), 'abcd1234')
  assert.equal(retainedPassword('checking', 'abcd1234'), 'abcd1234')
  assert.equal(retainedPassword('done', 'abcd1234'), '')
  assert.equal(retainedPassword('invalid', 'secret'), '')
  assert.equal(retainedPassword('expired', 'secret'), '')
  assert.equal(retainedPassword('unreachable', 'secret'), '')
})

test('a saved password replaces the form with the confirmation', () => {
  assert.deepEqual(updatePasswordReducer(saving, { type: 'saved' }), { status: 'done' })
  assert.deepEqual(updatePasswordReducer(form(), { type: 'saved' }), form())
})

test('same password, a weak password, a rate limit, and a network failure stay on the form', () => {
  const failed = (error: unknown, fieldError: TranslationKey) => {
    assert.deepEqual(updatePasswordReducer(saving, { type: 'failed', error }), form(fieldError))
  }
  failed(new AuthApiError('same', 422, 'same_password'), 'auth.updatePasswordSame')
  failed(new AuthApiError('weak', 422, 'weak_password'), 'error.weakPassword.message')
  failed(new AuthWeakPasswordError('weak', 422, ['characters']), 'error.weakPassword.message')
  failed(new AuthApiError('rate', 429, 'over_request_rate_limit'), 'auth.resetTooManyAttempts')
  failed(new AuthApiError('rate', 429, 'over_email_send_rate_limit'), 'auth.resetTooManyAttempts')
  failed({ status: 429 }, 'auth.resetTooManyAttempts')
  failed(new AuthRetryableFetchError('Failed to fetch', 0), 'auth.resetSendFailed')
  failed(new AuthApiError('nope', 400, 'unexpected_failure'), 'error.authError.message')
  failed(new AuthRetryableFetchError('Service Unavailable', 503), 'error.authError.message')
})

test('sign-out after an expired recovery link does not block the card', async () => {
  const blocked = new Promise<never>(() => {})
  const result = await Promise.race([
    Promise.resolve(signOutInBackground(() => blocked, () => {})).then(() => 'returned'),
    new Promise((resolve) => setTimeout(() => resolve('blocked'), 50)),
  ])
  assert.equal(result, 'returned')

  let reported = false
  signOutInBackground(
    () => Promise.reject(new Error('offline')),
    () => { reported = true },
  )
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.equal(reported, true)
})

test('an expired recovery link signs out only this browser', async () => {
  let received: unknown
  const result = await signOutLocalSession(async (options) => {
    received = options
    return { error: null }
  })
  assert.deepEqual(received, { scope: 'local' })
  assert.deepEqual(result, { error: null })
})

test('a forbidden response stays on the form unless the session itself is gone', () => {
  const stayed = (error: unknown) => {
    assert.deepEqual(
      updatePasswordReducer(saving, { type: 'failed', error }),
      form('error.authError.message'),
    )
  }
  stayed(new AuthApiError('banned', 403, 'user_banned'))
  stayed(new AuthApiError('other', 403, 'unexpected_failure'))
  stayed({ status: 403 })
})

test('a missing or rejected recovery session on save opens the invalid link', () => {
  const expired = (error: unknown) => {
    assert.deepEqual(updatePasswordReducer(saving, { type: 'failed', error }), { status: 'invalid' })
  }
  expired(new AuthApiError('unauthorized', 401, 'bad_jwt'))
  expired(new AuthSessionMissingError())
  expired({ status: 403, code: 'session_not_found' })
  expired(new AuthApiError('reauth', 400, 'reauthentication_needed'))
  expired(new AuthApiError('forbidden', 403, 'forbidden'))
})

test('the help line names the recovery email and drops the phrase when there is none', () => {
  assert.deepEqual(updatePasswordHelp('hero@example.com'), {
    key: 'auth.updatePasswordHelp',
    email: 'hero@example.com',
  })
  assert.deepEqual(updatePasswordHelp('  hero@example.com  '), {
    key: 'auth.updatePasswordHelp',
    email: 'hero@example.com',
  })
  assert.deepEqual(updatePasswordHelp(''), { key: 'auth.updatePasswordHelpNoEmail' })
  assert.deepEqual(updatePasswordHelp('   '), { key: 'auth.updatePasswordHelpNoEmail' })
})

test('the recovery url is the only auth url that skips the signed-in redirect', () => {
  assert.equal(isUpdatePasswordSearch('?mode=update-password'), true)
  assert.equal(isUpdatePasswordSearch('mode=update-password'), true)
  assert.equal(isUpdatePasswordSearch('?mode=update-password&next=1'), true)
  assert.equal(isUpdatePasswordSearch('?mode=reset'), false)
  assert.equal(isUpdatePasswordSearch(''), false)

  assert.equal(shouldRedirectSignedInToGame({ signedIn: false, mode: 'update-password', passwordRecovery: false }), false)
  assert.equal(shouldRedirectSignedInToGame({ signedIn: true, mode: 'update-password', passwordRecovery: false }), false)
  assert.equal(shouldRedirectSignedInToGame({ signedIn: true, mode: 'signin', passwordRecovery: true }), false)
  assert.equal(shouldRedirectSignedInToGame({ signedIn: true, mode: 'signin', passwordRecovery: false }), true)
  assert.equal(shouldRedirectSignedInToGame({ signedIn: true, mode: 'reset', passwordRecovery: false }), true)
  assert.equal(shouldRedirectSignedInToGame({ signedIn: false, mode: 'signin', passwordRecovery: false }), false)
})

test('leaving the recovery card drops the hold, and a later session event stays dropped', () => {
  const hold = createRecoveryHold()
  assert.equal(hold.apply('PASSWORD_RECOVERY', true), true)
  assert.equal(hold.apply('USER_UPDATED', true), true)
  assert.equal(hold.release(), false)
  assert.equal(hold.current(), false)
  assert.equal(hold.apply('TOKEN_REFRESHED', true), false)
  assert.equal(hold.apply('USER_UPDATED', true), false)
})

test('PASSWORD_RECOVERY holds the session and a following sign-in event keeps the hold', () => {
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'INITIAL_SESSION', hasSession: true, held: false }), false)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'PASSWORD_RECOVERY', hasSession: true, held: false }), true)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'INITIAL_SESSION', hasSession: true, held: true }), true)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'SIGNED_IN', hasSession: true, held: true }), true)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'USER_UPDATED', hasSession: true, held: true }), true)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'TOKEN_REFRESHED', hasSession: true, held: true }), true)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'SIGNED_OUT', hasSession: false, held: true }), false)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'PASSWORD_RECOVERY', hasSession: false, held: true }), false)
})

test('english and spanish use the same translation keys', () => {
  assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort())
})
