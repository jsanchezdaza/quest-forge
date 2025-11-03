import { test, expect } from './setup'

test.describe('Character Level Up and Progression', () => {
  test('should display level up modal when pendingLevelUp is true', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
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
            charisma: 10
          }
        }
      }

      const mockScene = {
        id: 'scene-1',
        session_id: 'session-1',
        narrative: 'Your adventure continues...',
        choices: ['Option 1', 'Option 2'],
        player_choice: null,
        created_at: new Date().toISOString()
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [mockScene]
    })

    await page.goto('/game')

    await expect(page.locator('text="Level Up!"')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text="Congratulations! You have reached level 2"')).toBeVisible()
  })

  test('should display available attribute points', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
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
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [{ id: 'scene-1', session_id: 'session-1', narrative: 'Test', choices: [], player_choice: null }]
    })

    await page.goto('/game')

    await expect(page.locator('text=/You have 3 attribute points to distribute/i')).toBeVisible({ timeout: 5000 })
  })

  test('should display all six character stats', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
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
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [{ id: 'scene-1', session_id: 'session-1', narrative: 'Test', choices: [], player_choice: null }]
    })

    await page.goto('/game')
    await page.waitForSelector('text="Level Up!"', { timeout: 5000 })

    await expect(page.locator('text="Strength"').first()).toBeVisible()
    await expect(page.locator('text="Dexterity"').first()).toBeVisible()
    await expect(page.locator('text="Intelligence"').first()).toBeVisible()
    await expect(page.locator('text="Wisdom"').first()).toBeVisible()
    await expect(page.locator('text="Constitution"').first()).toBeVisible()
    await expect(page.locator('text="Charisma"').first()).toBeVisible()
  })

  test('should display current stat values', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
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
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [{ id: 'scene-1', session_id: 'session-1', narrative: 'Test', choices: [], player_choice: null }]
    })

    await page.goto('/game')
    await page.waitForSelector('text="Level Up!"', { timeout: 5000 })

    await expect(page.locator('text=/15\\s*→\\s*15/')).toBeVisible()
    await expect(page.locator('text=/10\\s*→\\s*10/').first()).toBeVisible()
  })

  test('should have plus buttons for each stat', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
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
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [{ id: 'scene-1', session_id: 'session-1', narrative: 'Test', choices: [], player_choice: null }]
    })

    await page.goto('/game')
    await page.waitForSelector('text="Level Up!"', { timeout: 5000 })

    const plusButtons = page.locator('button:has-text("+")')
    await expect(plusButtons).toHaveCount(6)
  })

  test('should allow allocating points to a stat', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
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
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [{ id: 'scene-1', session_id: 'session-1', narrative: 'Test', choices: [], player_choice: null }]
    })

    await page.goto('/game')
    await page.waitForSelector('text="Level Up!"', { timeout: 5000 })

    const strengthRow = page.locator('text="Strength"').locator('..')
    const plusButton = strengthRow.locator('button:has-text("+")').first()
    await plusButton.click()

    await expect(page.locator('text="+1"').first()).toBeVisible()

    await expect(page.locator('text=/You have 2 attribute points/i')).toBeVisible()

    await expect(page.locator('text=/15\\s*→\\s*16/')).toBeVisible()
  })

  test('should allow allocating all available points', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
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
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [{ id: 'scene-1', session_id: 'session-1', narrative: 'Test', choices: [], player_choice: null }]
    })

    await page.goto('/game')
    await page.waitForSelector('text="Level Up!"', { timeout: 5000 })

    const strengthRow = page.locator('text="Strength"').locator('..')
    const plusButton = strengthRow.locator('button:has-text("+")').first()

    await plusButton.click() // Point 1
    await plusButton.click() // Point 2
    await plusButton.click() // Point 3

    await expect(page.locator('text=/You have 0 attribute points/i')).toBeVisible()
  })

  test('should disable plus buttons when no points remain', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
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
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [{ id: 'scene-1', session_id: 'session-1', narrative: 'Test', choices: [], player_choice: null }]
    })

    await page.goto('/game')
    await page.waitForSelector('text="Level Up!"', { timeout: 5000 })

    const strengthRow = page.locator('text="Strength"').locator('..')
    const plusButton = strengthRow.locator('button:has-text("+")').first()

    await plusButton.click()
    await plusButton.click()
    await plusButton.click()

    const allPlusButtons = page.locator('button:has-text("+")')
    await expect(allPlusButtons.first()).toBeDisabled()
  })

  test('should have Confirm Changes button', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
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
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [{ id: 'scene-1', session_id: 'session-1', narrative: 'Test', choices: [], player_choice: null }]
    })

    await page.goto('/game')
    await page.waitForSelector('text="Level Up!"', { timeout: 5000 })

    await expect(page.locator('button:has-text("Confirm Changes")')).toBeVisible()
  })

  test('should disable Confirm button until all points are allocated', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
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
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [{ id: 'scene-1', session_id: 'session-1', narrative: 'Test', choices: [], player_choice: null }]
    })

    await page.goto('/game')
    await page.waitForSelector('text="Level Up!"', { timeout: 5000 })

    const confirmButton = page.locator('button:has-text("Confirm Changes")')
    await expect(confirmButton).toBeDisabled()
  })

  test('should enable Confirm button after all points are allocated', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
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
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [{ id: 'scene-1', session_id: 'session-1', narrative: 'Test', choices: [], player_choice: null }]
    })

    await page.goto('/game')
    await page.waitForSelector('text="Level Up!"', { timeout: 5000 })

    const plusButton = page.locator('button:has-text("+")').first()
    await plusButton.click()
    await plusButton.click()
    await plusButton.click()

    const confirmButton = page.locator('button:has-text("Confirm Changes")')
    await expect(confirmButton).toBeEnabled()
  })

  test('should handle multiple levels gained', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      const mockSession = {
        id: 'session-1',
        user_id: 'test-user-id',
        character_name: 'Thorin',
        character_class: 'warrior',
        game_state: {
          level: 3,
          health: 140,
          maxHealth: 140,
          experience: 0,
          currentScene: 10,
          inventory: [],
          pendingLevelUp: true,
          levelsGained: 2, // Gained 2 levels
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [{ id: 'scene-1', session_id: 'session-1', narrative: 'Test', choices: [], player_choice: null }]
    })

    await page.goto('/game')
    await page.waitForSelector('text="Level Up!"', { timeout: 5000 })

    await expect(page.locator('text=/You have 6 attribute points/i')).toBeVisible()
  })

  test('should prevent closing modal with unspent points', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
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
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [{ id: 'scene-1', session_id: 'session-1', narrative: 'Test', choices: [], player_choice: null }]
    })

    await page.goto('/game')
    await page.waitForSelector('text="Level Up!"', { timeout: 5000 })

    await page.keyboard.press('Escape')

    await expect(page.locator('text="Level Up!"')).toBeVisible()
  })
})
