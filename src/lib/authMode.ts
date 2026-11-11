export type AuthMode = 'signin' | 'signup' | 'reset'

/**
 * `signup` opens sign-up and `reset` opens password recovery. Every other
 * value opens sign-in. `update-password` stays sign-in until #37.
 */
export function parseAuthMode(value: string | null): AuthMode {
  if (value === 'signup' || value === 'reset') return value
  return 'signin'
}
