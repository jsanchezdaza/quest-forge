import { test, expect, type Page } from './setup'

/**
 * Login usable on a phone (#35).
 *
 * Between 320 and 480px the card fills the width inside the page margins
 * and nothing scrolls sideways, including while the embers move.
 */

/** Page padding (`p-4`) plus the card wrapper's `px-4`, on each side. */
const MOBILE_SIDE_INSET = 16 + 16

const emailField = (page: Page) => page.getByLabel(/email|correo/i)
const switchToSignUp = (page: Page) => page.getByRole('button', { name: /sign up$/i })

function authCard(page: Page) {
  return page.getByRole('heading', { level: 1, name: /quest forge/i }).locator('..').locator('..')
}

async function showSignIn(page: Page) {
  await page.goto('/auth')
  await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()
  await expect(emailField(page)).toBeVisible()
}

test.describe('mobile auth layout', () => {
  for (const width of [320, 375, 480]) {
    test(`the card fills a ${width}px screen inside the margins without horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 })
      await showSignIn(page)

      const box = await authCard(page).boundingBox()
      expect(box).not.toBeNull()
      expect(Math.round(box!.width)).toBe(width - MOBILE_SIDE_INSET * 2)

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBe(0)
    })
  }

  for (const width of [320, 375]) {
    test(`embers never widen a ${width}px page`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 })
      await showSignIn(page)

      // The rise loop is 9–16s. Twenty samples across two seconds catch an
      // ember that drifts past the right edge.
      const overflows = await page.evaluate(async () => {
        const samples: number[] = []
        for (let sample = 0; sample < 20; sample += 1) {
          samples.push(document.documentElement.scrollWidth - document.documentElement.clientWidth)
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
        return samples
      })

      expect(overflows).toEqual(Array(20).fill(0))
    })
  }

  test('sign-up at 320px stays inside the viewport too', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await showSignIn(page)
    await switchToSignUp(page).click()
    await expect(page.getByLabel(/username|nombre de usuario/i)).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBe(0)
  })
})

/**
 * Below 640px the language control sits in normal flow, right-aligned, with
 * an 8px gap above the card. From 640px up it stays in the corner.
 */
const languageSelector = (page: Page) => page.getByRole('group', { name: 'Language' })

const NARROW_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 740 },
  { width: 375, height: 667 },
  { width: 480, height: 800 },
  { width: 639, height: 700 },
] as const

function boxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

test.describe('language selector on a narrow screen', () => {
  for (const viewport of NARROW_VIEWPORTS) {
    for (const mode of ['sign-in', 'sign-up'] as const) {
      test(`stays above the ${mode} card at ${viewport.width}×${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await showSignIn(page)
        if (mode === 'sign-up') {
          await switchToSignUp(page).click()
          await expect(page.getByLabel(/username|nombre de usuario/i)).toBeVisible()
          await page.mouse.move(0, 0)
        }

        const selector = languageSelector(page)
        const card = authCard(page)
        const selectorBox = await selector.boundingBox()
        const cardBox = await card.boundingBox()
        expect(selectorBox).not.toBeNull()
        expect(cardBox).not.toBeNull()
        expect(boxesOverlap(selectorBox!, cardBox!)).toBe(false)
        const gap = cardBox!.y - (selectorBox!.y + selectorBox!.height)
        expect(Math.abs(gap - 8)).toBeLessThanOrEqual(1)
        expect(Math.round(selectorBox!.x + selectorBox!.width)).toBe(Math.round(cardBox!.x + cardBox!.width))

        const position = await selector.evaluate((element) => getComputedStyle(element.parentElement!).position)
        expect(position).not.toBe('fixed')
        expect(position).not.toBe('absolute')
      })
    }
  }

  test('stays in the top-right corner from 640px up', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 })
    await showSignIn(page)
    const narrow = await languageSelector(page).boundingBox()
    expect(narrow).not.toBeNull()
    expect(Math.round(narrow!.y)).toBe(16)
    expect(Math.round(700 - (narrow!.x + narrow!.width))).toBe(16)

    await page.setViewportSize({ width: 1280, height: 720 })
    const desktop = await languageSelector(page).boundingBox()
    expect(desktop).not.toBeNull()
    expect(Math.round(desktop!.y)).toBe(24)
    expect(Math.round(1280 - (desktop!.x + desktop!.width))).toBe(24)
  })
})

test.describe('language selector matches the document language', () => {
  for (const locale of [
    { button: 'EN', lang: 'en' },
    { button: 'ES', lang: 'es' },
  ] as const) {
    test(`${locale.button} is pressed when the document language is ${locale.lang}`, async ({ page }) => {
      await showSignIn(page)
      await page.getByRole('button', { name: locale.button, exact: true }).click()

      const pressed = languageSelector(page).locator('[aria-pressed="true"]')
      await expect(pressed).toHaveCount(1)
      await expect(pressed).toHaveText(locale.button)
      expect(await page.evaluate(() => document.documentElement.lang)).toBe(locale.lang)
    })
  }
})

