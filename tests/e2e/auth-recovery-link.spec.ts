import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Locator, type Page } from './setup'
import tailwindConfig from '../../tailwind.config.js'
import { legibleTextContrast, minimumContrast } from './pixelContrast'

/**
 * An expired, used, or unreachable recovery link (#38).
 *
 * GoTrue reports a used link and an expired one with the same code, so the
 * card is one combined state. A check that never answers gives up at 10s.
 */

const EXPIRED_HASH =
  '/auth?mode=update-password#error=access_denied&error_code=otp_expired&error_description=Email%20link%20is%20invalid%20or%20has%20expired'
const CODE_URL = '/auth?mode=update-password&code=recovery-code'
const EXPIRED_BODY =
  'Reset links only work once and for a limited time. Request a new one and use the most recent email.'
const EXPIRED_BODY_ES =
  'Los enlaces de recuperación solo sirven una vez y durante un tiempo limitado. Pide uno nuevo y usa el correo más reciente.'

const medievalGold = tailwindConfig.theme.extend.colors.medieval.gold

function hexToCssRgb(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16)
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`
}

const goldenRingColor = hexToCssRgb(medievalGold)
const inkBlack = hexToCssRgb(tailwindConfig.theme.extend.colors.medieval.inkblack)
const goldenRingShadow = `${inkBlack} 0px 0px 0px 2px, ${inkBlack} 0px 0px 0px 5px`

function seedVerifier(page: Page) {
  return page.addInitScript(() => {
    localStorage.setItem(
      'sb-mock-auth-token-code-verifier',
      JSON.stringify('pkce-verifier/recovery'),
    )
  })
}

async function installRecoverySession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('sb-mock-auth-token', JSON.stringify({
      user: { id: 'recovery-user', email: 'hero@example.com' },
      profile: {
        id: 'recovery-user',
        username: 'Hero',
        created_at: '2024-01-01T00:00:00.000Z',
      },
      access_token: 'recovery-access-token',
      refresh_token: 'recovery-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      token_type: 'bearer',
    }))
    ;(window as Window & { mockPasswordRecovery?: boolean }).mockPasswordRecovery = true
  })
}

/** The label sits on one line, inside the button, with 12px clear of each edge. */
async function expectCtaFits(button: Locator) {
  await expect(button).toBeVisible()
  const fit = await button.evaluate((element) => {
    const style = getComputedStyle(element)
    const range = document.createRange()
    range.selectNodeContents(element)
    const text = range.getBoundingClientRect()
    const host = element.getBoundingClientRect()
    const lines = new Set(
      [...range.getClientRects()]
        .filter((rect) => rect.width > 0 && rect.height > 0)
        .map((rect) => Math.round(rect.top)),
    ).size
    return {
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      labelWidth: text.width,
      left: text.left - host.left,
      right: host.right - text.right,
      lines,
      textOverflow: style.textOverflow,
    }
  })
  expect(fit.lines, JSON.stringify(fit)).toBe(1)
  expect(fit.scrollWidth, JSON.stringify(fit)).toBeLessThanOrEqual(fit.clientWidth)
  expect(fit.labelWidth, JSON.stringify(fit)).toBeLessThanOrEqual(fit.clientWidth)
  expect(fit.left, JSON.stringify(fit)).toBeGreaterThanOrEqual(12)
  expect(fit.right, JSON.stringify(fit)).toBeGreaterThanOrEqual(12)
  expect(fit.textOverflow).not.toBe('ellipsis')
}

async function expectGoldenFocusRing(locator: Locator) {
  await expect.poll(async () => locator.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      matchesFocusVisible: element.matches(':focus-visible'),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
    }
  })).toEqual({
    matchesFocusVisible: true,
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineColor: goldenRingColor,
  })
  const shadow = await locator.evaluate((element) => getComputedStyle(element).boxShadow)
  expect(shadow).toBe(goldenRingShadow)
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

async function expectTextContrast(locator: Locator, label: string, inset = 0) {
  const box = await locator.boundingBox()
  expect(box, label).not.toBeNull()
  const textRects = await locator.evaluate((element, edge) => {
    const host = element.getBoundingClientRect()
    const range = document.createRange()
    range.selectNodeContents(element)
    const rects = [...range.getClientRects()].map((rect) => ({
      x: rect.x - host.x,
      y: rect.y - host.y,
      width: rect.width,
      height: rect.height,
    }))
    if (edge <= 0) return rects
    return [
      ...rects,
      { x: 0, y: 0, width: host.width, height: edge },
      { x: 0, y: host.height - edge, width: host.width, height: edge },
      { x: 0, y: 0, width: edge, height: host.height },
      { x: host.width - edge, y: 0, width: edge, height: host.height },
    ]
  }, inset)
  const ratio = minimumContrast(await locator.screenshot(), box!.width, textRects, await foreground(locator))
  console.log(`contrast ${label} ${ratio.toFixed(2)}:1`)
  expect(ratio, `${label} ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
  return ratio
}

