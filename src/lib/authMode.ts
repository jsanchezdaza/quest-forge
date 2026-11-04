/**
 * Views selected by `?mode=`. Sign-in is the default and has no query value.
 * Add a key here when a new view ships. Password recovery (`reset`, #36) is
 * intentionally absent, so it opens sign-in like any other unknown mode.
 */
const AUTH_MODES = {
  signup: 'signup',
} as const

type KnownAuthMode = keyof typeof AUTH_MODES

export type AuthMode = 'signin' | KnownAuthMode

function isKnownAuthMode(value: string): value is KnownAuthMode {
  return Object.prototype.hasOwnProperty.call(AUTH_MODES, value)
}

export function parseAuthMode(value: string | null): AuthMode {
  if (value !== null && isKnownAuthMode(value)) {
    return AUTH_MODES[value]
  }
  return 'signin'
}
