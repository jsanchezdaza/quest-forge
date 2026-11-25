import { test as base } from '@playwright/test'

export interface TestHooks extends Window {
  mockSupabaseAuth?: boolean
  mockGameSession?: unknown
  mockScenes?: unknown
  mockLoadingDelay?: number
  mockLoading?: boolean
  mockIsGenerating?: boolean
  mockInitialLoading?: boolean
  mockPasswordRecovery?: boolean
  mockCreateCharacterSuccess?: boolean
}

if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = 'https://mock.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'mock-anon-key'
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      (window as TestHooks).mockSupabaseAuth = true
    })
    
    await use(page)
  },
})

export { expect } from '@playwright/test'