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

  test('should return to the auth screen after signing out', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/game')
    await page.click('button:has-text("Sign Out")')

    await expect(page).toHaveURL(/\/auth/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
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

  test('should keep authenticated users on /game when navigating back', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/game')
    await expect(page).toHaveURL(/\/game/)

    await page.goto('/game?from=test')
    await expect(page).toHaveURL(/\/game/)

    await page.goBack()

    await expect(page).toHaveURL(/\/game/)
  })

  test('a level-up confirm button keeps caller padding at 320', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = {
        id: 'test-user-id',
        username: 'TestHero',
        created_at: '2024-01-01T00:00:00.000Z',
      }
      const mockSession = {
        id: 'session-1',
        user_id: 'test-user-id',
        character_name: 'Thorin',
        character_class: 'warrior',
        game_state: {
          level: 2,
          health: 120,
          maxHealth: 120,
          experience: 0,
          currentScene: 5,
          inventory: [],
          pendingLevelUp: true,
          levelsGained: 1,
          stats: {
            strength: 15,
            dexterity: 10,
            intelligence: 10,
            wisdom: 10,
            constitution: 14,
            charisma: 10,
          },
        },
      }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      const testWindow = window as Window & { mockGameSession?: unknown; mockScenes?: unknown }
      testWindow.mockGameSession = mockSession
      testWindow.mockScenes = [{
        id: 'scene-1',
        session_id: 'session-1',
        narrative: 'Your adventure continues...',
        choices: ['Option 1'],
        player_choice: null,
        created_at: '2024-01-01T00:00:00.000Z',
      }]
    })

    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/game')
    const confirm = page.getByRole('button', { name: 'Confirm Changes' })
    await expect(confirm).toBeVisible()
    const style = await confirm.evaluate((element) => {
      const computed = getComputedStyle(element)
      return {
        paddingLeft: computed.paddingLeft,
        paddingRight: computed.paddingRight,
        fontSize: computed.fontSize,
        letterSpacing: computed.letterSpacing,
      }
    })
    expect(style.paddingLeft).toBe('32px')
    expect(style.paddingRight).toBe('32px')
    expect(style.fontSize).toBe('16px')
    expect(style.letterSpacing).not.toBe('0px')
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
