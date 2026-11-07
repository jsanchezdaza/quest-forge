export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REQUIRED: true,
  USERNAME_REQUIRED: true,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
} as const

/**
 * Client checks for a new password. Sign-in does not use them.
 *
 * Length is `password.length`: UTF-16 code units, not Unicode code points.
 * A letter is ASCII A–Z or a–z. A digit is ASCII 0–9. Accented letters,
 * emoji, and whitespace are neither. Whitespace is not trimmed, so it does
 * count toward the length.
 *
 * This is not a verified match for the Supabase Auth password policy.
 */
const PASSWORD_LETTER = /[A-Za-z]/
const PASSWORD_DIGIT = /[0-9]/

export interface PasswordRequirementStatus {
  minLength: boolean
  letter: boolean
  number: boolean
}

/** Which new-password rules a value already meets. An empty password meets none. */
export function passwordRequirementStatus(password: string): PasswordRequirementStatus {
  return {
    minLength: password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH,
    letter: PASSWORD_LETTER.test(password),
    number: PASSWORD_DIGIT.test(password),
  }
}