test.describe('portrait auth header', () => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
  ]) {
    test(`sign-up leaves room under the title at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await showSignIn(page)
      await switchToSignUp(page).click()
      await expect(usernameField(page)).toBeVisible()
      await page.mouse.move(0, 0)

      const title = await page.getByRole('heading', { level: 1, name: /quest forge/i }).boundingBox()
      const subtitle = await page.getByText(/begin your quest/i).boundingBox()
      const label = await page.locator('label[for="email"]').boundingBox()
      expect(title && subtitle && label).toBeTruthy()
      expect(Math.round(subtitle!.y - (title!.y + title!.height))).toBe(4)
      expect(Math.round(label!.y - (subtitle!.y + subtitle!.height))).toBe(16)
    })
  }
})

const passwordField = (page: Page) =>
  page.getByRole('textbox', { name: /^(password|contraseña)$/i })
const usernameField = (page: Page) => page.getByLabel(/username|nombre de usuario/i)

async function fieldTypography(page: Page, field: ReturnType<typeof emailField>) {
  return field.evaluate((element) => {
    const style = getComputedStyle(element)
    const placeholder = getComputedStyle(element, '::placeholder')
    const label = (element as HTMLInputElement).labels?.[0]
    const labelStyle = label ? getComputedStyle(label) : null
    return {
      fontSize: style.fontSize,
      placeholderSize: placeholder.fontSize,
      height: Math.round(element.getBoundingClientRect().height),
      labelSize: labelStyle?.fontSize ?? '',
      labelTransform: labelStyle?.textTransform ?? '',
    }
  })
}

test.describe('auth field text on a phone', () => {
  test('fields are 16px on a phone and 14px on desktop, and stay 46px tall', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await showSignIn(page)

    for (const field of [emailField(page), passwordField(page)]) {
      expect(await fieldTypography(page, field)).toMatchObject({
        fontSize: '16px',
        placeholderSize: '16px',
        height: 46,
        labelSize: '12px',
        labelTransform: 'uppercase',
      })
    }

    await switchToSignUp(page).click()
    expect(await fieldTypography(page, usernameField(page))).toMatchObject({
      fontSize: '16px',
      placeholderSize: '16px',
      height: 46,
      labelSize: '12px',
      labelTransform: 'uppercase',
    })

    await page.setViewportSize({ width: 1280, height: 720 })
    for (const field of [emailField(page), usernameField(page), passwordField(page)]) {
      expect(await fieldTypography(page, field)).toMatchObject({
        fontSize: '14px',
        placeholderSize: '14px',
        height: 46,
        labelSize: '12px',
        labelTransform: 'uppercase',
      })
    }
  })
})

async function boxSize(locator: ReturnType<typeof emailField>): Promise<{ width: number; height: number }> {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return { width: box!.width, height: box!.height }
}

function expectTouchTarget(size: { width: number; height: number }) {
  expect(size.width).toBeGreaterThanOrEqual(44)
  expect(size.height).toBeGreaterThanOrEqual(44)
}

test.describe('auth touch targets', () => {
  test('fields, buttons, links, and the language control are at least 44×44 at 375×667', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await showSignIn(page)
    await switchToSignUp(page).click()
    await expect(usernameField(page)).toBeVisible()
    await page.mouse.move(0, 0)

    for (const field of [emailField(page), usernameField(page), passwordField(page)]) {
      expectTouchTarget(await boxSize(field))
    }
    expectTouchTarget(await boxSize(page.getByRole('button', { name: /^create account$/i })))
    expectTouchTarget(await boxSize(page.getByRole('button', { name: /already have an account/i })))

    const eye = page.getByRole('button', { name: 'Show password', exact: true })
    expectTouchTarget(await boxSize(eye))
    const icon = await boxSize(eye.locator('svg'))
    expect(Math.round(icon.width)).toBe(20)
    expect(Math.round(icon.height)).toBe(20)

    const clearance = await passwordField(page).evaluate((element) => {
      const button = element.parentElement?.querySelector('button')
      if (!button) throw new Error('password field has no toggle')
      const style = getComputedStyle(element)
      const contentRight = element.getBoundingClientRect().right - Number.parseFloat(style.paddingRight)
      return button.getBoundingClientRect().left - contentRight
    })
    expect(clearance).toBeGreaterThanOrEqual(0)

    for (const name of ['EN', 'ES'] as const) {
      expectTouchTarget(await boxSize(page.getByRole('button', { name, exact: true })))
    }
    expectTouchTarget(await boxSize(page.getByRole('link', { name: 'www.javisan.dev' })))
  })
})

test.describe('auth password manager hints', () => {
  test('sign-in fields use email and current-password', async ({ page }) => {
    await page.goto('/auth')
    await expect(emailField(page)).toHaveAttribute('type', 'email')
    await expect(emailField(page)).toHaveAttribute('autocomplete', 'email')
    await expect(passwordField(page)).toHaveAttribute('type', 'password')
    await expect(passwordField(page)).toHaveAttribute('autocomplete', 'current-password')
  })

  test('sign-up fields use email, username, and new-password', async ({ page }) => {
    await page.goto('/auth?mode=signup')
    await expect(emailField(page)).toHaveAttribute('type', 'email')
    await expect(emailField(page)).toHaveAttribute('autocomplete', 'email')
    await expect(usernameField(page)).toHaveAttribute('type', 'text')
    await expect(usernameField(page)).toHaveAttribute('autocomplete', 'username')
    await expect(passwordField(page)).toHaveAttribute('type', 'password')
    await expect(passwordField(page)).toHaveAttribute('autocomplete', 'new-password')
  })
})

test.describe('reduced motion on the auth background', () => {
  test('embers and the desktop video stop when motion is reduced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/auth')
    await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()
    await expect(page.locator('.ember')).toHaveCount(0)

    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/auth')
    await expect(page.locator('.ember')).toHaveCount(0)
    const video = page.locator('video.auth-video')
    await expect(video).toHaveJSProperty('paused', true)
    await expect(video).not.toHaveAttribute('autoplay')
  })

  test('the background still animates when motion is allowed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/auth')

    const ember = page.locator('.ember').first()
    await expect(ember).toBeAttached()
    expect(await ember.evaluate((element) => getComputedStyle(element).animationName)).toBe('ember-rise')

    const video = page.locator('video.auth-video')
    await expect(video).toBeVisible()
    await expect(video).toHaveAttribute('autoplay', '')
    expect(await video.evaluate((element: HTMLVideoElement) => element.playbackRate)).toBe(1)
  })
})

/**
 * Short landscape phones. Login must not scroll to reach the primary button.
 * The greeting is hidden, fields sit 12px apart, the card's vertical padding
 * is 20px, and the card starts 8px from the top. Sign-up may still scroll.
 */
const LANDSCAPE_VIEWPORTS = [
  { width: 740, height: 360 },
  { width: 852, height: 393 },
] as const

const LANDSCAPE_LOCALES = [
  {
    name: 'EN',
    language: 'EN',
    signIn: /^sign in$/i,
    toggle: /sign up$/i,
    greeting: /welcome back, adventurer/i,
  },
  {
    name: 'ES',
    language: 'ES',
    signIn: /^entrar$/i,
    toggle: /regístrate$/i,
    greeting: /bienvenido de nuevo, aventurero/i,
  },
] as const

async function cssPx(locator: ReturnType<typeof emailField>, property: string): Promise<number> {
  const value = await locator.evaluate(
    (element, name) => getComputedStyle(element).getPropertyValue(name),
    property,
  )
  return Number.parseFloat(value)
}

test.describe('auth landscape header', () => {
  for (const viewport of LANDSCAPE_VIEWPORTS) {
    for (const locale of LANDSCAPE_LOCALES) {
      test(`login at ${viewport.width}×${viewport.height} shows the ${locale.name} sign-in button without scrolling`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await showSignIn(page)
        await page.getByRole('button', { name: locale.language, exact: true }).click()
        await page.evaluate(() => document.fonts.ready)
        expect(await page.evaluate(() => window.scrollY)).toBe(0)

        const button = await page.getByRole('button', { name: locale.signIn }).boundingBox()
        expect(button).not.toBeNull()
        expect(Math.round(button!.y + button!.height)).toBeLessThanOrEqual(viewport.height)

        const title = page.getByRole('heading', { level: 1, name: /quest forge/i })
        const header = title.locator('..')
        const toggleRow = page.getByRole('button', { name: locale.toggle }).locator('..')
        expect(await cssPx(title, 'font-size')).toBe(24)
        expect(await cssPx(title, 'margin-bottom')).toBe(12)
        expect(await cssPx(header, 'margin-bottom')).toBe(16)
        expect(await cssPx(toggleRow, 'margin-top')).toBe(12)
        await expect(page.getByText(locale.greeting)).toBeHidden()

        const card = authCard(page)
        expect(Math.round((await card.boundingBox())!.y)).toBe(8)
        expect(await cssPx(card, 'padding-top')).toBe(20)
        expect(await cssPx(card, 'padding-bottom')).toBe(20)
        expect(await cssPx(card, 'padding-left')).toBe(viewport.width >= 768 ? 32 : 20)

        const emailBox = await emailField(page).boundingBox()
        const labelBox = await page.locator('label[for="email"]').boundingBox()
        const errorBox = await page.locator('#email-error').boundingBox()
        const passwordLabel = await page.locator('label[for="password"]').boundingBox()
        expect(labelBox && emailBox && errorBox && passwordLabel).toBeTruthy()
        expect(Math.round(emailBox!.y - (labelBox!.y + labelBox!.height))).toBe(8)
        expect(Math.round(passwordLabel!.y - (errorBox!.y + errorBox!.height))).toBe(12)
      })
    }
  }
})
