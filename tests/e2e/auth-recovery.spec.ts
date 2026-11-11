import { test, expect, type Locator, type Page } from './setup'
import tailwindConfig from '../../tailwind.config.js'
import { minimumContrast } from './pixelContrast'

/**
 * Request a recovery link (#36).
 *
 * The login link sits on the password label from 480px up and on its own row
 * below that. Recovery never says whether the address has an account.
 */

const CONFIRMATION =
  "If an account exists for that email, we've sent a link to reset your password. Check your inbox and your spam folder."
const CONFIRMATION_ES =
  'Si existe una cuenta con ese correo, te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam.'

const medievalGold = tailwindConfig.theme.extend.colors.medieval.gold

function hexToCssRgb(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16)
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`
}

const goldenRingColor = hexToCssRgb(medievalGold)
const inkBlack = hexToCssRgb(tailwindConfig.theme.extend.colors.medieval.inkblack)
const goldenRingShadow = `${inkBlack} 0px 0px 0px 2px, ${inkBlack} 0px 0px 0px 5px`

const emailField = (page: Page) => page.getByLabel(/email|correo/i)
const passwordField = (page: Page) =>
  page.getByRole('textbox', { name: /^(password|contraseña)$/i })
const showPasswordButton = (page: Page) =>
  page.getByRole('button', { name: /^(show password|mostrar contraseña)$/i })
const forgotPassword = (page: Page) =>
  page.getByRole('button', { name: /forgot your password|olvidaste tu contraseña/i })
const sendReset = (page: Page) =>
  page.getByRole('button', { name: /^(send reset link|enviar enlace)$/i })
const backToSignIn = (page: Page) =>
  page.getByRole('button', { name: /^(back to sign in|volver a entrar)$/i })

const LINK_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 740, height: 360 },
  { width: 1280, height: 720 },
] as const

const LOGIN_FIT_VIEWPORTS = [
  { width: 740, height: 360 },
  { width: 852, height: 393 },
  { width: 1280, height: 720 },
] as const

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

async function verticalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight)
}

async function textIsClipped(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element)
    if (style.textOverflow === 'ellipsis') return true
    // The coarse-pointer hit area is an overflowing ::after. Measure the
    // glyphs against the padding box so that extension is not "clipping".
    const range = document.createRange()
    range.selectNodeContents(element)
    const text = range.getBoundingClientRect()
    const box = element.getBoundingClientRect()
    const left = box.left + Number.parseFloat(style.paddingLeft)
    const right = box.right - Number.parseFloat(style.paddingRight)
    const top = box.top + Number.parseFloat(style.paddingTop)
    const bottom = box.bottom - Number.parseFloat(style.paddingBottom)
    return text.width > right - left + 1
      || text.left < left - 1
      || text.right > right + 1
      || text.top < top - 1
      || text.bottom > bottom + 1
  })
}

async function textBaseline(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas is unavailable')
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    const metrics = context.measureText('Hg')
    const rect = element.getBoundingClientRect()
    const fontSize = Number.parseFloat(style.fontSize)
    const lineHeight = Number.parseFloat(style.lineHeight)
    const paddingTop = Number.parseFloat(style.paddingTop)
    return rect.top + paddingTop + (lineHeight - fontSize) / 2 + metrics.actualBoundingBoxAscent
  })
}

async function hitBox(locator: Locator) {
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect()
    const after = getComputedStyle(element, '::after')
    const hidden = after.content === 'none' || after.content === 'normal'
    const inset = (value: string) => {
      const parsed = Number.parseFloat(value)
      return Number.isFinite(parsed) ? parsed : 0
    }
    if (hidden) {
      return { x: box.x, y: box.y, width: box.width, height: box.height }
    }
    const top = inset(after.top)
    const right = inset(after.right)
    const bottom = inset(after.bottom)
    const left = inset(after.left)
    return {
      x: box.x + left,
      y: box.y + top,
      width: box.width - left - right,
      height: box.height - top - bottom,
    }
  })
}

function containsPoint(
  box: { x: number; y: number; width: number; height: number },
  x: number,
  y: number,
) {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height
}

async function resetTabStart(page: Page) {
  await page.evaluate(() => {
    const sentinel = document.createElement('span')
    sentinel.tabIndex = -1
    document.body.prepend(sentinel)
    sentinel.focus()
    sentinel.remove()
  })
}

async function expectGoldenFocusRing(locator: Locator) {
  await expect.poll(async () => locator.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      matchesFocusVisible: element.matches(':focus-visible'),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
      boxShadow: style.boxShadow,
    }
  })).toEqual({
    matchesFocusVisible: true,
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineColor: goldenRingColor,
    outlineOffset: '2px',
    boxShadow: goldenRingShadow,
  })
}

async function foreground(locator: Locator): Promise<[number, number, number]> {
  return locator.evaluate((element) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas is unavailable')
    context.fillStyle = getComputedStyle(element).color
    context.fillRect(0, 0, 1, 1)
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data
    return [red, green, blue] as [number, number, number]
  })
}

async function expectTextContrast(locator: Locator, label: string) {
  const box = await locator.boundingBox()
  expect(box, label).not.toBeNull()
  const textRects = await locator.evaluate((element) => {
    const host = element.getBoundingClientRect()
    const range = document.createRange()
    range.selectNodeContents(element)
    return [...range.getClientRects()].map((rect) => ({
      x: rect.x - host.x,
      y: rect.y - host.y,
      width: rect.width,
      height: rect.height,
    }))
  })
  const ratio = minimumContrast(await locator.screenshot(), box!.width, textRects, await foreground(locator))
  expect(ratio, `${label} ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
}

