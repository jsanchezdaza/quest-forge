import { test as base } from '@playwright/test'

if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = 'https://mock.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'mock-anon-key'
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      (window as any).mockSupabaseAuth = true
    })
    
    await use(page)
  },
})

export { expect } from '@playwright/test'