import type { TranslationKey } from '../i18n'

interface AuthError {
  message: string
  code?: string
}

interface AuthErrorKeys {
  titleKey: TranslationKey
  messageKey: TranslationKey
}

const errorMappings: Record<string, AuthErrorKeys> = {
  invalid_credentials: { titleKey: 'error.loginFailed.title', messageKey: 'error.loginFailed.message' },
  email_not_confirmed: { titleKey: 'error.emailNotConfirmed.title', messageKey: 'error.emailNotConfirmed.message' },
  user_not_found: { titleKey: 'error.userNotFound.title', messageKey: 'error.userNotFound.message' },
  weak_password: { titleKey: 'error.weakPassword.title', messageKey: 'error.weakPassword.message' },
  email_address_invalid: { titleKey: 'error.invalidEmail.title', messageKey: 'error.invalidEmail.message' },
  signup_disabled: { titleKey: 'error.signupDisabled.title', messageKey: 'error.signupDisabled.message' },
  email_address_not_authorized: { titleKey: 'error.emailNotAuthorized.title', messageKey: 'error.emailNotAuthorized.message' },
  too_many_requests: { titleKey: 'error.tooManyRequests.title', messageKey: 'error.tooManyRequests.message' },
}

export const parseAuthError = (error: unknown): AuthErrorKeys => {
  const authError = error as AuthError

  // Check for specific error codes
  if (authError?.code && errorMappings[authError.code]) {
    return errorMappings[authError.code]
  }

  // Check for error message patterns
  const message = authError?.message?.toLowerCase() || ''

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return errorMappings.invalid_credentials
  }

  if (message.includes('email not confirmed')) {
    return errorMappings.email_not_confirmed
  }

  if (message.includes('user not found')) {
    return errorMappings.user_not_found
  }

  if (message.includes('weak password') || message.includes('password')) {
    return errorMappings.weak_password
  }

  if (message.includes('invalid email') || message.includes('email')) {
    return errorMappings.email_address_invalid
  }

  if (message.includes('too many requests') || message.includes('rate limit')) {
    return errorMappings.too_many_requests
  }

  if (message.includes('user profile not found') || message.includes('complete registration')) {
    return { titleKey: 'error.completeRegistration.title', messageKey: 'error.completeRegistration.message' }
  }

  if (message.includes('profile fetch') || message.includes('timeout')) {
    return { titleKey: 'error.connectionIssue.title', messageKey: 'error.connectionIssue.message' }
  }

  // Fallback for unknown errors
  return { titleKey: 'error.authError.title', messageKey: 'error.authError.message' }
}