test.describe('forgot-password link', () => {
  for (const viewport of LINK_VIEWPORTS) {
    for (const locale of ['EN', 'ES'] as const) {
      test(`is fully visible at ${viewport.width}×${viewport.height} in ${locale}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto('/auth')
        await page.getByRole('button', { name: locale, exact: true }).click()
        await page.evaluate(() => document.fonts.ready)

        const link = forgotPassword(page)
        await expect(link).toBeVisible()
        expect(await textIsClipped(link), `${viewport.width}×${viewport.height} ${locale}`).toBe(false)
        expect(await horizontalOverflow(page)).toBe(0)

        const inLabelRow = viewport.width >= 480
        const position = await link.evaluate((element) => getComputedStyle(element).position)
        expect(position).toBe(inLabelRow ? 'absolute' : 'relative')

        if (!inLabelRow) {
          const minHeight = await link.evaluate((element) => getComputedStyle(element).minHeight)
          expect(minHeight).toBe('44px')
          const linkBox = await link.boundingBox()
          const fieldBox = await passwordField(page).boundingBox()
          const errorBox = await page.locator('#password-error').boundingBox()
          expect(linkBox && fieldBox && errorBox).toBeTruthy()
          expect(linkBox!.y).toBeGreaterThan(fieldBox!.y + fieldBox!.height)
          // The 44px row sits against the reserved error slot, not a field below it.
          expect(Math.abs(linkBox!.y - (errorBox!.y + errorBox!.height))).toBeLessThanOrEqual(1)
          expect(await link.evaluate((element) => getComputedStyle(element).alignItems)).toBe('center')
          expect(Math.abs(linkBox!.x + linkBox!.width - (fieldBox!.x + fieldBox!.width))).toBeLessThanOrEqual(1)
        } else {
          const label = page.locator('label[for="password"]')
          const delta = Math.abs((await textBaseline(label)) - (await textBaseline(link)))
          expect(delta, `baseline delta ${delta}`).toBeLessThanOrEqual(1)
          const linkBox = await link.boundingBox()
          const labelTextRight = await label.evaluate((element) => {
            const range = document.createRange()
            range.selectNodeContents(element)
            return range.getBoundingClientRect().right
          })
          expect(linkBox!.x).toBeGreaterThanOrEqual(labelTextRight - 1)
        }
      })
    }
  }

  for (const viewport of LOGIN_FIT_VIEWPORTS) {
    for (const locale of [
      { button: 'EN', signIn: /^sign in$/i },
      { button: 'ES', signIn: /^entrar$/i },
    ] as const) {
      test(`login at ${viewport.width}×${viewport.height} in ${locale.button} still shows the sign-in button without scrolling`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto('/auth')
        await page.getByRole('button', { name: locale.button, exact: true }).click()
        await page.evaluate(() => document.fonts.ready)
        await page.mouse.move(0, 0)

        expect(await page.evaluate(() => window.scrollY)).toBe(0)
        if (viewport.height >= 720) expect(await verticalOverflow(page)).toBeLessThanOrEqual(0)
        const button = await page.getByRole('button', { name: locale.signIn }).boundingBox()
        expect(button).not.toBeNull()
        expect(Math.round(button!.y + button!.height)).toBeLessThanOrEqual(viewport.height)
      })
    }
  }

  test('is absent from sign-up and from recovery', async ({ page }) => {
    await page.goto('/auth?mode=signup')
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(forgotPassword(page)).toHaveCount(0)

    await page.goto('/auth?mode=reset')
    await expect(page.getByRole('heading', { level: 2, name: 'Reset your password' })).toBeVisible()
    await expect(forgotPassword(page)).toHaveCount(0)
  })

  test('tab order is email, password, the eye, the link, then sign in', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()
    await resetTabStart(page)

    for (const control of [
      page.getByRole('button', { name: 'EN', exact: true }),
      page.getByRole('button', { name: 'ES', exact: true }),
      emailField(page),
      passwordField(page),
      showPasswordButton(page),
      forgotPassword(page),
      page.getByRole('button', { name: /^sign in$/i }),
    ]) {
      await page.keyboard.press('Tab')
      await expect(control).toBeFocused()
      await expectGoldenFocusRing(control)
    }
  })
})

test.describe('forgot-password hit area on a coarse pointer', () => {
  test.use({ hasTouch: true, isMobile: true })

  test('the label-row target is at least 44×44 and misses the eye', async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 })
    await page.goto('/auth')
    await expect(forgotPassword(page)).toBeVisible()
    expect(await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches)).toBe(true)

    const hit = await hitBox(forgotPassword(page))
    expect(hit.width).toBeGreaterThanOrEqual(44)
    expect(hit.height).toBeGreaterThanOrEqual(44)

    const eye = await showPasswordButton(page).boundingBox()
    expect(eye).not.toBeNull()
    const center = { x: eye!.x + eye!.width / 2, y: eye!.y + eye!.height / 2 }
    expect(containsPoint(hit, center.x, center.y)).toBe(false)

    const hitOwner = await page.evaluate(({ x, y }) => {
      const target = document.elementFromPoint(x, y)
      return target?.closest('button')?.textContent ?? ''
    }, center)
    expect(hitOwner).not.toMatch(/forgot your password/i)
  })

  test('the portrait row is at least 44px tall', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/auth')
    const hit = await hitBox(forgotPassword(page))
    expect(hit.width).toBeGreaterThanOrEqual(44)
    expect(hit.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('reset view', () => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
  ] as const) {
    for (const locale of [
      {
        button: 'EN',
        title: 'Reset your password',
        help: /enter your email and we'll send you a link/i,
        send: /^send reset link$/i,
        back: /^back to sign in$/i,
      },
      {
        button: 'ES',
        title: 'Recupera tu contraseña',
        help: /escribe tu correo y te enviaremos un enlace/i,
        send: /^enviar enlace$/i,
        back: /^volver a entrar$/i,
      },
    ] as const) {
      test(`shows the recovery form at ${viewport.width}×${viewport.height} in ${locale.button}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto('/auth?mode=reset')
        await page.getByRole('button', { name: locale.button, exact: true }).click()
        await page.evaluate(() => document.fonts.ready)

        const title = page.getByRole('heading', { level: 2, name: locale.title })
        const help = page.getByText(locale.help)
        const field = emailField(page)
        const send = page.getByRole('button', { name: locale.send })
        const back = page.getByRole('button', { name: locale.back })

        for (const part of [title, help, field, send, back]) {
          await part.scrollIntoViewIfNeeded()
          await expect(part).toBeVisible()
        }
        expect(await horizontalOverflow(page)).toBe(0)
        await expect(passwordField(page)).toHaveCount(0)
        await expect(field).toHaveAttribute('type', 'email')
        await expect(field).toHaveAttribute('autocomplete', 'email')
        await expect(field).toHaveAttribute('inputmode', 'email')
        const type = await field.evaluate((element) => {
          const style = getComputedStyle(element)
          return { fontSize: style.fontSize, minHeight: style.minHeight }
        })
        expect(type).toEqual({ fontSize: '16px', minHeight: '46px' })
        const titleStyle = await title.evaluate((element) => {
          const style = getComputedStyle(element)
          return { fontWeight: style.fontWeight, fontSize: style.fontSize, color: style.color }
        })
        const helpStyle = await help.evaluate((element) => {
          const style = getComputedStyle(element)
          return { fontWeight: style.fontWeight, fontSize: style.fontSize, color: style.color }
        })
        expect(titleStyle.fontWeight).toBe('600')
        expect(helpStyle.fontWeight).toBe('400')
        expect(titleStyle.fontSize).toBe(helpStyle.fontSize)
        expect(helpStyle.color).toBe(titleStyle.color)
      })
    }
  }

  test('keeps the send button on screen at 740×360 and does not scroll at 1280×720', async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 })
    await page.goto('/auth?mode=reset')
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    const send = await sendReset(page).boundingBox()
    expect(send).not.toBeNull()
    expect(Math.round(send!.y + send!.height)).toBeLessThanOrEqual(360)

    const help = page.locator('#reset-help')
    const hidden = await help.evaluate((element) => {
      const style = getComputedStyle(element)
      return style.position === 'absolute' && Number.parseFloat(style.width) <= 1
    })
    expect(hidden).toBe(true)
    await expect(emailField(page)).toHaveAttribute('aria-describedby', 'reset-help')

    await page.setViewportSize({ width: 852, height: 393 })
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    const landscape = await sendReset(page).boundingBox()
    expect(landscape).not.toBeNull()
    expect(Math.round(landscape!.y + landscape!.height)).toBeLessThanOrEqual(393)

    await page.setViewportSize({ width: 1280, height: 720 })
    await page.evaluate(() => document.fonts.ready)
    expect(await verticalOverflow(page)).toBeLessThanOrEqual(0)
    expect(await horizontalOverflow(page)).toBe(0)
  })

  test('focuses the title from the login link and from the url, and keeps a typed email', async ({ page }) => {
    await page.goto('/auth')
    await emailField(page).fill('hero@example.com')
    await forgotPassword(page).click()

    const title = page.getByRole('heading', { level: 2, name: 'Reset your password' })
    await expect(page).toHaveURL('/auth?mode=reset')
    await expect(title).toBeFocused()
    await expect(emailField(page)).toHaveValue('hero@example.com')
    await expect(title).toHaveAttribute('tabindex', '-1')

    await page.goto('/auth?mode=reset')
    await expect(title).toBeFocused()
    await expect(emailField(page)).toHaveValue('')
  })

  test('returns to sign in', async ({ page }) => {
    await page.goto('/auth?mode=reset')
    await backToSignIn(page).click()

    await expect(page).toHaveURL('/auth')
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible()
    await expect(forgotPassword(page)).toBeVisible()
  })

  test('reuses the field errors under the email, in English and Spanish', async ({ page }) => {
    await page.goto('/auth?mode=reset')
    const email = emailField(page)
    const error = page.locator('#email-error')

    await sendReset(page).click()
    await expect(email).toBeFocused()
    await expect(error).toHaveText('Enter your email.')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAttribute('aria-describedby', /email-error/)
    await expect(email).toHaveAttribute('aria-describedby', /reset-help/)

    await email.fill('not-an-email')
    await email.blur()
    await expect(error).toHaveText('Enter a valid email address.')

    await page.getByRole('button', { name: 'ES', exact: true }).click()
    // The same keys as sign-in (#33). Recovery does not keep a second pair.
    await expect(error).toHaveText('Introduce un correo válido.')
    await email.fill('')
    await email.blur()
    await expect(error).toHaveText('Introduce tu correo.')
  })
})

