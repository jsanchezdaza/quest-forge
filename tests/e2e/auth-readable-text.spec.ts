import { test, expect, type Locator, type Page } from './setup'

/**
 * Readable text on /auth (#30).
 *
 * Body text, fields, placeholders, links, and messages are 14–16px.
 * Uppercase is only the title, the primary button, and the field labels.
 */

const MIN_PX = 14
const MAX_PX = 16

const emailField = (page: Page) => page.getByLabel(/email|correo/i)
const passwordField = (page: Page) =>
  page.getByRole('textbox', { name: /^(password|contraseña)$/i })
const usernameField = (page: Page) => page.getByLabel(/username|nombre de usuario/i)
const signInButton = (page: Page) => page.getByRole('button', { name: /^sign in$/i })
const createAccountButton = (page: Page) => page.getByRole('button', { name: /^create account$/i })
const switchToSignUp = (page: Page) => page.getByRole('button', { name: /sign up$/i })
const switchToSignIn = (page: Page) => page.getByRole('button', { name: /already have an account/i })
const welcome = (page: Page) => page.getByText(/welcome back, adventurer/i)
const title = (page: Page) => page.getByRole('heading', { level: 1, name: /quest forge/i })

async function fontSize(locator: Locator): Promise<number> {
  const size = await locator.evaluate((el) => getComputedStyle(el).fontSize)
  return Number.parseFloat(size)
}

async function textTransform(locator: Locator): Promise<string> {
  return locator.evaluate((el) => getComputedStyle(el).textTransform)
}

async function expectReadable(locator: Locator) {
  const size = await fontSize(locator)
  expect(size).toBeGreaterThanOrEqual(MIN_PX)
  expect(size).toBeLessThanOrEqual(MAX_PX)
}

async function labelText(field: Locator): Promise<string> {
  return field.evaluate((el: HTMLInputElement) => {
    const label = el.labels?.[0]
    if (!label) throw new Error('field has no label')
    return label.textContent ?? ''
  })
}

async function labelTransform(field: Locator): Promise<string> {
  return field.evaluate((el: HTMLInputElement) => {
    const label = el.labels?.[0]
    if (!label) throw new Error('field has no label')
    return getComputedStyle(label).textTransform
  })
}

async function placeholderStyle(field: Locator): Promise<{ fontSize: number; textTransform: string }> {
  return field.evaluate((el) => {
    const style = getComputedStyle(el, '::placeholder')
    return {
      fontSize: Number.parseFloat(style.fontSize),
      textTransform: style.textTransform,
    }
  })
}

