export type AuthMode = 'signin' | 'signup' | 'reset' | 'update-password'

/**
 * `signup` opens sign-up, `reset` opens the recovery email form, and
 * `update-password` opens the new-password card the recovery link lands on.
 * Every other value opens sign-in.
 */
export function parseAuthMode(value: string | null): AuthMode {
  if (value === 'signup' || value === 'reset' || value === 'update-password') return value
  return 'signin'
}
