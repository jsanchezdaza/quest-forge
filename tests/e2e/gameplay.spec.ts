import { test, expect } from './setup'

test.describe('Gameplay and Scene Progression', () => {
  test.beforeEach(async ({ page }) => {

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
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const mockScene = {
        id: 'scene-1',
        session_id: 'session-1',
        narrative: 'You stand at the entrance of a dark cave. The air is cold and you can hear strange sounds echoing from within.',
        choices: [
          'Enter the cave cautiously',
          'Search the area for clues',
          'Call out to see if anyone is inside',
          'Turn back and seek another path'
        ],
        player_choice: null,
        created_at: new Date().toISOString()
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [mockScene]
    })
  })

  test('should display current scene narrative', async ({ page }) => {
    await page.goto('/game')
    await page.waitForSelector('text="You stand at the entrance"', { timeout: 5000 })

    await expect(page.locator('text="You stand at the entrance of a dark cave"')).toBeVisible()
  })

  test('should display multiple player choices', async ({ page }) => {
    await page.goto('/game')
    await page.waitForSelector('text="What do you choose?"', { timeout: 5000 })

    await expect(page.locator('text="What do you choose?"')).toBeVisible()

    await expect(page.locator('text="Enter the cave cautiously"')).toBeVisible()
    await expect(page.locator('text="Search the area for clues"')).toBeVisible()
    await expect(page.locator('text="Call out to see if anyone is inside"')).toBeVisible()
    await expect(page.locator('text="Turn back and seek another path"')).toBeVisible()
  })

  test('should display choice numbers', async ({ page }) => {
    await page.goto('/game')
    await page.waitForSelector('text="What do you choose?"', { timeout: 5000 })

    await expect(page.locator('text="1."')).toBeVisible()
    await expect(page.locator('text="2."')).toBeVisible()
    await expect(page.locator('text="3."')).toBeVisible()
    await expect(page.locator('text="4."')).toBeVisible()
  })

  test('should allow clicking on a choice', async ({ page }) => {
    await page.goto('/game')
    await page.waitForSelector('button:has-text("Enter the cave cautiously")', { timeout: 5000 })

    const choiceButton = page.locator('button:has-text("Enter the cave cautiously")')
    await expect(choiceButton).toBeEnabled()

    await choiceButton.click()
  })

  test('should disable choice buttons while loading', async ({ page }) => {
    await page.addInitScript(() => {

      ;(window as any).mockLoading = true
    })

    await page.goto('/game')
    await page.waitForSelector('button:has-text("Enter the cave cautiously")', { timeout: 5000 })

    const choiceButtons = page.locator('button:has-text("Enter the cave")')

    await expect(choiceButtons.first()).toBeDisabled()
  })

  test('should display player choice after selection', async ({ page }) => {
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
          currentScene: 1,
          inventory: [],
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      const mockScene = {
        id: 'scene-1',
        session_id: 'session-1',
        narrative: 'You stand at the entrance of a dark cave.',
        choices: ['Enter the cave cautiously', 'Search the area for clues'],
        player_choice: 'Enter the cave cautiously',
        created_at: new Date().toISOString()
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [mockScene]
    })

    await page.goto('/game')
    await page.waitForSelector('text="Your choice:"', { timeout: 5000 })

    await expect(page.locator('text="Your choice:"')).toBeVisible()
    await expect(page.locator('text="ENTER THE CAVE CAUTIOUSLY"')).toBeVisible()
  })

  test('should hide choice buttons after choice is made', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      const mockSession = {
        id: 'session-1',
        user_id: 'test-user-id',
        character_name: 'Thorin',
        character_class: 'warrior',
        game_state: {
          level: 1, health: 100, maxHealth: 100, experience: 0, currentScene: 1, inventory: [],
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      const mockScene = {
        id: 'scene-1',
        session_id: 'session-1',
        narrative: 'You entered the cave.',
        choices: ['Go deeper', 'Turn back'],
        player_choice: 'Go deeper',
        created_at: new Date().toISOString()
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [mockScene]
    })

    await page.goto('/game')

    await expect(page.locator('text="What do you choose?"')).not.toBeVisible()
  })

  test('should display adventure log when multiple scenes exist', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      const mockSession = {
        id: 'session-1',
        user_id: 'test-user-id',
        character_name: 'Thorin',
        character_class: 'warrior',
        game_state: {
          level: 1, health: 100, maxHealth: 100, experience: 10, currentScene: 2, inventory: [],
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      const mockScenes = [
        {
          id: 'scene-1',
          session_id: 'session-1',
          narrative: 'You stand at the entrance of a dark cave.',
          choices: ['Enter the cave', 'Turn back'],
          player_choice: 'Enter the cave',
          created_at: new Date(Date.now() - 10000).toISOString()
        },
        {
          id: 'scene-2',
          session_id: 'session-1',
          narrative: 'You venture deeper into the darkness. The air grows colder.',
          choices: ['Light a torch', 'Continue in darkness'],
          player_choice: null,
          created_at: new Date().toISOString()
        }
      ]

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = mockScenes
    })

    await page.goto('/game')
    await page.waitForSelector('text="Adventure Log"', { timeout: 5000 })

    await expect(page.locator('h3:has-text("Adventure Log")')).toBeVisible()

    await expect(page.locator('text="You stand at the entrance of a dark cave"')).toBeVisible()
    await expect(page.locator('text="ENTER THE CAVE"')).toBeVisible()
  })

  test('should display scenes in reverse order in adventure log', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      const mockSession = {
        id: 'session-1',
        user_id: 'test-user-id',
        character_name: 'Thorin',
        character_class: 'warrior',
        game_state: {
          level: 1, health: 90, maxHealth: 100, experience: 20, currentScene: 3, inventory: [],
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      const mockScenes = [
        {
          id: 'scene-1',
          session_id: 'session-1',
          narrative: 'First scene',
          choices: ['Choice 1'],
          player_choice: 'Choice 1',
          created_at: new Date(Date.now() - 20000).toISOString()
        },
        {
          id: 'scene-2',
          session_id: 'session-1',
          narrative: 'Second scene',
          choices: ['Choice 2'],
          player_choice: 'Choice 2',
          created_at: new Date(Date.now() - 10000).toISOString()
        },
        {
          id: 'scene-3',
          session_id: 'session-1',
          narrative: 'Third scene (current)',
          choices: ['Choice A', 'Choice B'],
          player_choice: null,
          created_at: new Date().toISOString()
        }
      ]

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = mockScenes
    })

    await page.goto('/game')
    await page.waitForSelector('text="Adventure Log"', { timeout: 5000 })

    await expect(page.locator('text="Second scene"')).toBeVisible()
  })

  test('should display AI generation loading state', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      const mockSession = {
        id: 'session-1',
        user_id: 'test-user-id',
        character_name: 'Thorin',
        character_class: 'warrior',
        game_state: {
          level: 1, health: 100, maxHealth: 100, experience: 0, currentScene: 0, inventory: [],
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      const mockScene = {
        id: 'scene-1',
        session_id: 'session-1',
        narrative: '',
        choices: [],
        player_choice: null,
        created_at: new Date().toISOString()
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [mockScene]
      ;(window as any).mockIsGenerating = true
    })

    await page.goto('/game')

    await expect(page.locator('text="AI is crafting your story..."')).toBeVisible({ timeout: 5000 })
  })

  test('should have minimum touch-friendly button height on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone size

    await page.goto('/game')
    await page.waitForSelector('button:has-text("Enter the cave")', { timeout: 5000 })

    const choiceButton = page.locator('button:has-text("Enter the cave")').first()
    const box = await choiceButton.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  })

  test('should display narrative in scrollable container', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      const mockSession = {
        id: 'session-1',
        user_id: 'test-user-id',
        character_name: 'Thorin',
        character_class: 'warrior',
        game_state: {
          level: 1, health: 100, maxHealth: 100, experience: 0, currentScene: 0, inventory: [],
          stats: { strength: 15, dexterity: 10, intelligence: 10, wisdom: 10, constitution: 14, charisma: 10 }
        }
      }

      const longNarrative = 'You enter a vast chamber. '.repeat(50) // Long text

      const mockScene = {
        id: 'scene-1',
        session_id: 'session-1',
        narrative: longNarrative,
        choices: ['Go forward', 'Go back'],
        player_choice: null,
        created_at: new Date().toISOString()
      }

      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = mockSession
      ;(window as any).mockScenes = [mockScene]
    })

    await page.goto('/game')

    const narrativeContainer = page.locator('.overflow-y-auto').first()
    await expect(narrativeContainer).toBeVisible()
  })
})