test.describe('recovery confirmation', () => {
  test('shows the same message for an address that exists and one that does not', async ({ page }) => {
    const seen: string[] = []
    await page.route('**/auth/v1/recover**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    )

    for (const address of ['exists@example.com', 'missing@example.com']) {
      await page.goto('/auth?mode=reset')
      await emailField(page).fill(address)
      const request = page.waitForRequest('**/auth/v1/recover**')
      await sendReset(page).click()
      const sent = await request
      const redirectTo = new URL(sent.url()).searchParams.get('redirect_to')
      expect(redirectTo).toBe(`${new URL(page.url()).origin}/auth?mode=update-password`)
      expect(sent.postDataJSON().email).toBe(address)

      const heading = page.getByRole('heading', { level: 2, name: 'Check your email' })
      await expect(heading).toBeVisible()
      await expect(heading).toBeFocused()
      const message = page.getByText(CONFIRMATION)
      await expect(message).toBeVisible()
      seen.push((await message.textContent()) ?? '')
      await expect(page.getByText(address)).toHaveCount(0)
      await expect(page.locator('[aria-live]')).toHaveCount(0)
      await expect(page.locator('svg[aria-hidden="true"]').first()).toBeVisible()
    }

    expect(seen[0]).toBe(CONFIRMATION)
    expect(seen[1]).toBe(seen[0])
  })

  test('a missing account shows the same confirmation as a successful request', async ({ page }) => {
    await page.route('**/auth/v1/recover**', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error_code: 'user_not_found', msg: 'User not found' }),
      }),
    )

    await page.goto('/auth?mode=reset')
    await emailField(page).fill('missing@example.com')
    await sendReset(page).click()

    const heading = page.getByRole('heading', { level: 2, name: 'Check your email' })
    await expect(heading).toBeVisible()
    await expect(heading).toBeFocused()
    await expect(page.getByText(CONFIRMATION)).toBeVisible()
    await expect(page.getByText('missing@example.com')).toHaveCount(0)
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('leaving recovery drops the confirmation so the form comes back empty of it', async ({ page }) => {
    await page.route('**/auth/v1/recover**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    )

    await page.goto('/auth?mode=reset')
    await emailField(page).fill('hero@example.com')
    await sendReset(page).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Check your email' })).toBeVisible()

    await backToSignIn(page).click()
    await expect(forgotPassword(page)).toBeVisible()

    await forgotPassword(page).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Reset your password' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Check your email' })).toHaveCount(0)
    await expect(sendReset(page)).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(emailField(page)).toHaveValue('hero@example.com')

    await page.goBack()
    await page.goBack()
    await expect(page).toHaveURL(/mode=reset/)
    await expect(page.getByRole('heading', { level: 2, name: 'Check your email' })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 2, name: 'Reset your password' })).toBeVisible()
    await expect(sendReset(page)).toBeVisible()
  })

  test('uses the Spanish confirmation and can try a different email', async ({ page }) => {
    await page.route('**/auth/v1/recover**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    )

    await page.goto('/auth?mode=reset')
    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await emailField(page).fill('hero@example.com')
    await page.getByRole('button', { name: /^enviar enlace$/i }).click()

    const heading = page.getByRole('heading', { level: 2, name: 'Revisa tu correo' })
    await expect(heading).toBeFocused()
    await expect(page.getByText(CONFIRMATION_ES)).toBeVisible()
    await expect(page.getByText('hero@example.com')).toHaveCount(0)

    await page.getByRole('button', { name: /usar otro correo/i }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Recupera tu contraseña' })).toBeFocused()
    await expect(emailField(page)).toHaveValue('hero@example.com')
    await expect(page.getByText(CONFIRMATION_ES)).toHaveCount(0)
  })

  test('a network failure and a rate limit stay on the form', async ({ page }) => {
    await page.route('**/auth/v1/recover**', (route) => route.abort('failed'))
    await page.goto('/auth?mode=reset')
    await emailField(page).fill('hero@example.com')
    await sendReset(page).click()

    const alert = page.getByRole('alert')
    await expect(alert).toHaveText("We couldn't send the link. Check your connection and try again.")
    await expect(page.getByRole('heading', { level: 2, name: 'Check your email' })).toHaveCount(0)

    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await page.getByRole('button', { name: /^enviar enlace$/i }).click()
    await expect(alert).toHaveText('No hemos podido enviar el enlace. Revisa tu conexión e inténtalo de nuevo.')

    await page.unroute('**/auth/v1/recover**')
    await page.route('**/auth/v1/recover**', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error_code: 'over_email_send_rate_limit',
          msg: 'For security purposes, you can only request this once every 60 seconds.',
        }),
      }),
    )

    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await sendReset(page).click()
    await expect(alert).toHaveText('Too many attempts. Wait a minute and try again.')
    await expect(page.getByRole('heading', { level: 2, name: 'Check your email' })).toHaveCount(0)

    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await page.getByRole('button', { name: /^enviar enlace$/i }).click()
    await expect(alert).toHaveText('Demasiados intentos. Espera un minuto e inténtalo de nuevo.')
  })

  test('sending keeps the button size, the focus, and a single request', async ({ page }) => {
    let calls = 0
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    await page.route('**/auth/v1/recover**', async (route) => {
      calls += 1
      await gate
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })

    await page.goto('/auth?mode=reset')
    await emailField(page).fill('hero@example.com')
    await page.mouse.move(0, 0)
    const before = await sendReset(page).boundingBox()
    expect(before).not.toBeNull()

    await sendReset(page).click()
    const sending = page.getByRole('button', { name: /^sending…$/i })
    await expect(sending).toBeVisible()
    await page.mouse.move(0, 0)
    const during = await sending.boundingBox()
    expect(during).not.toBeNull()
    expect(Math.abs(during!.width - before!.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(during!.height - before!.height)).toBeLessThanOrEqual(1)
    await expect(sending).toHaveAttribute('aria-disabled', 'true')
    expect(await sending.evaluate((element) => element.hasAttribute('disabled'))).toBe(false)
    await expect(sending).toBeFocused()
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true')
    await expect(emailField(page)).toHaveAttribute('readonly', '')
    await expect(sending.locator('.animate-spin')).toHaveCount(0)

    // aria-disabled keeps the button out of the accessibility tree's enabled
    // state, but a real click still reaches the handler. That click must not
    // send a second request.
    await sending.click({ force: true })
    expect(calls).toBe(1)

    release()
    await expect(page.getByRole('heading', { level: 2, name: 'Check your email' })).toBeVisible()
  })

  test('the link and the confirmation clear 4.5:1 on the card', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/auth')
    await page.evaluate(() => document.fonts.ready)
    await expectTextContrast(forgotPassword(page), 'forgot password')

    await page.route('**/auth/v1/recover**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    )
    await page.goto('/auth?mode=reset')
    await emailField(page).fill('hero@example.com')
    await sendReset(page).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Check your email' })).toBeVisible()
    await expectTextContrast(page.getByText(CONFIRMATION), 'confirmation')
  })

  test('the back button stays on one line at 320 and 375', async ({ page }) => {
    await page.route('**/auth/v1/recover**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    )

    for (const viewport of [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
    ]) {
      for (const locale of [
        { button: 'EN', label: 'Back to sign in' },
        { button: 'ES', label: 'Volver a entrar' },
      ] as const) {
        await page.setViewportSize(viewport)
        await page.goto('/auth?mode=reset')
        await page.getByRole('button', { name: locale.button, exact: true }).click()
        await page.evaluate(() => document.fonts.ready)
        await emailField(page).fill('hero@example.com')
        await page.getByRole('button', { name: /^(send reset link|enviar enlace)$/i }).click()
        await page.mouse.move(0, 0)

        const back = page.getByRole('button', { name: locale.label, exact: true })
        await expect(back).toBeVisible()
        const laidOut = await back.evaluate((element) => {
          const style = getComputedStyle(element)
          const range = document.createRange()
          range.selectNodeContents(element)
          const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0)
          const lines = new Set(rects.map((rect) => Math.round(rect.top))).size
          const padX = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
          const textWidth = rects.reduce((widest, rect) => Math.max(widest, rect.width), 0)
          const contentHeight = Number.parseFloat(style.paddingTop)
            + Number.parseFloat(style.paddingBottom)
            + Number.parseFloat(style.lineHeight)
          const border = Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth)
          const singleLine = Math.max(contentHeight, Number.parseFloat(style.minHeight)) + border
          return {
            lines,
            textWidth,
            contentWidth: element.getBoundingClientRect().width - padX,
            height: element.getBoundingClientRect().height,
            singleLine,
            letterSpacing: style.letterSpacing,
          }
        })
        expect(laidOut.letterSpacing, locale.label).not.toBe('0px')
        expect(laidOut.lines, `${viewport.width} ${locale.label}`).toBe(1)
        expect(laidOut.textWidth, `${viewport.width} ${locale.label}`).toBeLessThanOrEqual(laidOut.contentWidth + 1)
        expect(laidOut.height, `${viewport.width} ${locale.label}`).toBeLessThanOrEqual(laidOut.singleLine + 0.5)
      }
    }
  })
})

test('sign-up stores the selected language in the account metadata', async ({ page }) => {
  await page.goto('/auth?mode=signup')
  await page.getByRole('button', { name: 'ES', exact: true }).click()
  await emailField(page).fill('hero@example.com')
  await passwordField(page).fill('abcd1234')
  await page.getByLabel(/nombre de usuario/i).fill('hero')

  const request = page.waitForRequest('**/auth/v1/signup**')
  await page.getByRole('button', { name: /^crear cuenta$/i }).click()
  expect((await request).postDataJSON().data).toEqual({ username: 'hero', language: 'es' })
})
