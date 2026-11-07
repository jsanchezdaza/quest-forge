import { test, expect, type Locator, type Page } from './setup'
import { minimumContrast } from './pixelContrast'

/**
 * Password requirements on sign-up (#34).
 *
 * The checklist is visible before typing. Each row updates as the player
 * types, without a live announcement and without red error styling until
 * blur or submit. Sign-in does not show it.
 */

const LABEL_GAP = 8
const ROW_GAP = 4
const FIELD_GAP = 20

const passwordField = (page: Page) =>
  page.getByRole('textbox', { name: /^(password|contraseña)$/i })
const createAccountButton = (page: Page) =>
  page.getByRole('button', { name: /^(create account|crear cuenta)$/i })
const switchToSignUp = (page: Page) => page.getByRole('button', { name: /sign up$|regístrate$/i })

function requirements(page: Page): Locator {
  return page.locator('#password-requirements')
}

function requirement(page: Page, index: number): Locator {
  return requirements(page).locator('li').nth(index)
}

async function roundedGap(above: Locator, below: Locator): Promise<number> {
  const top = await above.boundingBox()
  const bottom = await below.boundingBox()
  expect(top).not.toBeNull()
  expect(bottom).not.toBeNull()
  return Math.round(bottom!.y - (top!.y + top!.height))
}

async function requirementContrast(list: Locator): Promise<number> {
  const box = await list.boundingBox()
  expect(box).not.toBeNull()
  const foreground = await list.evaluate((element) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas is unavailable')
    context.fillStyle = getComputedStyle(element).color
    context.fillRect(0, 0, 1, 1)
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data
    return [red, green, blue] as [number, number, number]
  })
  const textRects = await list.evaluate((element) => {
    const host = element.getBoundingClientRect()
    const ranges = [...element.querySelectorAll('li span:not(.sr-only), li svg')].map((node) => {
      const range = document.createRange()
      range.selectNode(node)
      return range
    })
    return ranges.flatMap((range) =>
      [...range.getClientRects()].map((rect) => ({
        x: rect.x - host.x,
        y: rect.y - host.y,
        width: rect.width,
        height: rect.height,
      })),
    )
  })
  const png = await list.screenshot()
  return minimumContrast(png, box!.width, textRects, foreground)
}

async function openSignUp(page: Page) {
  await page.goto('/auth?mode=signup')
  await expect(page.getByLabel(/username|nombre de usuario/i)).toBeVisible()
  await page.mouse.move(0, 0)
}

