import { test, expect, type Locator, type Page } from './setup'
import { VALIDATION_RULES } from '../../src/constants/validation'
import { minimumContrast } from './pixelContrast'

/**
 * Format errors under each auth field (#33).
 *
 * The browser bubble is off. A field shows its message after blur or submit,
 * not while the player is typing into it for the first time. One line is
 * reserved under every field so a single-line message does not move the next
 * field. A message that wraps grows in that slot and keeps the 20px group gap.
 */

const LABEL_GAP = 8
const FIELD_GAP = 20

const emailField = (page: Page) => page.getByLabel(/email|correo/i)
const passwordField = (page: Page) =>
  page.getByRole('textbox', { name: /^(password|contraseña)$/i })
const usernameField = (page: Page) => page.getByLabel(/username|nombre de usuario/i)
const signInButton = (page: Page) => page.getByRole('button', { name: /^sign in$/i })
const createAccountButton = (page: Page) => page.getByRole('button', { name: /^create account$/i })
const switchToSignUp = (page: Page) => page.getByRole('button', { name: /sign up$/i })

const passwordTooShort = `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters.`
const usernameTooShort = `Username must be at least ${VALIDATION_RULES.USERNAME_MIN_LENGTH} characters.`
const usernameTooLong = `Username must be at most ${VALIDATION_RULES.USERNAME_MAX_LENGTH} characters.`

function fieldError(page: Page, id: string): Locator {
  return page.locator(`#${id}-error`)
}

async function roundedGap(above: Locator, below: Locator): Promise<number> {
  const top = await above.boundingBox()
  const bottom = await below.boundingBox()
  expect(top).not.toBeNull()
  expect(bottom).not.toBeNull()
  return Math.round(bottom!.y - (top!.y + top!.height))
}

async function topOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return Math.round(box!.y)
}

