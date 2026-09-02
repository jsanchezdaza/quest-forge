import { test, expect } from './setup'
import { VALIDATION_RULES } from '../../src/constants/validation'

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

  test('a failed sign in shows the reason on the auth form', async ({ page }) => {
    await page.route('**/auth/v1/token**', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }),
      })
    )

    await page.goto('/auth')

    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'wrong-password')
    await page.click('button[type="submit"]')

    await expect(page.getByRole('alert')).toContainText('Invalid login credentials')
  })

  test('a failed sign up shows the reason on the auth form', async ({ page }) => {
    await page.route('**/auth/v1/signup**', (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error_code: 'user_already_exists', msg: 'User already registered' }),
      })
    )

    await page.goto('/auth')

    await page.click('text="DON\'T HAVE AN ACCOUNT? SIGN UP"')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'strong-password')
    await page.fill('input[id="username"]', 'TestUser')
    await page.click('button[type="submit"]')

    await expect(page.getByRole('alert')).toContainText('User already registered')
  })

  test('a sign up with a blank username shows the reason on the auth form', async ({ page }) => {
    await page.goto('/auth')

    await page.click('text="DON\'T HAVE AN ACCOUNT? SIGN UP"')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'strong-password')
    await page.fill('input[id="username"]', ' '.repeat(VALIDATION_RULES.USERNAME_MIN_LENGTH + 2))
    await page.click('button[type="submit"]')

    await expect(page.getByRole('alert')).toContainText('Please choose a username')
  })

  test('a failure cannot land on the other form by switching mode mid-request', async ({ page }) => {
    await page.route('**/auth/v1/token**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }),
      })
    })

    await page.goto('/auth')

    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'wrong-password')
    await page.click('button[type="submit"]')

    await expect(page.getByRole('button', { name: "DON'T HAVE AN ACCOUNT? SIGN UP" })).toBeDisabled()

    await expect(page.getByRole('alert')).toContainText('Invalid login credentials')
    await expect(page.locator('button[type="submit"]')).toContainText('SIGN IN')
  })

  test('switching between sign in and sign up clears a previous failure', async ({ page }) => {
    await page.route('**/auth/v1/token**', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }),
      })
    )

    await page.goto('/auth')

    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'wrong-password')
    await page.click('button[type="submit"]')
    await expect(page.getByRole('alert')).toBeVisible()

    await page.click('text="DON\'T HAVE AN ACCOUNT? SIGN UP"')

    await expect(page.getByRole('alert')).not.toBeVisible()
  })
})
