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
      // A classic scrollbar (fine pointer) is part of the layout width.
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
      expect(Math.round(box!.width)).toBe(clientWidth - MOBILE_SIDE_INSET * 2)

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

  test('sideways clipping is limited to the auth screen', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()

    const onAuth = await page.evaluate(() => ({
      root: getComputedStyle(document.documentElement).overflowX,
      body: getComputedStyle(document.body).overflowX,
    }))
    expect(onAuth).toEqual({ root: 'clip', body: 'clip' })

    const elsewhere = await page.evaluate(() => {
      document.documentElement.classList.remove('auth-screen')
      return {
        root: getComputedStyle(document.documentElement).overflowX,
        body: getComputedStyle(document.body).overflowX,
      }
    })
    expect(elsewhere.root).not.toBe('clip')
    expect(elsewhere.body).not.toBe('clip')
  })

  test('a fine pointer keeps the auth scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/auth')
    await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()

    const result = await page.evaluate(() => {
      const fine = window.matchMedia('(pointer: fine)').matches
      // Firefox on this platform computes scrollbar-width as none even when set to thin.
      const probe = document.createElement('div')
      probe.style.scrollbarWidth = 'thin'
      document.body.append(probe)
      const reportsScrollbarWidth = getComputedStyle(probe).scrollbarWidth === 'thin'
      probe.remove()

      const hiddenByMatchingRule = (() => {
        const walk = (rules: CSSRuleList): boolean => {
          for (const rule of rules) {
            if (rule instanceof CSSMediaRule) {
              if (!window.matchMedia(rule.conditionText).matches) continue
              if (walk(rule.cssRules)) return true
              continue
            }
            if ('cssRules' in rule && rule.cssRules instanceof CSSRuleList && walk(rule.cssRules)) return true
            if (rule instanceof CSSStyleRule && rule.style.scrollbarWidth === 'none') return true
          }
          return false
        }
        for (const sheet of document.styleSheets) {
          try {
            if (walk(sheet.cssRules)) return true
          } catch {
            // The font stylesheet is cross-origin.
          }
        }
        return false
      })()

      return {
        fine,
        reportsScrollbarWidth,
        scrollbarWidth: getComputedStyle(document.documentElement).scrollbarWidth,
        hiddenByMatchingRule,
      }
    })

    if (result.fine) {
      if (result.reportsScrollbarWidth) expect(result.scrollbarWidth).not.toBe('none')
      expect(result.hiddenByMatchingRule).toBe(false)
    } else {
      expect(result.scrollbarWidth).toBe('none')
    }
  })

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
 * Below sm (768px) the language control sits in normal flow, right-aligned,
 * with an 8px gap above the card. From sm it is absolute in the top-right
 * corner. It is never position:fixed. A short landscape phone (below sm, but
 * at most 450px tall) is absolute too, so the control does not push the
 * sign-in button off the screen.
 */
const languageSelector = (page: Page) => page.getByRole('group', { name: 'Language' })

const NARROW_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 740 },
  { width: 375, height: 667 },
  { width: 480, height: 800 },
  { width: 700, height: 800 },
  { width: 767, height: 900 },
] as const

async function selectorPosition(page: Page): Promise<string> {
  return languageSelector(page).evaluate((element) => getComputedStyle(element.parentElement!).position)
}

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

        expect(await selectorPosition(page)).toBe('static')
      })
    }
  }

  test('sits in the top-right corner from the sm breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 })
    await showSignIn(page)
    const tablet = await languageSelector(page).boundingBox()
    expect(tablet).not.toBeNull()
    expect(Math.round(tablet!.y)).toBe(24)
    expect(Math.round(768 - (tablet!.x + tablet!.width))).toBe(24)
    expect(await selectorPosition(page)).toBe('absolute')

    await page.setViewportSize({ width: 1280, height: 720 })
    const desktop = await languageSelector(page).boundingBox()
    expect(desktop).not.toBeNull()
    expect(Math.round(desktop!.y)).toBe(24)
    expect(Math.round(1280 - (desktop!.x + desktop!.width))).toBe(24)
    expect(await selectorPosition(page)).toBe('absolute')
  })

  test('a short landscape phone keeps it out of flow without pinning it', async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 })
    await showSignIn(page)
    expect(await selectorPosition(page)).toBe('absolute')
    const selectorBox = await languageSelector(page).boundingBox()
    const cardBox = await authCard(page).boundingBox()
    expect(selectorBox).not.toBeNull()
    expect(cardBox).not.toBeNull()
    expect(boxesOverlap(selectorBox!, cardBox!)).toBe(false)
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

      const title = page.getByRole('heading', { level: 1, name: /quest forge/i })
      const subtitle = page.getByText(/begin your quest/i)
      const header = title.locator('..')
      // The title's transform makes its border box about half a pixel short of the margin.
      expect(await cssPx(subtitle, 'margin-top')).toBe(4)
      expect(await cssPx(header, 'margin-bottom')).toBe(16)
      const titleBox = await title.boundingBox()
      const subtitleBox = await subtitle.boundingBox()
      const labelBox = await page.locator('label[for="email"]').boundingBox()
      expect(titleBox && subtitleBox && labelBox).toBeTruthy()
      expect(Math.abs(subtitleBox!.y - (titleBox!.y + titleBox!.height) - 4)).toBeLessThanOrEqual(1)
      expect(Math.round(labelBox!.y - (subtitleBox!.y + subtitleBox!.height))).toBe(16)
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

  test('sign-up fields use email, a nickname, and new-password', async ({ page }) => {
    await page.goto('/auth?mode=signup')
    await expect(emailField(page)).toHaveAttribute('type', 'email')
    await expect(emailField(page)).toHaveAttribute('autocomplete', 'email')
    await expect(usernameField(page)).toHaveAttribute('type', 'text')
    // A display name is not the login. `username` would make a password manager store it as one.
    await expect(usernameField(page)).toHaveAttribute('autocomplete', 'nickname')
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