test.describe('password requirements', () => {
  test('sign-up shows every requirement before typing, and sign-in does not', async ({ page }) => {
    await page.goto('/auth')
    await expect(requirements(page)).toHaveCount(0)

    await switchToSignUp(page).click()
    const list = requirements(page)
    await expect(list).toBeVisible()
    await expect(list).toHaveAttribute('aria-live', 'off')
    await expect(requirement(page, 0)).toContainText('At least 8 characters')
    await expect(requirement(page, 1)).toContainText('At least one letter')
    await expect(requirement(page, 2)).toContainText('At least one number')
    for (const index of [0, 1, 2]) {
      await expect(requirement(page, index).locator('.sr-only')).toHaveText('not met')
      await expect(requirement(page, index).locator('svg')).toHaveClass(/lucide-circle/)
    }
    await expect(passwordField(page)).toHaveAttribute('aria-describedby', 'password-requirements')
    await expect(passwordField(page)).not.toHaveAttribute('aria-invalid', 'true')

    await page.getByRole('button', { name: /already have an account/i }).click()
    await expect(requirements(page)).toHaveCount(0)
    await expect(passwordField(page)).not.toHaveAttribute('aria-describedby', /requirements/)
  })

  test('marks each requirement as it is met, without red styling or a live announcement', async ({ page }) => {
    await openSignUp(page)
    const password = passwordField(page)
    const tops = async () =>
      Promise.all([0, 1, 2].map(async (index) => Math.round((await requirement(page, index).boundingBox())!.y)))

    const before = await tops()
    await password.pressSequentially('abc')

    await expect(requirement(page, 0).locator('.sr-only')).toHaveText('not met')
    await expect(requirement(page, 1).locator('.sr-only')).toHaveText('met')
    await expect(requirement(page, 2).locator('.sr-only')).toHaveText('not met')
    await expect(requirement(page, 1).locator('svg')).toHaveClass(/lucide-check/)
    await expect(requirement(page, 0).locator('svg')).toHaveClass(/lucide-circle/)
    await expect(password).not.toHaveAttribute('aria-invalid', 'true')
    const reservedError = page.locator('#password-error')
    await expect(reservedError).toHaveText('')
    await expect(reservedError).toHaveAttribute('aria-hidden', 'true')
    expect(await password.evaluate((element) => element.className)).not.toContain('border-red-500')
    expect(await tops()).toEqual(before)

    await password.fill('abc12345')
    for (const index of [0, 1, 2]) {
      await expect(requirement(page, index).locator('.sr-only')).toHaveText('met')
      await expect(requirement(page, index).locator('svg')).toHaveClass(/lucide-check/)
    }
    await expect(requirements(page).locator('li')).toHaveCount(3)
    expect(await tops()).toEqual(before)
    await expect(password).not.toHaveAttribute('aria-invalid', 'true')
  })

  test('keeps the error ahead of the list and describes the field with both', async ({ page }) => {
    await openSignUp(page)
    const password = passwordField(page)
    await password.fill('abcdefgh')
    await password.blur()

    const error = page.locator('#password-error')
    await expect(error).toHaveText('Include at least one number.')
    await expect(error).not.toContainText('At least one letter')
    await expect(password).toHaveAttribute('aria-invalid', 'true')
    await expect(password).toHaveAttribute('aria-describedby', 'password-error password-requirements')
    expect(await roundedGap(password, error)).toBe(LABEL_GAP)
    expect((await error.boundingBox())!.y).toBeLessThan((await requirements(page).boundingBox())!.y)
    await expect(requirements(page).locator('li')).toHaveCount(3)
  })

  test('uses 14px text, 8px under the input, and 4px between rows', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await openSignUp(page)

    const list = requirements(page)
    const style = await list.evaluate((element) => {
      const computed = getComputedStyle(element)
      return {
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
        textAlign: computed.textAlign,
      }
    })
    expect(style).toMatchObject({ fontSize: '14px', lineHeight: '20px' })
    expect(style.textAlign).toMatch(/^(left|start)$/)
    const error = page.locator('#password-error')
    await expect(error).toHaveText('')
    expect(await roundedGap(passwordField(page), error)).toBe(LABEL_GAP)
    expect(await roundedGap(error, list)).toBe(LABEL_GAP)
    expect(await roundedGap(requirement(page, 0), requirement(page, 1))).toBe(ROW_GAP)
    expect(await roundedGap(requirement(page, 1), requirement(page, 2))).toBe(ROW_GAP)
    expect(await roundedGap(list, createAccountButton(page))).toBe(FIELD_GAP)
    for (const index of [0, 1, 2]) {
      const row = requirement(page, index)
      expect(Math.round((await row.boundingBox())!.height)).toBe(20)
      expect(await row.evaluate((element) => getComputedStyle(element).minHeight)).toBe('20px')
    }
  })

  test('a single-line password error does not move the checklist or the button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })

    const tops = async () => {
      await page.mouse.move(0, 0)
      const list = await requirements(page).boundingBox()
      const button = await createAccountButton(page).boundingBox()
      expect(list).not.toBeNull()
      expect(button).not.toBeNull()
      return { list: Math.round(list!.y), button: Math.round(button!.y) }
    }

    const fillValidNeighbors = async () => {
      await page.getByLabel(/^email$/i).fill('user@example.com')
      await page.getByLabel(/^username$/i).fill('hero')
      await passwordField(page).fill('abcdefgh')
    }

    await openSignUp(page)
    await fillValidNeighbors()
    const beforeBlur = await tops()
    await passwordField(page).focus()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Show password', exact: true })).toBeFocused()
    const error = page.locator('#password-error')
    await expect(error).toHaveText('Include at least one number.')
    await expect(error).not.toHaveAttribute('aria-hidden', 'true')
    expect(await tops()).toEqual(beforeBlur)

    await openSignUp(page)
    await fillValidNeighbors()
    const beforeClick = await tops()
    await createAccountButton(page).click()
    await expect(passwordField(page)).toBeFocused()
    await expect(page.locator('#password-error')).toHaveText('Include at least one number.')
    expect(await tops()).toEqual(beforeClick)

    await openSignUp(page)
    await fillValidNeighbors()
    const beforeEnter = await tops()
    await passwordField(page).focus()
    await page.keyboard.press('Enter')
    await expect(passwordField(page)).toBeFocused()
    await expect(passwordField(page)).toHaveAttribute(
      'aria-describedby',
      'password-error password-requirements',
    )
    await expect(requirements(page)).toHaveAttribute('aria-live', 'off')
    await expect(page.locator('#password-error')).toHaveText('Include at least one number.')
    expect(await tops()).toEqual(beforeEnter)
  })

  test('the keyboard activates the mode toggle', async ({ page }) => {
    await openSignUp(page)
    const toggle = page.getByRole('button', { name: /already have an account/i })
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(requirements(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible()
  })

  test('a checklist row grows when its label wraps', async ({ page }) => {
    await page.setViewportSize({ width: 240, height: 900 })
    await openSignUp(page)
    const row = requirement(page, 0)
    const metrics = await row.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        minHeight: style.minHeight,
        overflowY: style.overflowY,
        whiteSpace: style.whiteSpace,
        height: element.getBoundingClientRect().height,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      }
    })
    expect(metrics.minHeight).toBe('20px')
    expect(metrics.overflowY).toBe('visible')
    expect(metrics.whiteSpace).not.toBe('nowrap')
    expect(metrics.height).toBeGreaterThan(20)
    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight)
  })

  test('a wrapping password error grows and stays above the checklist', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await openSignUp(page)
    await page.getByRole('button', { name: 'ES', exact: true }).click()
    const password = passwordField(page)
    await password.fill('abc')
    await password.blur()

    const error = page.locator('#password-error')
    await expect(error).toHaveText('La contraseña debe tener al menos 8 caracteres.')
    const metrics = await error.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        minHeight: style.minHeight,
        overflowY: style.overflowY,
        whiteSpace: style.whiteSpace,
        height: element.getBoundingClientRect().height,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      }
    })
    expect(metrics.minHeight).toBe('20px')
    expect(metrics.overflowY).toBe('visible')
    expect(metrics.whiteSpace).not.toBe('nowrap')
    expect(metrics.height).toBeGreaterThan(20)
    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight)
    expect(await roundedGap(error, requirements(page))).toBe(LABEL_GAP)
  })

  test('Spanish copy follows the same three rules', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await openSignUp(page)
    await page.getByRole('button', { name: 'ES', exact: true }).click()

    await expect(requirement(page, 0)).toContainText('Al menos 8 caracteres')
    await expect(requirement(page, 1)).toContainText('Al menos una letra')
    await expect(requirement(page, 2)).toContainText('Al menos un número')
    await expect(requirement(page, 0).locator('.sr-only')).toHaveText('no cumplido')

    await passwordField(page).fill('abc123')
    await expect(requirement(page, 0).locator('.sr-only')).toHaveText('no cumplido')
    await expect(requirement(page, 1).locator('.sr-only')).toHaveText('cumplido')
    await expect(requirement(page, 2).locator('.sr-only')).toHaveText('cumplido')
  })

  test('requirement text clears 4.5:1 on the composed card', async ({ page }) => {
    const expectContrast = async (label: string) => {
      const ratio = await requirementContrast(requirements(page))
      expect(ratio, `${label} ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
    }

    await page.setViewportSize({ width: 320, height: 900 })
    await openSignUp(page)
    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await expectContrast('320px')

    await page.setViewportSize({ width: 1280, height: 720 })
    await openSignUp(page)
    await page.locator('video').evaluate((video: HTMLVideoElement) => {
      if (video.readyState >= 2) return
      return new Promise((resolve) => video.addEventListener('loadeddata', () => resolve(undefined), { once: true }))
    })
    await expectContrast('1280px')
  })
})
