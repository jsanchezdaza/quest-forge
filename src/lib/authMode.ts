export type AuthMode = 'signin' | 'signup'

/**
 * `signup` opens sign-up. Every other value opens sign-in, including `reset`
 * until password recovery (#36) adds that view here.
 */
export function parseAuthMode(value: string | null): AuthMode {
  return value === 'signup' ? 'signup' : 'signin'
}
