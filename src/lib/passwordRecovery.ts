import type { TranslationKey } from '../i18n'

export function passwordRecoveryRedirectTo(origin: string): string {
  return `${origin}/auth?mode=update-password`
}

export function recoveryConcealsAccount(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === 'user_not_found'
}

export function recoveryErrorMessageKey(error: unknown): TranslationKey {
  const status = (error as { status?: unknown } | null)?.status
  const code = (error as { code?: unknown } | null)?.code
  if (
    status === 429
    || code === 'over_email_send_rate_limit'
    || code === 'over_request_rate_limit'
  ) {
    return 'auth.resetTooManyAttempts'
  }
  return 'auth.resetSendFailed'
}
