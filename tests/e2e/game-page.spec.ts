import { test, expect } from './setup'

test.describe('Game Page Navigation', () => {
  test('should display game page header with title and username', async ({ page }) => {

    await page.addInitScript(() => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com'
      }
      const mockProfile = {
        id: 'test-user-id',
        username: 'TestHero',
        created_at: new Date().toISOString()
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({
        user: mockUser,
        profile: mockProfile
      }))
    })

    await page.goto('/game')

    await expect(page.locator('h1')).toContainText('QUEST FORGE')
    await expect(page.locator('text=/WELCOME, TESTHERO/i')).toBeVisible()
  })

  test('should display sign out button', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/game')

    const signOutButton = page.locator('button', { hasText: 'Sign Out' })
    await expect(signOutButton).toBeVisible()
  })

  test('should display "Create Character" prompt when no session exists', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))

      ;(window as any).mockGameSession = null
    })

    await page.goto('/game')

    await page.waitForSelector('text="START YOUR ADVENTURE"', { timeout: 5000 })

    await expect(page.locator('h2')).toContainText('START YOUR ADVENTURE')
    await expect(page.locator('text=/CREATE A CHARACTER TO BEGIN/i')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Create Character' })).toBeVisible()
  })

  test('should open character creation modal when clicking "Create Character"', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = null
    })

    await page.goto('/game')
    await page.waitForSelector('button:has-text("Create Character")', { timeout: 5000 })

    await page.click('button:has-text("Create Character")')

    await expect(page.locator('text="Create Your Character"')).toBeVisible()
  })

  test('should display "New Character" button when session exists', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      const mockSession = {
        id: 'session-1',
        user_id: 'test-user-id',
        character_name: 'Thorin',
        character_class: 'warrior',
        game_state: {
          level: 1,
          health: 100,
          maxHealth: 100,
          experience: 0,
          currentScene: 0,
          inventory: [],
          stats: {
            strength: 15,
            dexterity: 10,
            intelligence: 10,
            wisdom: 10,
            constitution: 14,
            charisma: 10
          }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
    })

    await page.goto('/game')

    const newCharButton = page.locator('button', { hasText: /^New$|New Character/ })
    await expect(newCharButton).toBeVisible()
  })

  test('should display loading spinner while loading session', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))

      ;(window as any).mockLoadingDelay = 1000
    })

    await page.goto('/game')

    const loadingText = page.locator('text="Loading your adventure..."')

    await expect(loadingText).toBeVisible({ timeout: 2000 })
  })

  test('should open new character modal when clicking "New Character" button', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      const mockSession = {
        id: 'session-1',
        user_id: 'test-user-id',
        character_name: 'Thorin',
        character_class: 'warrior',
        game_state: {
          level: 1,
          health: 100,
          maxHealth: 100,
          experience: 0,
          currentScene: 0,
          inventory: [],
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
    })

    await page.goto('/game')

    const newCharButton = page.locator('button', { hasText: /^New$|New Character/ }).first()
    await newCharButton.click()

    await expect(page.locator('text="Create Your Character"')).toBeVisible()
  })

  test('should have responsive header layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone size

    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
    })

    await page.goto('/game')

    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Sign Out' })).toBeVisible()

    const signOutButton = page.locator('button', { hasText: 'Sign Out' })
    const box = await signOutButton.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  })
})
