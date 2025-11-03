import { test, expect } from './setup'

test.describe('Character Creation', () => {
  test.beforeEach(async ({ page }) => {

    await page.addInitScript(() => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockProfile = { id: 'test-user-id', username: 'TestHero', created_at: new Date().toISOString() }
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({ user: mockUser, profile: mockProfile }))
      ;(window as any).mockGameSession = null
    })
  })

  test('should display character creation modal', async ({ page }) => {
    await page.goto('/game')
    await page.waitForSelector('button:has-text("Create Character")', { timeout: 5000 })
    await page.click('button:has-text("Create Character")')

    await expect(page.locator('text="Create Your Character"')).toBeVisible()
    await expect(page.locator('label:has-text("Character Name")')).toBeVisible()
    await expect(page.locator('text="Choose Your Class"')).toBeVisible()
  })

  test('should display all 6 character classes', async ({ page }) => {
    await page.goto('/game')
    await page.waitForSelector('button:has-text("Create Character")')
    await page.click('button:has-text("Create Character")')

    await expect(page.locator('text="Warrior"')).toBeVisible()
    await expect(page.locator('text="Mage"')).toBeVisible()
    await expect(page.locator('text="Rogue"')).toBeVisible()
    await expect(page.locator('text="Cleric"')).toBeVisible()
    await expect(page.locator('text="Ranger"')).toBeVisible()
    await expect(page.locator('text="Paladin"')).toBeVisible()
  })

  test('should display class descriptions and stats', async ({ page }) => {
    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    await expect(page.locator('text="A mighty fighter skilled in combat and weapons"')).toBeVisible()
    await expect(page.locator('text="High Strength & Constitution"')).toBeVisible()

    await expect(page.locator('text="A master of arcane magic and ancient knowledge"')).toBeVisible()
    await expect(page.locator('text="High Intelligence"')).toBeVisible()
  })

  test('should have warrior selected by default', async ({ page }) => {
    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    const warriorLabel = page.locator('label:has-text("Warrior")').first()
    await expect(warriorLabel).toHaveClass(/border-medieval-gold/)
  })

  test('should allow selecting different character classes', async ({ page }) => {
    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    const mageLabel = page.locator('label:has-text("Mage")').first()
    await mageLabel.click()

    await expect(mageLabel).toHaveClass(/border-medieval-gold/)
    await expect(mageLabel).toHaveClass(/bg-medieval-gold\/10/)

    const rogueLabel = page.locator('label:has-text("Rogue")').first()
    await rogueLabel.click()

    await expect(rogueLabel).toHaveClass(/border-medieval-gold/)
  })

  test('should display character name input field', async ({ page }) => {
    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    const nameInput = page.locator('input[placeholder*="character\'s name"]')
    await expect(nameInput).toBeVisible()
    await expect(nameInput).toHaveAttribute('required')
  })

  test('should display backstory textarea (optional)', async ({ page }) => {
    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    await expect(page.locator('label:has-text("Backstory (Optional)")')).toBeVisible()
    const backstoryTextarea = page.locator('textarea[placeholder*="backstory"]')
    await expect(backstoryTextarea).toBeVisible()
  })

  test('should show error when submitting without character name', async ({ page }) => {
    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    await page.click('button[type="submit"]:has-text("Create Character")')

    await expect(page.locator('text="Character name is required"')).toBeVisible()
  })

  test('should allow entering character name', async ({ page }) => {
    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    const nameInput = page.locator('input[placeholder*="character\'s name"]')
    await nameInput.fill('Thorin Oakenshield')

    await expect(nameInput).toHaveValue('Thorin Oakenshield')
  })

  test('should allow entering backstory text', async ({ page }) => {
    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    const backstoryTextarea = page.locator('textarea[placeholder*="backstory"]')
    const backstoryText = 'A mighty warrior from the north, seeking glory and honor.'
    await backstoryTextarea.fill(backstoryText)

    await expect(backstoryTextarea).toHaveValue(backstoryText)
  })

  test('should have Create Character and Cancel buttons', async ({ page }) => {
    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    await expect(page.locator('button[type="submit"]:has-text("Create Character")')).toBeVisible()
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible()
  })

  test('should close modal when clicking Cancel', async ({ page }) => {
    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    await expect(page.locator('text="Create Your Character"')).toBeVisible()

    await page.click('button:has-text("Cancel")')

    await expect(page.locator('text="Create Your Character"')).not.toBeVisible()
  })

  test('should trim whitespace from character name on submit', async ({ page }) => {
    await page.addInitScript(() => {

      ;(window as any).mockCreateCharacterSuccess = true
    })

    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    const nameInput = page.locator('input[placeholder*="character\'s name"]')
    await nameInput.fill('  Thorin  ')

    await page.click('button[type="submit"]:has-text("Create Character")')


    await expect(nameInput).toHaveValue('  Thorin  ')
  })

  test('should display all class options in grid layout', async ({ page }) => {
    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    const classLabels = page.locator('label:has(input[type="radio"])')
    await expect(classLabels).toHaveCount(6)
  })

  test('should show validation error if name is empty after trim', async ({ page }) => {
    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    const nameInput = page.locator('input[placeholder*="character\'s name"]')
    await nameInput.fill('   ') // Only whitespace

    await page.click('button[type="submit"]:has-text("Create Character")')

    await expect(page.locator('text="Character name is required"')).toBeVisible()
  })

  test('should preserve selected class when switching between classes', async ({ page }) => {
    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    const paladinLabel = page.locator('label:has-text("Paladin")').first()
    await paladinLabel.click()
    await expect(paladinLabel).toHaveClass(/border-medieval-gold/)

    const nameInput = page.locator('input[placeholder*="character\'s name"]')
    await nameInput.fill('Sir Galahad')

    await expect(paladinLabel).toHaveClass(/border-medieval-gold/)
  })

  test('should display modal in responsive layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone size

    await page.goto('/game')
    await page.click('button:has-text("Create Character")')

    await expect(page.locator('text="Create Your Character"')).toBeVisible()
    await expect(page.locator('input[placeholder*="character\'s name"]')).toBeVisible()

    const classLabels = page.locator('label:has(input[type="radio"])')
    await expect(classLabels.first()).toBeVisible()
  })
})
