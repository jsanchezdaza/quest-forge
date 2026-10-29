import { test, expect, type Locator, type Page } from './setup'
import tailwindConfig from '../../tailwind.config.js'

const medievalGold = tailwindConfig.theme.extend.colors.medieval.gold

function hexToCssRgb(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgb(${red}, ${green}, ${blue})`
}

/** medieval-gold from tailwind.config.js, as Chromium reports outline-color. */
const goldenRingColor = hexToCssRgb(medievalGold)

const emailField = (page: Page) => page.getByLabel(/email|correo/i)
const passwordField = (page: Page) => page.getByLabel(/password|contraseña/i)
const usernameField = (page: Page) => page.getByLabel(/username|nombre de usuario/i)
const signInButton = (page: Page) => page.getByRole('button', { name: /^sign in$/i })
const createAccountButton = (page: Page) => page.getByRole('button', { name: /^create account$/i })
const switchToSignUp = (page: Page) => page.getByRole('button', { name: /sign up$/i })
const switchToSignIn = (page: Page) => page.getByRole('button', { name: /already have an account/i })
const englishButton = (page: Page) => page.getByRole('button', { name: 'EN', exact: true })
const spanishButton = (page: Page) => page.getByRole('button', { name: 'ES', exact: true })
const authorLink = (page: Page) => page.getByRole('link', { name: 'www.javisan.dev' })

function signInOrder(page: Page): Locator[] {
  return [
    englishButton(page),
    spanishButton(page),
    emailField(page),
    passwordField(page),
    signInButton(page),
    switchToSignUp(page),
    authorLink(page),
  ]
}

function signUpOrder(page: Page): Locator[] {
  return [
    englishButton(page),
    spanishButton(page),
    emailField(page),
    usernameField(page),
    passwordField(page),
    createAccountButton(page),
    switchToSignIn(page),
    authorLink(page),
  ]
}

interface FocusRingSnapshot {
  matchesFocusVisible: boolean
  outlineStyle: string
  outlineWidth: string
  outlineColor: string
  outlineOffset: string
}

function focusRing(locator: Locator): Promise<FocusRingSnapshot> {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el)
    return {
      matchesFocusVisible: el.matches(':focus-visible'),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
    }
  })
}

async function resetTabStart(page: Page) {
  // Clicking the mode toggle leaves the sequential focus start on that button.
  // Focusing a sentinel at the top of the body and removing it sends the next
  // Tab back to the first control.
  await page.evaluate(() => {
    const sentinel = document.createElement('span')
    sentinel.tabIndex = -1
    document.body.prepend(sentinel)
    sentinel.focus()
    sentinel.remove()
  })
}

async function expectGoldenFocusRing(locator: Locator) {
  await expect.poll(async () => focusRing(locator)).toEqual({
    matchesFocusVisible: true,
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineColor: goldenRingColor,
    outlineOffset: '2px',
  })
}

async function expectTabOrder(page: Page, controls: Locator[]) {
  await resetTabStart(page)
  for (const control of controls) {
    await page.keyboard.press('Tab')
    await expect(control).toBeFocused()
    await expectGoldenFocusRing(control)
  }
}

test.describe('auth keyboard focus', () => {
  test('tab order on sign-in follows the visual order and shows one golden ring', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()
    await expectTabOrder(page, signInOrder(page))
  })

  test('tab order on sign-up follows the visual order and shows one golden ring', async ({ page }) => {
    await page.goto('/auth')
    await switchToSignUp(page).click()
    await expect(usernameField(page)).toBeVisible()
    await expectTabOrder(page, signUpOrder(page))
  })

  test('a mouse click does not draw the golden ring on buttons or the footer link', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()

    await englishButton(page).click()
    await expect(englishButton(page)).toBeFocused()
    const englishRing = await focusRing(englishButton(page))
    expect(englishRing.matchesFocusVisible).toBe(false)
    expect(englishRing.outlineStyle).not.toBe('solid')

    // The toggle stays focused after the click, with its sign-up label.
    await switchToSignUp(page).click()
    await expect(switchToSignIn(page)).toBeFocused()
    const toggleRing = await focusRing(switchToSignIn(page))
    expect(toggleRing.matchesFocusVisible).toBe(false)
    expect(toggleRing.outlineStyle).not.toBe('solid')

    await authorLink(page).evaluate((anchor) => {
      anchor.addEventListener('click', (event) => event.preventDefault())
    })
    await authorLink(page).click()
    await expect(authorLink(page)).toBeFocused()
    const linkRing = await focusRing(authorLink(page))
    expect(linkRing.matchesFocusVisible).toBe(false)
    expect(linkRing.outlineStyle).not.toBe('solid')
  })

  test('pressing Enter in any sign-in field submits the form', async ({ page }) => {
    let submissions = 0
    await page.route('**/auth/v1/token**', (route) => {
      submissions += 1
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }),
      })
    })

    await page.goto('/auth')
    await emailField(page).fill('test@example.com')
    await passwordField(page).fill('password123')

    await emailField(page).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('alert')).toContainText('Invalid email or password')
    expect(submissions).toBe(1)

    await passwordField(page).focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => submissions).toBe(2)
  })

  test('pressing Enter in any sign-up field submits the form', async ({ page }) => {
    let submissions = 0
    await page.route('**/auth/v1/signup**', (route) => {
      submissions += 1
      return route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error_code: 'user_already_exists', msg: 'User already registered' }),
      })
    })

    await page.goto('/auth')
    await switchToSignUp(page).click()
    await emailField(page).fill('test@example.com')
    await usernameField(page).fill('TestUser')
    await passwordField(page).fill('password123')

    for (const field of [emailField(page), usernameField(page), passwordField(page)]) {
      // Enter does not submit while the previous attempt still disables the button.
      await expect(createAccountButton(page)).toBeEnabled()
      const before = submissions
      await field.focus()
      await page.keyboard.press('Enter')
      await expect.poll(() => submissions).toBe(before + 1)
    }

    await expect(page.getByRole('alert')).toContainText('An account with this email already exists')
  })
})
