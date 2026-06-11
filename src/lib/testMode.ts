// Test-only seam. The e2e suite (see tests/e2e) injects mock auth and game
// data through window globals and localStorage instead of hitting Supabase.
// This module is the single place production code reads those hooks, keeping
// the test wiring isolated. It is inert outside the e2e harness because
// isTestMode() is gated on a flag only the test fixture sets.
import type { GameSession, Scene, User, UserProfile } from '../types'

interface MockAuth {
  user: User
  profile: UserProfile
}

type TestWindow = Window & {
  mockSupabaseAuth?: boolean
  mockGameSession?: GameSession | null
  mockScenes?: Scene[]
  mockLoadingDelay?: number
  mockLoading?: boolean
  mockIsGenerating?: boolean
  mockInitialLoading?: boolean
}

function testWindow(): TestWindow | null {
  return typeof window === 'undefined' ? null : (window as TestWindow)
}

export function isTestMode(): boolean {
  return testWindow()?.mockSupabaseAuth === true
}

export function getMockAuth(): MockAuth | null {
  try {
    const raw = localStorage.getItem('sb-mock-auth-token')
    return raw ? (JSON.parse(raw) as MockAuth) : null
  } catch {
    return null
  }
}

export function getMockGameSession(): GameSession | null {
  return testWindow()?.mockGameSession ?? null
}

export function getMockScenes(): Scene[] {
  return testWindow()?.mockScenes ?? []
}

export function getMockLoadingDelay(): number {
  return testWindow()?.mockLoadingDelay ?? 0
}

export function isMockLoading(): boolean {
  return testWindow()?.mockLoading === true
}

export function isMockGenerating(): boolean {
  return testWindow()?.mockIsGenerating === true
}

export function isMockInitialLoading(): boolean {
  return testWindow()?.mockInitialLoading === true
}
