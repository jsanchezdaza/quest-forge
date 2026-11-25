import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Locator, type Page } from './setup'
import tailwindConfig from '../../tailwind.config.js'
import { colorContrast, legibleTextContrast, pngPixel } from './pixelContrast'

const EXPIRED_HASH =
  '/auth?mode=update-password#error=access_denied&error_code=otp_expired&error_description=Email%20link%20is%20invalid%20or%20has%20expired'
const EXPIRED_QUERY =
  '/auth?mode=update-password&error=access_denied&error_code=otp_expired&error_description=Email%20link%20is%20invalid%20or%20has%20expired'
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

interface Paint {
  color?: string
  textShadow?: string
  webkitTextFillColor?: string
  backgroundImage?: string
}

async function painted(locator: Locator, style: Paint): Promise<Buffer> {
  await locator.evaluate((element, next: Paint) => {
    element.style.color = next.color ?? ''
    element.style.webkitTextFillColor = next.webkitTextFillColor ?? ''
    element.style.textShadow = next.textShadow ?? ''
    element.style.backgroundImage = next.backgroundImage ?? ''
  }, style)
  try {
    return await locator.screenshot()
  } finally {
    await locator.evaluate((element) => {
      element.style.color = ''
      element.style.webkitTextFillColor = ''
      element.style.textShadow = ''
      element.style.backgroundImage = ''
    })
  }
}

async function linkContrast(locator: Locator): Promise<number> {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  const rendered = await locator.screenshot()
  const ink = await painted(locator, { textShadow: 'none' })
  const bare = await painted(locator, {
    color: 'transparent',
    webkitTextFillColor: 'transparent',
    textShadow: 'none',
    backgroundImage: 'none',
  })
  return legibleTextContrast(rendered, ink, bare, box!.width, box!.height, await foreground(locator))
}

function pngSize(png: Buffer) {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) }
}

