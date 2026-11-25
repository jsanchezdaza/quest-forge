export type AuthMode = 'signin' | 'signup' | 'reset' | 'update-password'

export function parseAuthMode(value: string | null): AuthMode {
  if (value === 'signup' || value === 'reset' || value === 'update-password') return value
  return 'signin'
}