/** Gold against the dark halo, not against the padding the halo does not cover. */
async function expectLinkContrast(locator: Locator, label: string) {
  const box = await locator.boundingBox()
  expect(box, label).not.toBeNull()
  const color = await foreground(locator)
  const originalShadow = await locator.evaluate((element) => element.style.textShadow)
  // The shadow is an inline style, so a screenshot stylesheet cannot replace it.
  await locator.evaluate((element) => {
    element.style.color = 'transparent'
  })
  const shadowPng = await locator.screenshot()
  await locator.evaluate((element) => {
    element.style.textShadow = 'none'
  })
  const barePng = await locator.screenshot()
  await locator.evaluate((element, shadow) => {
    element.style.color = ''
    element.style.textShadow = shadow
  }, originalShadow)
  const ratio = legibleTextContrast(shadowPng, barePng, box!.width, box!.height, color)
  console.log(`contrast ${label} ${ratio.toFixed(2)}:1`)
  expect(ratio, `${label} ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
}

async function hideEmbers(page: Page) {
  await page.locator('.ember').evaluateAll((nodes) => {
    nodes.forEach((node) => {
      ;(node as HTMLElement).style.display = 'none'
    })
  })
}

test.describe('expired or unreachable recovery link', () => {
  test('an expired redirect is one card, in English and Spanish, and offers a new link', async ({ page }) => {
    await page.goto(EXPIRED_HASH)

    const title = page.getByRole('heading', { level: 2, name: 'This link has expired' })
    await expect(title).toBeVisible()
    await expect(title).toBeFocused()
    await expect(title).toHaveAttribute('tabindex', '-1')
    await expect(page.getByText(EXPIRED_BODY)).toBeVisible()
    await expect(page.locator('[aria-live]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /sign up/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'EN', exact: true })).toBeVisible()
    await expect(page).toHaveURL('/auth?mode=update-password')
    await expectGoldenFocusRing(title)

    const request = page.getByRole('button', { name: 'Request a new link' })
    const back = page.getByRole('button', { name: 'Back to sign in' })
    await expect(request).toBeVisible()
    await expect(back).toBeVisible()
    const requestBox = await request.boundingBox()
    const backBox = await back.boundingBox()
    expect(requestBox!.height).toBeGreaterThanOrEqual(44)
    expect(backBox!.height).toBeGreaterThanOrEqual(44)
    expect(backBox!.width).toBeGreaterThanOrEqual(44)

    await request.focus()
    await expectGoldenFocusRing(request)

    await page.reload()
    await expect(page.getByRole('heading', { level: 2, name: /isn't valid/i })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'This link has expired' })).toHaveCount(0)

    await page.goto(EXPIRED_HASH)
    await page.getByRole('button', { name: 'Request a new link' }).click()
    await expect(page).toHaveURL('/auth?mode=reset')
    const reset = page.getByRole('heading', { level: 2, name: 'Reset your password' })
    await expect(reset).toBeVisible()
    await expect(reset).toBeFocused()
    await expect(page.getByLabel(/email/i)).toHaveValue('')

    await page.goto(EXPIRED_HASH)
    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Este enlace ha caducado' })).toBeVisible()
    await expect(page.getByText(EXPIRED_BODY_ES)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pedir un enlace nuevo' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Volver a entrar' })).toBeVisible()
  })

  test('a used-or-expired code exchange shows the same card and drops the code', async ({ page }) => {
    await seedVerifier(page)
    await page.route('**/auth/v1/token**', (route) => route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({
        error_code: 'otp_expired',
        msg: 'Email link is invalid or has expired',
      }),
    }))
    await page.goto(CODE_URL)

    const title = page.getByRole('heading', { level: 2, name: 'This link has expired' })
    await expect(title).toBeVisible()
    await expect(title).toBeFocused()
    await expect(page).toHaveURL('/auth?mode=update-password')
    await expect(page).not.toHaveURL(/code=/)
  })

  test('a network failure keeps the code and a retry checks the same link', async ({ page }) => {
    await seedVerifier(page)
    let fail = true
    let release = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    await page.route('**/auth/v1/token**', async (route) => {
      if (fail) {
        await route.abort('failed')
        return
      }
      await held
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error_code: 'otp_expired',
          msg: 'Email link is invalid or has expired',
        }),
      })
    })
    await page.goto(CODE_URL)

    const title = page.getByRole('heading', { level: 2, name: "We couldn't check your link" })
    await expect(title).toBeVisible()
    await expect(title).toBeFocused()
    await expect(page.getByText('Check your connection and try again.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back to sign in' })).toHaveCount(0)
    await expect(page).toHaveURL(/code=recovery-code/)
    await expect(page.locator('[aria-live]')).toHaveCount(0)

    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'No hemos podido comprobar el enlace' })).toBeVisible()
    await expect(page.getByText('Revisa tu conexión y vuelve a intentarlo.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pedir un enlace nuevo' })).toBeVisible()
    await page.getByRole('button', { name: 'EN', exact: true }).click()

    fail = false
    const retry = page.getByRole('button', { name: 'Try again' })
    await retry.click()
    const checking = page.getByRole('button', { name: 'Checking…' })
    await expect(checking).toBeVisible()
    await expect(checking).toHaveAttribute('aria-disabled', 'true')
    expect(await checking.evaluate((element) => element.hasAttribute('disabled'))).toBe(false)
    await expect(title).toBeVisible()

    release()
    const expired = page.getByRole('heading', { level: 2, name: 'This link has expired' })
    await expect(expired).toBeVisible()
    await expect(expired).toBeFocused()
    await expect(page).toHaveURL('/auth?mode=update-password')
  })

  test('checking shows a status line, then gives up after 10 seconds and keeps the code', async ({ page }) => {
    await seedVerifier(page)
    await page.clock.install()
    const pending: Array<() => void> = []
    await page.route('**/auth/v1/token**', async (route) => {
      await new Promise<void>((resolve) => pending.push(resolve))
      try {
        await route.abort('failed')
      } catch {
        // The page already aborted the request when the check gave up.
      }
    })
    await page.goto(CODE_URL)

    // Loading the page can already pass the 300ms mark. Step the clock so the
    // status line is up, then let the 10s cap fire.
    await page.clock.fastForward(300)
    const checking = page.getByRole('status')
    await expect(checking).toHaveText('Checking your link…')
    await expect(page.getByRole('heading', { level: 2, name: 'Checking your link…' })).toBeVisible()
    await expect(checking).not.toHaveAttribute('aria-live')
    await expect(page.locator('[aria-live]')).toHaveCount(0)

    await page.clock.fastForward(10_000)
    const title = page.getByRole('heading', { level: 2, name: "We couldn't check your link" })
    await expect(title).toBeVisible()
    await expect(title).toBeFocused()
    await expect(page).toHaveURL(/code=recovery-code/)
    pending.forEach((resolve) => resolve())
  })

  test('a link with no token stays on the generic invalid card', async ({ page }) => {
    await page.goto('/auth?mode=update-password')
    await expect(page.getByRole('heading', { level: 2, name: "This link isn't valid" })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'This link has expired' })).toHaveCount(0)
  })

  test('saving the new password replaces the recovery URL', async ({ page }) => {
    await installRecoverySession(page)
    await page.route('**/auth/v1/user**', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'recovery-user', email: 'hero@example.com' }),
    }))
    await page.goto('/auth?mode=update-password')
    await page.getByLabel('New password').fill('abcd1234')
    await page.getByRole('button', { name: 'Save password' }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'Password updated' })).toBeVisible()
    await expect(page).toHaveURL('/auth')

    await page.reload()
    await expect(page.getByRole('heading', { level: 2, name: 'Set a new password' })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 2, name: 'Password updated' })).toHaveCount(0)
    await expect(page).not.toHaveURL(/update-password/)
  })

  test('short landscape keeps the explanation, and 320px Spanish actions fit', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('questforge.language', 'es')
    })
    await page.setViewportSize({ width: 740, height: 360 })
    await page.goto(EXPIRED_HASH)

    const body = page.getByText(EXPIRED_BODY_ES)
    await expect(body).toBeVisible()
    const hidden = await body.evaluate((element) => {
      const style = getComputedStyle(element)
      return style.position === 'absolute' && Number.parseFloat(style.width) <= 1
    })
    expect(hidden).toBe(false)
    const wrap = await page.getByRole('heading', { level: 2, name: 'Este enlace ha caducado' })
      .evaluate((element) => getComputedStyle(element).textWrap)
    expect(wrap).toBe('balance')
  })

  test('Spanish actions fit on one line at 320', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('questforge.language', 'es')
    })
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto(EXPIRED_HASH)
    await page.evaluate(() => document.fonts.ready)
    await expectCtaFits(page.getByRole('button', { name: 'Pedir un enlace nuevo' }))

    await seedVerifier(page)
    await page.route('**/auth/v1/token**', (route) => route.abort('failed'))
    await page.goto(CODE_URL)
    await page.evaluate(() => document.fonts.ready)
    await expectCtaFits(page.getByRole('button', { name: 'Reintentar' }))
  })

  test('expired copy clears 4.5:1 over the scene at 375 and 1280', async ({ page }) => {
    for (const viewport of [
      { width: 375, height: 667 },
      { width: 1280, height: 720 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto(EXPIRED_HASH)
      await page.evaluate(() => document.fonts.ready)
      await hideEmbers(page)
      const label = `${viewport.width}x${viewport.height}`
      await expectTextContrast(page.getByRole('heading', { level: 2, name: 'This link has expired' }), `${label} title`)
      await expectTextContrast(page.getByText(EXPIRED_BODY), `${label} body`)
      await expectLinkContrast(page.getByRole('button', { name: 'Back to sign in' }), `${label} link`)
      const cta = page.getByRole('button', { name: 'Request a new link' })
      await cta.evaluate((element) => {
        element.style.boxShadow = 'none'
      })
      // Rounded corners are transparent, so the shot includes the dark card.
      // Skip that rim and read the gold fill behind the label.
      await expectTextContrast(cta, `${label} cta`, 12)
    }

    const results = await new AxeBuilder({ page }).withTags(['cat.aria', 'wcag143']).analyze()
    const failures = results.violations.flatMap((violation) =>
      violation.nodes.map((node) => `${violation.id}: ${node.html}`)
    )
    expect(failures).toEqual([])
  })
})
