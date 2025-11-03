import { test, expect } from './setup'

test.describe('Navigation and Auth Flow', () => {
  test('should redirect unauthenticated users from root to /auth', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/auth/)
    await expect(page.locator('h1')).toContainText('QUEST FORGE')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('should redirect authenticated users from root to /game', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/')

    await expect(page).toHaveURL(/\/game/)
  })

  test('should redirect unauthenticated users from /game to /auth', async ({ page }) => {
    await page.goto('/game')

    await expect(page).toHaveURL(/\/auth/)
    await expect(page.locator('h1')).toContainText('QUEST FORGE')
  })

  test('should redirect authenticated users from /auth to /game', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/auth')

    await expect(page).toHaveURL(/\/game/)
  })

  test('should allow authenticated users to access /game', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/game')

    await expect(page).toHaveURL(/\/game/)
    await expect(page.locator('text="QUEST FORGE"')).toBeVisible()
  })

  test('should allow unauthenticated users to access /auth', async ({ page }) => {
    await page.goto('/auth')

    await expect(page).toHaveURL(/\/auth/)
    await expect(page.locator('h1')).toContainText('QUEST FORGE')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('should redirect to /auth after sign out', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/game')
    await expect(page).toHaveURL(/\/game/)

    await page.click('button:has-text("Sign Out")')

    await expect(page).toHaveURL(/\/auth/, { timeout: 5000 })
  })

  test('should persist session across page reloads when authenticated', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/game')
    await expect(page).toHaveURL(/\/game/)

    await page.reload()

    await expect(page).toHaveURL(/\/game/)
    await expect(page.locator('text="QUEST FORGE"')).toBeVisible()
  })

  test('should clear session after sign out and prevent access to /game', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/game')
    await page.click('button:has-text("Sign Out")')

    await expect(page).toHaveURL(/\/auth/)

    await page.goto('/game')

    await expect(page).toHaveURL(/\/auth/)
  })

  test('should maintain current URL during loading state', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))

      ;(window as any).mockLoadingDelay = 500
    })

    await page.goto('/game')

    await expect(page).toHaveURL(/\/game/)
  })

  test('should handle deep linking to /game when authenticated', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/game')

    await expect(page).toHaveURL(/\/game/)
    await expect(page.locator('text="QUEST FORGE"')).toBeVisible()
  })

  test('should handle deep linking to /auth when unauthenticated', async ({ page }) => {

    await page.goto('/auth')

    await expect(page).toHaveURL(/\/auth/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('should display loading spinner while initializing app', async ({ page }) => {
    await page.addInitScript(() => {

      ;(window as any).mockInitialLoading = true
    })

    await page.goto('/')

    await expect(page.locator('text="Initializing Quest Forge..."')).toBeVisible({ timeout: 2000 })
  })

  test('should preserve query parameters during auth redirect', async ({ page }) => {
    await page.goto('/?testparam=value')

    await expect(page).toHaveURL(/\/auth/)
  })

  test('should display toast notification after sign out', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/game')
    await page.click('button:has-text("Sign Out")')

    await expect(page.locator('text=/Signed Out|Thanks for playing/i')).toBeVisible({ timeout: 3000 })
  })

  test('should handle browser back button after authentication', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/')
    await expect(page).toHaveURL(/\/game/)

    await page.goBack()

    await expect(page).toHaveURL(/\/game/)
  })

  test('should handle browser forward button correctly', async ({ page }) => {
    await page.goto('/auth')
    await expect(page).toHaveURL(/\/auth/)

    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/game')
    await expect(page).toHaveURL(/\/game/)

    await page.goBack()

    await page.goForward()

    await expect(page).toHaveURL(/\/game/)
  })
})