test.describe('readable auth text', () => {
  test('sign-in copy is 14–16px, with uppercase only on the title, button, and labels', async ({ page }) => {
    await page.goto('/auth')
    await page.evaluate(() => document.fonts.ready)

    const heading = title(page)
    await expect(heading).toBeVisible()
    await expect(heading).toHaveClass(/dnd-title/)
    expect(await textTransform(heading)).toBe('uppercase')
    // `.dnd-title` is the game's gold title treatment. The face that actually
    // paints is the heading stack; this story must not swap it.
    const family = await heading.evaluate((el) => getComputedStyle(el).fontFamily)
    expect(family).toBe('Cinzel, Spectral, serif')

    const intro = welcome(page)
    await expect(intro).toHaveText('Welcome back, adventurer')
    await expectReadable(intro)
    expect(await textTransform(intro)).toBe('none')

    const email = emailField(page)
    const password = passwordField(page)
    await expectReadable(email)
    await expectReadable(password)
    expect(await textTransform(email)).toBe('none')
    expect(await textTransform(password)).toBe('none')

    await expect(email).toHaveAttribute('placeholder', 'your.email@example.com')
    await expect(password).toHaveAttribute('placeholder', 'Your password')
    for (const field of [email, password]) {
      const placeholder = await placeholderStyle(field)
      expect(placeholder.fontSize).toBeGreaterThanOrEqual(MIN_PX)
      expect(placeholder.fontSize).toBeLessThanOrEqual(MAX_PX)
      expect(placeholder.textTransform).toBe('none')
    }

    expect(await labelText(email)).toBe('Email')
    expect(await labelText(password)).toBe('Password')
    expect(await labelTransform(email)).toBe('uppercase')
    expect(await labelTransform(password)).toBe('uppercase')

    const submit = signInButton(page)
    await expectReadable(submit)
    expect(await textTransform(submit)).toBe('uppercase')

    const toggle = switchToSignUp(page)
    await expect(toggle).toHaveText("Don't have an account? Sign up")
    await expectReadable(toggle)
    expect(await textTransform(toggle)).toBe('none')

    const footer = page.getByRole('contentinfo')
    const copyright = footer.getByText(/all rights reserved/i)
    const author = footer.getByText(/^author:/i)
    const authorLink = footer.getByRole('link', { name: 'www.javisan.dev' })
    await expectReadable(copyright)
    await expectReadable(author)
    await expectReadable(authorLink)
    expect(await textTransform(copyright)).toBe('none')
    expect(await textTransform(author)).toBe('none')
    expect(await textTransform(authorLink)).toBe('none')

    for (const name of ['EN', 'ES'] as const) {
      const language = page.getByRole('button', { name, exact: true })
      expect(await textTransform(language)).toBe('none')
    }
  })

  test('sign-up welcome, username, and toggle follow the same rules', async ({ page }) => {
    await page.goto('/auth')
    await switchToSignUp(page).click()

    const intro = page.getByText(/begin your quest/i)
    await expect(intro).toHaveText('Begin your quest')
    await expectReadable(intro)
    expect(await textTransform(intro)).toBe('none')

    const username = usernameField(page)
    await expectReadable(username)
    expect(await textTransform(username)).toBe('none')
    await expect(username).toHaveAttribute('placeholder', 'Choose a username')
    const placeholder = await placeholderStyle(username)
    expect(placeholder.fontSize).toBeGreaterThanOrEqual(MIN_PX)
    expect(placeholder.fontSize).toBeLessThanOrEqual(MAX_PX)
    expect(placeholder.textTransform).toBe('none')
    expect(await labelText(username)).toBe('Username')
    expect(await labelTransform(username)).toBe('uppercase')

    const submit = createAccountButton(page)
    await expectReadable(submit)
    expect(await textTransform(submit)).toBe('uppercase')

    const toggle = switchToSignIn(page)
    await expect(toggle).toHaveText('Already have an account? Sign in')
    await expectReadable(toggle)
    expect(await textTransform(toggle)).toBe('none')
  })

  test('Spanish copy is sentence case except the title, button, and labels', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: 'ES', exact: true }).click()

    const heading = title(page)
    await expect(heading).toHaveClass(/dnd-title/)
    expect(await textTransform(heading)).toBe('uppercase')
    const family = await heading.evaluate((el) => getComputedStyle(el).fontFamily)
    expect(family).toBe('Cinzel, Spectral, serif')

    const intro = page.getByText(/bienvenido de nuevo, aventurero/i)
    await expect(intro).toHaveText('Bienvenido de nuevo, aventurero')
    await expectReadable(intro)
    expect(await textTransform(intro)).toBe('none')

    const email = emailField(page)
    const password = passwordField(page)
    await expect(email).toHaveAttribute('placeholder', 'tu.correo@ejemplo.com')
    await expect(password).toHaveAttribute('placeholder', 'Tu contraseña')
    expect(await labelText(email)).toBe('Correo')
    expect(await labelText(password)).toBe('Contraseña')
    expect(await labelTransform(email)).toBe('uppercase')
    expect(await labelTransform(password)).toBe('uppercase')

    const submit = page.getByRole('button', { name: /^entrar$/i })
    await expectReadable(submit)
    expect(await textTransform(submit)).toBe('uppercase')

    const toggle = page.getByRole('button', { name: /regístrate$/i })
    await expect(toggle).toHaveText('¿No tienes cuenta? Regístrate')
    await expectReadable(toggle)
    expect(await textTransform(toggle)).toBe('none')

    const footer = page.getByRole('contentinfo')
    const copyright = footer.getByText(/derechos reservados/i)
    const author = footer.getByText(/^autor:/i)
    await expectReadable(copyright)
    await expectReadable(author)
    expect(await textTransform(copyright)).toBe('none')
    expect(await textTransform(author)).toBe('none')

    await page.getByRole('button', { name: /regístrate$/i }).click()
    const signUpIntro = page.getByText(/comienza tu gesta/i)
    await expect(signUpIntro).toHaveText('Comienza tu gesta')
    expect(await labelText(usernameField(page))).toBe('Nombre de usuario')
    await expect(usernameField(page)).toHaveAttribute('placeholder', 'Elige un nombre de usuario')
    const create = page.getByRole('button', { name: /^crear cuenta$/i })
    expect(await textTransform(create)).toBe('uppercase')
    await expect(page.getByRole('button', { name: /ya tienes cuenta/i })).toHaveText('¿Ya tienes cuenta? Entra')
  })

  test('a sign-in error is 14–16px and not uppercase', async ({ page }) => {
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

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expectReadable(alert)
    expect(await textTransform(alert)).toBe('none')
  })
})
