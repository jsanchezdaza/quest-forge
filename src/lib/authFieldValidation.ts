import { VALIDATION_RULES } from '../constants/validation.ts'
import type { TranslationKey } from '../i18n'
import type { AuthMode } from './authMode'

export type AuthField = 'email' | 'username' | 'password'

export interface AuthFieldValues {
  email: string
  username: string
  password: string
}

/**
 * HTML's email grammar, the same one `input type="email"` uses. A dot in the
 * domain is not required (`a@b` is valid).
 */
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

const FIELD_ORDER: Record<AuthMode, readonly AuthField[]> = {
  signin: ['email', 'password'],
  signup: ['email', 'username', 'password'],
}

/** Format error for one auth field, or null when the current rules accept it. */
export function authFieldError(
  field: AuthField,
  value: string,
  mode: AuthMode,
): TranslationKey | null {
  if (field === 'email') {
    const email = value.trim()
    if (!email) return 'auth.emailRequired'
    if (!EMAIL_PATTERN.test(email)) return 'auth.emailInvalid'
    return null
  }

  if (field === 'username') {
    if (mode !== 'signup') return null
    const username = value.trim()
    if (!username) return 'auth.usernameRequired'
    if (username.length < VALIDATION_RULES.USERNAME_MIN_LENGTH) return 'auth.usernameTooShort'
    if (username.length > VALIDATION_RULES.USERNAME_MAX_LENGTH) return 'auth.usernameTooLong'
    return null
  }

  if (!value) return 'auth.passwordRequired'
  if (value.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) return 'auth.passwordTooShort'
  return null
}

/** First field that fails the current rules, in form order, or null when all pass. */
export function firstInvalidAuthField(
  values: AuthFieldValues,
  mode: AuthMode,
): AuthField | null {
  for (const field of FIELD_ORDER[mode]) {
    if (authFieldError(field, values[field], mode)) return field
  }
  return null
}
