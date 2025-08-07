export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_REQUIRED: true,
  USERNAME_REQUIRED: true,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
} as const

export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_MIN_LENGTH: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`,
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_MIN_LENGTH: `Username must be at least ${VALIDATION_RULES.USERNAME_MIN_LENGTH} characters`,
  USERNAME_MAX_LENGTH: `Username must be less than ${VALIDATION_RULES.USERNAME_MAX_LENGTH} characters`,
} as const