/** Contrast of the message against the composited card behind it, not a flat color. */
async function fieldErrorContrast(error: Locator): Promise<number> {
  const box = await error.boundingBox()
  expect(box).not.toBeNull()
  const foreground = await error.evaluate((element) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas is unavailable')
    context.fillStyle = getComputedStyle(element).color
    context.fillRect(0, 0, 1, 1)
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data
    return [red, green, blue] as [number, number, number]
  })
  const textRects = await error.evaluate((element) => {
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
  const png = await error.screenshot()
  return minimumContrast(png, box!.width, textRects, foreground)
}

test.describe('auth field validation', () => {
  test('disables the native bubble and shows the format error under the field', async ({ page }) => {
    await page.goto('/auth')

    await expect(page.locator('form')).toHaveJSProperty('noValidate', true)

    await emailField(page).fill('not-an-email')
    await passwordField(page).fill('password123')
    await signInButton(page).click()

    const error = fieldError(page, 'email')
    await expect(error).toHaveText('Enter a valid email address.')
    await expect(error).toBeVisible()
    expect(await roundedGap(emailField(page), error)).toBe(LABEL_GAP)

    const style = await error.evaluate((element) => {
      const computed = getComputedStyle(element)
      return {
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
        textAlign: computed.textAlign,
        textTransform: computed.textTransform,
        usesErrorColor: element.classList.contains('text-red-400'),
      }
    })
    expect(style).toMatchObject({
      fontSize: '14px',
      lineHeight: '20px',
      textTransform: 'none',
      usesErrorColor: true,
    })
    expect(style.textAlign).toMatch(/^(left|start)$/)
    await expect(page.getByRole('alert')).not.toBeVisible()
  })

  test('shows an error on blur or submit, not while typing for the first time', async ({ page }) => {
    await page.goto('/auth')
    const email = emailField(page)
    const error = fieldError(page, 'email')

    await email.pressSequentially('not-an-email')
    await expect(error).toHaveText('')

    await email.blur()
    await expect(error).toHaveText('Enter a valid email address.')

    await email.fill('user@example.com')
    await expect(error).toHaveText('')

    await email.fill('')
    await passwordField(page).fill('x'.repeat(VALIDATION_RULES.PASSWORD_MIN_LENGTH - 1))
    await signInButton(page).click()

    await expect(error).toHaveText('Enter your email.')
    await expect(fieldError(page, 'password')).toHaveText(passwordTooShort)
  })

  test('moves focus to the first invalid field on submit', async ({ page }) => {
    await page.goto('/auth?mode=signup')
    await expect(usernameField(page)).toBeVisible()

    await createAccountButton(page).click()
    await expect(emailField(page)).toBeFocused()

    await emailField(page).fill('user@example.com')
    await usernameField(page).fill('ab')
    await passwordField(page).fill('short')
    await createAccountButton(page).click()

    await expect(usernameField(page)).toBeFocused()
    await expect(fieldError(page, 'username')).toHaveText(usernameTooShort)
    await expect(fieldError(page, 'password')).toHaveText(passwordTooShort)
  })

  test('links each message with aria-describedby and aria-invalid', async ({ page }) => {
    await page.goto('/auth?mode=signup')
    await createAccountButton(page).click()

    for (const id of ['email', 'username', 'password']) {
      const field = page.locator(`#${id}`)
      await expect(field).toHaveAttribute('aria-invalid', 'true')
      await expect(field).toHaveAttribute('aria-describedby', `${id}-error`)
      await expect(fieldError(page, id)).not.toHaveText('')
    }

    await emailField(page).fill('user@example.com')
    await expect(page.locator('#email')).not.toHaveAttribute('aria-invalid', 'true')
    await expect(emailField(page)).not.toHaveAttribute('aria-describedby', 'email-error')
  })

  test('updates the message as soon as the language changes', async ({ page }) => {
    await page.goto('/auth')
    const email = emailField(page)
    const error = fieldError(page, 'email')

    await email.focus()
    await email.blur()
    await expect(error).toHaveText('Enter your email.')

    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await expect(error).toHaveText('Introduce tu correo.')

    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await expect(error).toHaveText('Enter your email.')
  })

  test('a single-line error does not move the next field when shown or cleared', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/auth')

    const password = passwordField(page)
    const before = await topOf(password)

    await emailField(page).focus()
    await emailField(page).blur()
    await expect(fieldError(page, 'email')).toHaveText('Enter your email.')
    expect(await topOf(password)).toBe(before)

    await emailField(page).fill('user@example.com')
    await expect(fieldError(page, 'email')).toHaveText('')
    expect(await topOf(password)).toBe(before)
  })

  test('several field errors stay under their inputs without overlapping', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await page.goto('/auth?mode=signup')
    await usernameField(page).fill('a'.repeat(VALIDATION_RULES.USERNAME_MAX_LENGTH + 1))
    await passwordField(page).fill('short')
    await createAccountButton(page).click()
    // The pointer stays on the submit button, and its hover scale changes the box.
    await page.mouse.move(0, 0)

    const fields = [
      { id: 'email', message: 'Enter your email.' },
      { id: 'username', message: usernameTooLong },
      { id: 'password', message: passwordTooShort },
    ]
    for (let index = 0; index < fields.length; index += 1) {
      const field = page.locator(`#${fields[index].id}`)
      const error = fieldError(page, fields[index].id)
      await expect(error).toHaveText(fields[index].message)
      expect(await roundedGap(field, error)).toBe(LABEL_GAP)
      const next = index < fields.length - 1
        ? page.locator(`label[for="${fields[index + 1].id}"]`)
        : createAccountButton(page)
      expect(await roundedGap(error, next)).toBe(FIELD_GAP)
    }
    await expect(page.getByRole('alert')).not.toBeVisible()
  })

  test('rejects a too-short username and does not submit the form', async ({ page }) => {
    let authCalls = 0
    await page.route('**/auth/v1/**', (route) => {
      authCalls += 1
      return route.abort()
    })

    await page.goto('/auth?mode=signup')
    await emailField(page).fill('user@example.com')
    await usernameField(page).fill('a'.repeat(VALIDATION_RULES.USERNAME_MIN_LENGTH - 1))
    await passwordField(page).fill('x'.repeat(VALIDATION_RULES.PASSWORD_MIN_LENGTH))
    await usernameField(page).blur()

    await expect(fieldError(page, 'username')).toHaveText(usernameTooShort)
    await createAccountButton(page).click()
    await expect(usernameField(page)).toBeFocused()
    expect(authCalls).toBe(0)
  })

  test('field error text clears 4.5:1 on the composed card', async ({ page }) => {
    for (const viewport of [
      { width: 320, height: 800 },
      { width: 1280, height: 720 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/auth')
      const email = emailField(page)
      await email.focus()
      await email.blur()
      const error = fieldError(page, 'email')
      await expect(error).toHaveText('Enter your email.')
      if (viewport.width >= 768) {
        await page.locator('video').evaluate((video: HTMLVideoElement) => {
          if (video.readyState >= 2) return
          return new Promise((resolve) => video.addEventListener('loadeddata', () => resolve(undefined), { once: true }))
        })
      }
      const ratio = await fieldErrorContrast(error)
      expect(ratio, `${viewport.width}px ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
    }
  })

  test('a long Spanish message wraps and is not clipped', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await page.goto('/auth?mode=signup')
    await page.getByRole('button', { name: 'ES', exact: true }).click()
    const username = usernameField(page)
    await username.fill('a'.repeat(VALIDATION_RULES.USERNAME_MAX_LENGTH + 1))
    await username.blur()

    const error = fieldError(page, 'username')
    await expect(error).toHaveText('El nombre de usuario debe tener como máximo 50 caracteres.')
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
  })

  test('switching mode clears field errors', async ({ page }) => {
    await page.goto('/auth')
    await emailField(page).focus()
    await emailField(page).blur()
    await expect(fieldError(page, 'email')).toHaveText('Enter your email.')

    await switchToSignUp(page).click()
    await expect(fieldError(page, 'email')).toHaveText('')
  })
})
