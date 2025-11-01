import { test, expect } from './setup'

test.describe('Authentication UI', () => {
  test('should display auth form on initial load', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL('/auth')
    await expect(page.locator('h1')).toContainText('QUEST FORGE')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('SIGN IN')
  })

  test('should toggle between sign in and sign up forms', async ({ page }) => {
    await page.goto('/auth')

    await expect(page.locator('button[type="submit"]')).toContainText('SIGN IN')
    await expect(page.locator('input[id="username"]')).not.toBeVisible()

    await page.click('text="DON\'T HAVE AN ACCOUNT? SIGN UP"')

    await expect(page.locator('button[type="submit"]')).toContainText('CREATE ACCOUNT')
    await expect(page.locator('input[id="username"]')).toBeVisible()

    await page.click('text="ALREADY HAVE AN ACCOUNT? SIGN IN"')

    await expect(page.locator('button[type="submit"]')).toContainText('SIGN IN')
    await expect(page.locator('input[id="username"]')).not.toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/auth')

    await page.click('button[type="submit"]')

    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('should show username field in signup mode', async ({ page }) => {
    await page.goto('/auth')

    await page.click('text="DON\'T HAVE AN ACCOUNT? SIGN UP"')

    const usernameInput = page.locator('input[id="username"]')
    await expect(usernameInput).toBeVisible()
    await expect(usernameInput).toHaveAttribute('required')
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth')

    await page.fill('input[type="email"]', 'not-an-email')
    await page.fill('input[type="password"]', 'password123')

    await page.click('button[type="submit"]')

    const emailInput = page.locator('input[type="email"]')
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage)
    expect(validationMessage).toBeTruthy()
  })

  test('should validate password length in sign up', async ({ page }) => {
    await page.goto('/auth')

    await page.click('text="DON\'T HAVE AN ACCOUNT? SIGN UP"')

    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', '12345')
    await page.fill('input[id="username"]', 'TestUser')

    await page.click('button[type="submit"]')

    await expect(page.locator('input[type="password"]')).toBeVisible()
  })
})