function medianChannel(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

function medianRgb(colors: [number, number, number][]): [number, number, number] {
  return [
    medianChannel(colors.map((color) => color[0])),
    medianChannel(colors.map((color) => color[1])),
    medianChannel(colors.map((color) => color[2])),
  ]
}

async function restingBorderContrast(page: Page, input: Locator) {
  await input.scrollIntoViewIfNeeded()
  const box = await input.boundingBox()
  expect(box).not.toBeNull()
  const borderTop = await input.evaluate((element) => Number.parseFloat(getComputedStyle(element).borderTopWidth))
  const above = 6
  const clip = {
    x: Math.max(0, box!.x + box!.width / 2 - 4),
    y: Math.max(0, box!.y - above),
    width: 8,
    height: above + borderTop + 8,
  }
  const png = await page.screenshot({ clip })
  const size = pngSize(png)
  const scale = size.width / clip.width
  const yAt = (cssY: number) => Math.min(size.height - 1, Math.max(0, Math.round(cssY * scale)))
  const sample = (y: number) => {
    const colors: [number, number, number][] = []
    for (let dx = -2; dx <= 2; dx += 1) {
      const x = Math.min(size.width - 1, Math.max(0, Math.round(size.width / 2) + dx))
      colors.push(pngPixel(png, x, y))
    }
    return medianRgb(colors)
  }
  let borderY = 0
  let best = -1
  for (let y = 0; y < size.height; y += 1) {
    const color = sample(y)
    const score = color[0] + color[1] - 2 * color[2]
    if (score > best) {
      best = score
      borderY = y
    }
  }
  const border = sample(borderY)
  return {
    againstCard: colorContrast(border, sample(yAt(above - 2))),
    againstFill: colorContrast(border, sample(yAt(above + borderTop + 3))),
  }
}

async function rasterColor(page: Page, color: string): Promise<string> {
  return page.evaluate((value) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas is unavailable')
    context.clearRect(0, 0, 1, 1)
    context.fillStyle = value
    context.fillRect(0, 0, 1, 1)
    return [...context.getImageData(0, 0, 1, 1).data].join(',')
  }, color)
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

  test('card text clears 4.5:1 beside the letters below 768', async ({ page }, testInfo) => {
    test.setTimeout(180_000)
    await seedVerifier(page)
    await page.route('**/auth/v1/token**', (route) => route.abort('failed'))
    const lines: string[] = []
    const short: string[] = []
    const viewports = [
      { locale: 'ES' as const, width: 320, height: 568 },
      { locale: 'ES' as const, width: 375, height: 667 },
      { locale: 'ES' as const, width: 740, height: 360 },
      { locale: 'EN' as const, width: 375, height: 667 },
    ]
    const states = [
      {
        name: 'expired',
        heading: /this link has expired|este enlace ha caducado/i,
        open: (current: Page) => current.goto(EXPIRED_QUERY),
      },
      {
        name: 'timeout',
        heading: /couldn't check your link|no hemos podido comprobar el enlace/i,
        open: (current: Page) => current.goto(CODE_URL),
      },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      for (const state of states) {
        await state.open(page)
        await page.getByRole('button', { name: viewport.locale, exact: true }).click()
        await page.evaluate(() => document.fonts.ready)
        await page.addStyleTag({
          content: '.ember { animation: none !important; opacity: 0 !important; }',
        })
        await expect(page.getByRole('heading', { level: 2, name: state.heading })).toBeVisible()
        await page.evaluate(() => {
          const active = document.activeElement
          if (active instanceof HTMLElement) active.blur()
        })
        await page.mouse.move(0, 0)
        const card = page.getByTestId('auth-card')
        const texts = [
          card.getByRole('heading', { level: 2 }),
          card.locator('h2 + p, h2 ~ p').first(),
          ...await card.getByRole('button').all(),
        ]
        for (const locator of texts) {
          const box = await locator.boundingBox()
          if (!box || box.width < 8 || box.height < 8) continue
          const name = (await locator.innerText()).replace(/\s+/g, ' ').trim()
          const ratio = await linkContrast(locator)
          const where = `${state.name} ${name} ${viewport.width}×${viewport.height} ${viewport.locale} ${ratio.toFixed(2)}:1`
          lines.push(where)
          if (ratio < 4.5) short.push(where)
        }
      }
    }

    await installRecoverySession(page)
    await page.route('**/auth/v1/user**', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'recovery-user', email: 'hero@example.com' }),
    }))
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/auth?mode=update-password')
      await page.getByRole('button', { name: viewport.locale, exact: true }).click()
      await page.evaluate(() => document.fonts.ready)
      await page.addStyleTag({
        content: '.ember { animation: none !important; opacity: 0 !important; }',
      })
      await page.getByLabel(/new password|contraseña nueva/i).fill('abcd1234')
      await page.getByRole('button', { name: /save password|guardar contraseña/i }).click()
      await expect(page.getByRole('heading', { level: 2, name: /password updated|contraseña actualizada/i })).toBeVisible()
      await page.evaluate(() => {
        const active = document.activeElement
        if (active instanceof HTMLElement) active.blur()
      })
      await page.mouse.move(0, 0)
      const card = page.getByTestId('auth-card')
      const texts = [
        card.getByRole('heading', { level: 2 }),
        card.locator('h2 + p, h2 ~ p').first(),
        ...await card.getByRole('button').all(),
      ]
      for (const locator of texts) {
        const box = await locator.boundingBox()
        if (!box || box.width < 8 || box.height < 8) continue
        const name = (await locator.innerText()).replace(/\s+/g, ' ').trim()
        const ratio = await linkContrast(locator)
        const where = `saved ${name} ${viewport.width}×${viewport.height} ${viewport.locale} ${ratio.toFixed(2)}:1`
        lines.push(where)
        if (ratio < 4.5) short.push(where)
      }
    }

    const cardReport = `${lines.join('\n')}\n`
    await testInfo.attach('recovery-card-contrast.txt', {
      body: Buffer.from(cardReport),
      contentType: 'text/plain',
    })
    testInfo.annotations.push({ type: 'recovery-card-contrast', description: cardReport })
    console.log(cardReport)
    expect(short, cardReport).toEqual([])

    const results = await new AxeBuilder({ page }).withTags(['cat.aria', 'wcag143']).analyze()
    const axe = results.violations.flatMap((violation) =>
      violation.nodes.map((node) => `${violation.id}: ${node.html}`)
    )
    expect(axe).toEqual([])
  })

  test('the new-password field resting border clears 3:1 below 768', async ({ page }, testInfo) => {
    await installRecoverySession(page)
    const lines: string[] = []
    const short: string[] = []
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 740, height: 360 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/auth?mode=update-password')
      await page.getByRole('button', { name: 'ES', exact: true }).click()
      await page.evaluate(() => document.fonts.ready)
      await page.addStyleTag({
        content: '.ember { animation: none !important; opacity: 0 !important; } #password { transition: none !important; }',
      })
      await page.mouse.move(0, 0)
      const input = page.locator('#password')
      const measured = await restingBorderContrast(page, input)
      const where = [
        `password ${viewport.width}×${viewport.height}`,
        `card ${measured.againstCard.toFixed(2)}:1`,
        `fill ${measured.againstFill.toFixed(2)}:1`,
      ].join(' ')
      lines.push(where)
      if (measured.againstCard < 3 || measured.againstFill < 3) short.push(where)
    }

    const borderReport = `${lines.join('\n')}\n`
    await testInfo.attach('recovery-input-border.txt', {
      body: Buffer.from(borderReport),
      contentType: 'text/plain',
    })
    testInfo.annotations.push({ type: 'recovery-input-border', description: borderReport })
    console.log(borderReport)
    expect(short, borderReport).toEqual([])

    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/auth?mode=update-password')
    await expect(page.getByRole('heading', { level: 2, name: /set a new password|crea una contraseña nueva/i })).toBeVisible()
    await page.addStyleTag({ content: '#password { transition: none !important; }' })
    const password = page.locator('#password')
    await password.evaluate((element) => element.focus({ focusVisible: true }))
    await expect.poll(() => password.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
    const focused = await password.evaluate((element) => getComputedStyle(element).borderTopColor)
    expect(await rasterColor(page, focused), `focused border ${focused}`).toBe(await rasterColor(page, 'rgb(212 175 55)'))

    await page.setViewportSize({ width: 1280, height: 720 })
    await password.blur()
    const desktop = await password.evaluate((element) => getComputedStyle(element).borderTopColor)
    const resting = await page.evaluate(() => {
      const probe = document.createElement('div')
      probe.className = 'border border-medieval-gold/30'
      document.body.appendChild(probe)
      const color = getComputedStyle(probe).borderTopColor
      probe.remove()
      return color
    })
    expect(desktop, 'desktop border stays border-medieval-gold/30').toBe(resting)
  })
})
