import type { TranslationKey } from '../i18n'

/**
 * Where the recovery email sends the player. Issue #37 does not name a route,
 * so the link opens the auth page in the mode that story will handle.
 *
 * supabase-js 2.114 accepts only `redirectTo` and `captchaToken` on
 * `resetPasswordForEmail`. The message language comes from user metadata,
 * which the recovery template reads. There is no language option to pass.
 */
export function passwordRecoveryRedirectTo(origin: string): string {
  return `${origin}/auth?mode=update-password`
}

/**
 * GoTrue may answer that the address has no account. That is still the
 * confirmation: a failure here would reveal that the account is missing.
 */
export function recoveryConcealsAccount(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === 'user_not_found'
}

/** A failed recovery request never says whether the account exists. */
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
