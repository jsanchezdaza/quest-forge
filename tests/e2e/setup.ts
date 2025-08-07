import { test as base } from '@playwright/test'

// Set up test environment variables if they don't exist
if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = 'https://mock.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'mock-anon-key'
}

export const test = base.extend({
  page: async ({ page }, use) => {
    // Mock Supabase auth for tests
    await page.addInitScript(() => {
      // Mock window.supabase if needed
      (window as any).mockSupabaseAuth = true
    })
    
    await use(page)
  },
})

export { expect } from '@playwright/test'