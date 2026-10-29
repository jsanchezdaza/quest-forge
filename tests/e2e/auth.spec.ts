import { test, expect, type Page } from './setup'
import { VALIDATION_RULES } from '../../src/constants/validation'

const emailField = (page: Page) => page.getByLabel(/email|correo/i)
const passwordField = (page: Page) => page.getByLabel(/password|contraseña/i)
const usernameField = (page: Page) => page.getByLabel(/username|nombre de usuario/i)
const signInButton = (page: Page) => page.getByRole('button', { name: /^sign in$/i })
const createAccountButton = (page: Page) => page.getByRole('button', { name: /^create account$/i })
const switchToSignUp = (page: Page) => page.getByRole('button', { name: /sign up$/i })
const switchToSignIn = (page: Page) => page.getByRole('button', { name: /already have an account/i })

const verticalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight)

test.describe('Authentication UI', () => {
  test('should display auth form on initial load', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL('/auth')
    await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()
    await expect(emailField(page)).toBeVisible()
    await expect(passwordField(page)).toBeVisible()
    await expect(signInButton(page)).toBeVisible()
  })

  test('should toggle between sign in and sign up forms', async ({ page }) => {
    await page.goto('/auth')

    await expect(signInButton(page)).toBeVisible()
    await expect(usernameField(page)).not.toBeVisible()

    await switchToSignUp(page).click()

    await expect(createAccountButton(page)).toBeVisible()
    await expect(usernameField(page)).toBeVisible()

    await switchToSignIn(page).click()

    await expect(signInButton(page)).toBeVisible()
    await expect(usernameField(page)).not.toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/auth')

    await signInButton(page).click()

    await expect(emailField(page)).toBeVisible()
    await expect(passwordField(page)).toBeVisible()
  })

  test('should show username field in signup mode', async ({ page }) => {
    await page.goto('/auth')

    await switchToSignUp(page).click()

    const usernameInput = usernameField(page)
    await expect(usernameInput).toBeVisible()
    await expect(usernameInput).toHaveAttribute('required')
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth')

    await emailField(page).fill('not-an-email')
    await passwordField(page).fill('password123')

    await signInButton(page).click()

    const validationMessage = await emailField(page).evaluate(
      (el: HTMLInputElement) => el.validationMessage
    )
    expect(validationMessage).toBeTruthy()
  })

  test('should validate password length in sign up', async ({ page }) => {
    await page.goto('/auth')

    await switchToSignUp(page).click()

    await emailField(page).fill('test@example.com')
    await passwordField(page).fill('12345')
    await usernameField(page).fill('TestUser')

    await createAccountButton(page).click()

    await expect(passwordField(page)).toBeVisible()
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

    await emailField(page).fill('test@example.com')
    await passwordField(page).fill('wrong-password')
    await signInButton(page).click()

    await expect(page.getByRole('alert')).toContainText('Invalid email or password')
  })

  test('the reason for a failed sign in follows the selected language', async ({ page }) => {
    await page.route('**/auth/v1/token**', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }),
      })
    )

    await page.goto('/auth')
    await page.getByRole('button', { name: 'ES', exact: true }).click()

    await emailField(page).fill('test@example.com')
    await passwordField(page).fill('wrong-password')
    await page.getByRole('button', { name: /^entrar$/i }).click()

    await expect(page.getByRole('alert')).toContainText('Correo o contraseña incorrectos')
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

    await switchToSignUp(page).click()
    await emailField(page).fill('test@example.com')
    await passwordField(page).fill('strong-password')
    await usernameField(page).fill('TestUser')
    await createAccountButton(page).click()

    await expect(page.getByRole('alert')).toContainText('An account with this email already exists')
  })

  test('a sign up with a blank username shows the reason on the auth form', async ({ page }) => {
    await page.goto('/auth')

    await switchToSignUp(page).click()
    await emailField(page).fill('test@example.com')
    await passwordField(page).fill('strong-password')
    await usernameField(page).fill(' '.repeat(VALIDATION_RULES.USERNAME_MIN_LENGTH + 2))
    await createAccountButton(page).click()

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

    await emailField(page).fill('test@example.com')
    await passwordField(page).fill('wrong-password')
    await signInButton(page).click()

    await expect(switchToSignUp(page)).toBeDisabled()

    await expect(page.getByRole('alert')).toContainText('Invalid email or password')
    await expect(signInButton(page)).toBeVisible()
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

    await emailField(page).fill('test@example.com')
    await passwordField(page).fill('wrong-password')
    await signInButton(page).click()
    await expect(page.getByRole('alert')).toBeVisible()

    await switchToSignUp(page).click()

    await expect(page.getByRole('alert')).not.toBeVisible()
  })
})

test.describe('screen fit and copyright', () => {
  test('sign-in at 1280×720 shows the footer and the current year without scrolling', async ({ page }) => {
    const year = new Date().getFullYear()
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/auth')

    await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()
    expect(await verticalOverflow(page)).toBeLessThanOrEqual(0)

    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeInViewport({ ratio: 1 })
    await expect(footer).toContainText(`© ${year} Quest Forge`)

    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await expect(footer).toContainText(`© ${year} Quest Forge`)
    await expect(footer).toContainText(/derechos reservados/i)
    expect(await verticalOverflow(page)).toBeLessThanOrEqual(0)
  })

  test('sign-up on a short screen scrolls with the whole form reachable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 480 })
    await page.goto('/auth')
    await switchToSignUp(page).click()

    await expect(usernameField(page)).toBeVisible()
    expect(await verticalOverflow(page)).toBeGreaterThan(0)

    const heading = page.getByRole('heading', { level: 1, name: /quest forge/i })
    const submit = createAccountButton(page)

    for (const control of [heading, usernameField(page), passwordField(page), submit, switchToSignIn(page)]) {
      await control.scrollIntoViewIfNeeded()
      await expect(control).toBeInViewport({ ratio: 1 })
    }

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(page.getByRole('contentinfo')).toBeInViewport({ ratio: 1 })
  })
})
