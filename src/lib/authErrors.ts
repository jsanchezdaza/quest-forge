import { isAuthRetryableFetchError } from '@supabase/supabase-js'
import type { TranslationKey } from '../i18n'

/**
 * Supabase error code to translation key. Keyed on `AuthError.code`, never on
 * the message: the codes are a documented contract, the English copy behind
 * them is not, and it changes without notice.
 *
 * Only the codes this app can actually produce are listed. Anything else —
 * MFA, SAML, SSO, phone auth — falls through to the generic message.
 */
const MESSAGE_BY_CODE = new Map<string, TranslationKey>([
  ['invalid_credentials', 'error.loginFailed.message'],
  ['email_not_confirmed', 'error.emailNotConfirmed.message'],
  ['user_already_exists', 'error.userAlreadyExists.message'],
  ['weak_password', 'error.weakPassword.message'],
  ['email_address_invalid', 'error.invalidEmail.message'],
  ['signup_disabled', 'error.signupDisabled.message'],
  ['email_address_not_authorized', 'error.emailNotAuthorized.message'],
  ['over_request_rate_limit', 'error.tooManyRequests.message'],
  ['over_email_send_rate_limit', 'error.tooManyRequests.message'],
])

/**
 * True when there is no usable response to explain. Every `AuthError` defines a
 * `code` property — undefined when there was no response — so its presence
 * proves nothing. supabase-js instead wraps these as retryable fetch errors
 * with status 0, keeping them apart from a retryable 5xx, where the server did
 * answer and blaming the user's connection would be wrong. Status 0 also covers
 * a body that would not parse, which in practice is a proxy or captive portal
 * answering with HTML — still a connection problem from the player's side.
 */
function isTransportFailure(error: unknown): boolean {
  return isAuthRetryableFetchError(error) && error.status === 0
}

/** Pick the message to show the player for a failed auth call. */
export function authErrorMessageKey(error: unknown): TranslationKey {
  if (isTransportFailure(error)) return 'error.connectionIssue.message'

  const code = (error as { code?: unknown } | null)?.code
  if (typeof code !== 'string') return 'error.authError.message'

  return MESSAGE_BY_CODE.get(code) ?? 'error.authError.message'
}
