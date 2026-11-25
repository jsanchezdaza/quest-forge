export const RECOVERY_CHECK_TIMEOUT_MS = 10_000

const FLOW_ID = /^[a-zA-Z0-9_-]{8,64}$/
const EXPIRED_SENTENCE = /invalid or has expired/i

export type RecoveryUrl =
  | { kind: 'none' }
  | { kind: 'expired' }
  | { kind: 'invalid' }
  | { kind: 'code'; code: string; flowId: string | null }
  | { kind: 'implicit'; accessToken: string; refreshToken: string }

export type RecoveryArrival = 'none' | 'expired' | 'invalid' | 'check'

export type RecoveryFailure = 'expired' | 'unreachable' | 'invalid'

export type RecoveryCheckResult =
  | { status: 'expired' }
  | { status: 'unreachable' }
  | { status: 'invalid' }
  | { status: 'aborted' }
  | { status: 'session'; email: string; accessToken: string; refreshToken: string }

type RecoveryFetch = (url: string, init: RequestInit) => Promise<Response>

export function readRecoveryUrl(href: string): RecoveryUrl {
  const url = new URL(href)
  const hash = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : '')
  const code = param(url.searchParams, hash, 'error_code')
  const description = param(url.searchParams, hash, 'error_description')
  if (isExpiredSignal(code, description)) return { kind: 'expired' }
  if (
    param(url.searchParams, hash, 'error')
    || code
    || description
  ) return { kind: 'invalid' }

  const authCode = url.searchParams.get('code')
  if (authCode) {
    const flowId = url.searchParams.get('sb_flow_id')
    return { kind: 'code', code: authCode, flowId: flowId && FLOW_ID.test(flowId) ? flowId : null }
  }

  const accessToken = hash.get('access_token')
  const refreshToken = hash.get('refresh_token')
  if (accessToken && refreshToken) return { kind: 'implicit', accessToken, refreshToken }
  return { kind: 'none' }
}

export function recoveryArrival(href: string): RecoveryArrival {
  const link = readRecoveryUrl(href)
  if (link.kind === 'expired') return 'expired'
  if (link.kind === 'invalid') return 'invalid'
  if (link.kind === 'code' || link.kind === 'implicit') return 'check'
  return 'none'
}

export function classifyRecoveryFailure(error: unknown): RecoveryFailure {
  const code = recoveryErrorCode(error)
  const message = recoveryErrorMessage(error)
  if (isExpiredSignal(code, message)) return 'expired'
  const status = recoveryErrorStatus(error)
  if (status === 0 || (typeof status === 'number' && status >= 500 && status <= 530)) return 'unreachable'
  if (isRetryableFetch(error)) return 'unreachable'
  return 'invalid'
}

export function readStoredVerifier(raw: string | null): string | null {
  if (!raw) return null
  let value = raw
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed === 'string') value = parsed
  } catch {
    value = raw
  }
  const verifier = value.split('/')[0]
  return verifier || null
}

export function recoveryVerifierRaw(
  read: (key: string) => string | null,
  supabaseUrl: string,
  flowId: string | null,
): string | null {
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
  const key = flowId && FLOW_ID.test(flowId)
    ? `${storageKey}-flow-${flowId}-code-verifier`
    : `${storageKey}-code-verifier`
  return read(key)
}

export function nextRecoveryLocation(
  href: string,
  status: 'expired' | 'unreachable' | 'checking' | 'form' | 'done',
): string | null {
  if (status === 'unreachable' || status === 'checking') return null
  const url = new URL(href)
  if (status === 'done') return url.pathname
  if (status === 'form' && !hasRecoveryMaterial(url)) return null
  if (status !== 'expired' && status !== 'form') return null
  const mode = url.searchParams.get('mode')
  return mode ? `${url.pathname}?mode=${encodeURIComponent(mode)}` : url.pathname
}

export function armRecoveryCheckTimeout(
  onTimeout: () => void,
  delayMs = RECOVERY_CHECK_TIMEOUT_MS,
): () => void {
  const id = setTimeout(onTimeout, delayMs)
  return () => clearTimeout(id)
}

async function jsonBodyOrNull(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function postRecoveryCode(input: {
  supabaseUrl: string
  supabaseKey: string
  code: string
  verifier: string
  signal: AbortSignal
  fetch?: RecoveryFetch
}): Promise<RecoveryCheckResult> {
  const fetcher = input.fetch ?? fetch
  let response: Response
  try {
    response = await fetcher(`${input.supabaseUrl}/auth/v1/token?grant_type=pkce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: input.supabaseKey,
        Authorization: `Bearer ${input.supabaseKey}`,
      },
      body: JSON.stringify({ auth_code: input.code, code_verifier: input.verifier }),
      signal: input.signal,
    })
  } catch (error) {
    if (isAbortError(error)) return { status: 'aborted' }
    return { status: 'unreachable' }
  }

  const body = await jsonBodyOrNull(response)
  if (!response.ok) {
    const failure = classifyRecoveryFailure({
      status: response.status,
      code: recordString(body, 'error_code') || recordString(body, 'code'),
      message: recordString(body, 'msg') || recordString(body, 'error_description') || recordString(body, 'message'),
    })
    return { status: failure }
  }

  const record = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const accessToken = recordString(record, 'access_token')
  const refreshToken = recordString(record, 'refresh_token')
  if (!accessToken || !refreshToken) return { status: 'invalid' }
  const user = record.user
  const email = user && typeof user === 'object' ? recordString(user, 'email') : ''
  return { status: 'session', email, accessToken, refreshToken }
}

function param(query: URLSearchParams, hash: URLSearchParams, key: string): string {
  return query.get(key) ?? hash.get(key) ?? ''
}

function isExpiredSignal(code: string, description: string): boolean {
  if (code === 'otp_expired' || code === 'flow_state_expired') return true
  return EXPIRED_SENTENCE.test(description)
}

function recoveryErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return ''
  const record = error as { code?: unknown; details?: { code?: unknown } }
  if (typeof record.code === 'string' && record.code) return record.code
  if (typeof record.details?.code === 'string') return record.details.code
  return ''
}

function recoveryErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return ''
  const message = (error as { message?: unknown }).message
  return typeof message === 'string' ? message : ''
}

function recoveryErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null
  const status = (error as { status?: unknown }).status
  return typeof status === 'number' ? status : null
}

function isRetryableFetch(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && (error as { name?: unknown }).name === 'AuthRetryableFetchError'
}

function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError'
}

function hasRecoveryMaterial(url: URL): boolean {
  if (url.hash.length > 1) return true
  return ['code', 'error', 'error_code', 'error_description', 'sb_flow_id'].some((key) => url.searchParams.has(key))
}

function recordString(value: unknown, key: string): string {
  if (!value || typeof value !== 'object') return ''
  const field = (value as Record<string, unknown>)[key]
  return typeof field === 'string' ? field : ''
}
