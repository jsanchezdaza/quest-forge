import { passwordRequirementStatus, VALIDATION_RULES } from '../constants/validation.ts'
import type { TranslationKey } from '../i18n'
import type { AuthMode } from './authMode'

export type AuthField = 'email' | 'username' | 'password'

export interface AuthFieldValues {
  email: string
  username: string
  password: string
}

const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

const FIELD_ORDER: Record<AuthMode, readonly AuthField[]> = {
  signin: ['email', 'password'],
  signup: ['email', 'username', 'password'],
  reset: ['email'],
  'update-password': ['password'],
}

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

  if (mode === 'reset') return null
  if (!value) return 'auth.passwordRequired'
  if (mode === 'signin') return null
  const status = passwordRequirementStatus(value)
  if (!status.minLength) return 'auth.passwordTooShort'
  if (!status.letter) return 'auth.passwordNeedsLetter'
  if (!status.number) return 'auth.passwordNeedsNumber'
  return null
}

export function firstInvalidAuthField(
  values: AuthFieldValues,
  mode: AuthMode,
): AuthField | null {
  for (const field of FIELD_ORDER[mode]) {
    if (authFieldError(field, values[field], mode)) return field
  }
  return null
}
