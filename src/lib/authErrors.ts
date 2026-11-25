import { isAuthRetryableFetchError } from '@supabase/supabase-js'
import type { TranslationKey } from '../i18n'

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

function isTransportFailure(error: unknown): boolean {
  return isAuthRetryableFetchError(error) && error.status === 0
}

export function authErrorMessageKey(error: unknown): TranslationKey {
  if (isTransportFailure(error)) return 'error.connectionIssue.message'

  const code = (error as { code?: unknown } | null)?.code
  if (typeof code !== 'string') return 'error.authError.message'

  return MESSAGE_BY_CODE.get(code) ?? 'error.authError.message'
}
