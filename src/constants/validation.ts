export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REQUIRED: true,
  USERNAME_REQUIRED: true,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
} as const

const PASSWORD_LETTER = /[A-Za-z]/
const PASSWORD_DIGIT = /[0-9]/

export interface PasswordRequirementStatus {
  minLength: boolean
  letter: boolean
  number: boolean
}

export function passwordRequirementStatus(password: string): PasswordRequirementStatus {
  return {
    minLength: password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH,
    letter: PASSWORD_LETTER.test(password),
    number: PASSWORD_DIGIT.test(password),
  }
}
