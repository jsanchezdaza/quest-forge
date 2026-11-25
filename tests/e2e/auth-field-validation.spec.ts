import { test, expect, type Locator, type Page } from './setup'
import { VALIDATION_RULES } from '../../src/constants/validation'
import { minimumContrast } from './pixelContrast'

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

async function expectGap(above: Locator, below: Locator, expected: number) {
  const top = await above.boundingBox()
  const bottom = await below.boundingBox()
  expect(top).not.toBeNull()
  expect(bottom).not.toBeNull()
  const gap = bottom!.y - (top!.y + top!.height)
  expect(Math.abs(gap - expected)).toBeLessThanOrEqual(0.5)
}

async function topOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return box!.y
}

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
  return minimumContrast(png, box!.width, box!.height, textRects, foreground)
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
    await expectGap(emailField(page), error, LABEL_GAP)

    const style = await error.evaluate((element) => {
      const computed = getComputedStyle(element)
      return {
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
        textAlign: computed.textAlign,
        textTransform: computed.textTransform,
        usesErrorColor: element.classList.contains('text-red-200'),
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
    await passwordField(page).fill('')
    await signInButton(page).click()

    await expect(error).toHaveText('Enter your email.')
    await expect(fieldError(page, 'password')).toHaveText('Enter your password.')
  })

  test('sign-in still submits an existing short or digit-free password', async ({ page }) => {
    const submitted: string[] = []
    await page.route('**/auth/v1/token**', async (route) => {
      const body = route.request().postDataJSON() as { password?: string }
      submitted.push(body.password ?? '')
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }),
      })
    })

    await page.goto('/auth')
    await emailField(page).fill('user@example.com')

    for (const password of ['short', 'abcdef', '1234567']) {
      await passwordField(page).fill(password)
      await signInButton(page).click()
      await expect(fieldError(page, 'password')).toHaveText('')
      await expect(page.getByRole('alert')).toBeVisible()
    }

    expect(submitted).toEqual(['short', 'abcdef', '1234567'])
  })

  test('sign-up rejects a new password that misses length, a letter, or a number', async ({ page }) => {
    let authCalls = 0
    await page.route('**/auth/v1/**', (route) => {
      authCalls += 1
      return route.abort()
    })

    await page.goto('/auth?mode=signup')
    await emailField(page).fill('user@example.com')
    await usernameField(page).fill('hero')

    await passwordField(page).fill('abc1234')
    await createAccountButton(page).click()
    await expect(passwordField(page)).toBeFocused()
    await expect(fieldError(page, 'password')).toHaveText(passwordTooShort)

    await passwordField(page).fill('abcdefgh')
    await createAccountButton(page).click()
    await expect(fieldError(page, 'password')).toHaveText('Include at least one number.')

    await passwordField(page).fill('12345678')
    await createAccountButton(page).click()
    await expect(fieldError(page, 'password')).toHaveText('Include at least one letter.')
    expect(authCalls).toBe(0)

    const signup = page.waitForRequest('**/auth/v1/signup**')
    await passwordField(page).fill('abcd1234')
    await createAccountButton(page).click()
    expect((await signup).postDataJSON().password).toBe('abcd1234')
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
      const describedBy = id === 'password'
        ? 'password-error password-requirements'
        : `${id}-error`
      await expect(field).toHaveAttribute('aria-describedby', describedBy)
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
    expect(Math.abs((await topOf(password)) - before)).toBeLessThanOrEqual(1)

    await emailField(page).fill('user@example.com')
    await expect(fieldError(page, 'email')).toHaveText('')
    expect(Math.abs((await topOf(password)) - before)).toBeLessThanOrEqual(1)
  })

  test('several field errors stay under their inputs without overlapping', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await page.goto('/auth?mode=signup')
    await usernameField(page).fill('a'.repeat(VALIDATION_RULES.USERNAME_MAX_LENGTH + 1))
    await passwordField(page).fill('short')
    await createAccountButton(page).click()
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
      await expectGap(field, error, LABEL_GAP)
      if (fields[index].id === 'password') {
        const list = page.locator('#password-requirements')
        await expectGap(error, list, LABEL_GAP)
        await expectGap(list, createAccountButton(page), FIELD_GAP)
      } else {
        const next = page.locator(`label[for="${fields[index + 1].id}"]`)
        await expectGap(error, next, FIELD_GAP)
      }
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
    await passwordField(page).fill(`a${'1'.repeat(VALIDATION_RULES.PASSWORD_MIN_LENGTH - 1)}`)
    await usernameField(page).blur()

    await expect(fieldError(page, 'username')).toHaveText(usernameTooShort)
    await createAccountButton(page).click()
    await expect(usernameField(page)).toBeFocused()
    expect(authCalls).toBe(0)
  })

  test('field error text clears 4.5:1 on the composed card', async ({ page }) => {
    const expectContrasts = async (label: string, ids: string[]) => {
      for (const id of ids) {
        const ratio = await fieldErrorContrast(fieldError(page, id))
        expect(ratio, `${label} ${id} ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
      }
    }

    await page.setViewportSize({ width: 320, height: 900 })
    await page.goto('/auth?mode=signup')
    await expect(usernameField(page)).toBeVisible()
    await createAccountButton(page).click()
    await page.mouse.move(0, 0)
    await expectContrasts('320px', ['email', 'username', 'password'])

    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/auth?mode=signup')
    await expect(usernameField(page)).toBeVisible()
    await page.locator('video').evaluate((video: HTMLVideoElement) => {
      if (video.readyState >= 2) return
      return new Promise((resolve) => video.addEventListener('loadeddata', () => resolve(undefined), { once: true }))
    })
    await createAccountButton(page).click()
    await page.mouse.move(0, 0)
    await expectContrasts('1280px', ['email', 'username', 'password'])
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

  test('login field errors stay inside the field and the card and clear 4.5:1', async ({ page }) => {
    const card = page.getByTestId('auth-card')
    const forgot = page.getByRole('button', { name: /forgot your password|olvidaste tu contraseña/i })

    for (const viewport of [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 390, height: 844 },
    ]) {
      for (const locale of [
        { button: 'EN', email: 'Enter your email.', password: 'Enter your password.' },
        { button: 'ES', email: 'Introduce tu correo.', password: 'Introduce tu contraseña.' },
      ] as const) {
        await page.setViewportSize(viewport)
        await page.goto('/auth')
        await page.getByRole('button', { name: locale.button, exact: true }).click()
        await page.evaluate(() => document.fonts.ready)
        await emailField(page).focus()
        await emailField(page).blur()
        await passwordField(page).focus()
        await passwordField(page).blur()
        await page.mouse.move(0, 0)

        const label = `${viewport.width} ${locale.button}`
        const cardBox = await card.boundingBox()
        const linkBox = await forgot.boundingBox()
        expect(cardBox, label).not.toBeNull()
        expect(linkBox, label).not.toBeNull()

        for (const field of [
          { id: 'email', message: locale.email },
          { id: 'password', message: locale.password },
        ]) {
          const input = page.locator(`#${field.id}`)
          const error = fieldError(page, field.id)
          await expect(error).toHaveText(field.message)
          await expect(input).toHaveAttribute('aria-invalid', 'true')
          await expect(input).toHaveAttribute('aria-describedby', `${field.id}-error`)
          await expectGap(input, error, LABEL_GAP)

          const type = await error.evaluate((element) => {
            const style = getComputedStyle(element)
            return {
              fontSize: style.fontSize,
              lineHeight: style.lineHeight,
              colorClass: element.classList.contains('text-red-200'),
            }
          })
          expect(type).toEqual({ fontSize: '14px', lineHeight: '20px', colorClass: true })

          const inputBox = await input.boundingBox()
          const errorBox = await error.boundingBox()
          expect(inputBox, label).not.toBeNull()
          expect(errorBox, label).not.toBeNull()
          const place = `${label} ${field.id} error ${errorBox!.x.toFixed(1)}..${(errorBox!.x + errorBox!.width).toFixed(1)} input ${inputBox!.x.toFixed(1)}..${(inputBox!.x + inputBox!.width).toFixed(1)} card ${cardBox!.x.toFixed(1)}..${(cardBox!.x + cardBox!.width).toFixed(1)}`
          expect(errorBox!.x, place).toBeGreaterThanOrEqual(inputBox!.x - 1)
          expect(errorBox!.x + errorBox!.width, place).toBeLessThanOrEqual(inputBox!.x + inputBox!.width + 1)
          expect(errorBox!.x, place).toBeGreaterThanOrEqual(cardBox!.x)
          expect(errorBox!.x + errorBox!.width, place).toBeLessThanOrEqual(cardBox!.x + cardBox!.width)
          if (field.id === 'password') {
            const overlapsLink = errorBox!.y < linkBox!.y + linkBox!.height
              && errorBox!.y + errorBox!.height > linkBox!.y
              && errorBox!.x < linkBox!.x + linkBox!.width
              && errorBox!.x + errorBox!.width > linkBox!.x
            expect(overlapsLink, `${place} link ${linkBox!.x.toFixed(1)},${linkBox!.y.toFixed(1)} ${linkBox!.width.toFixed(1)}x${linkBox!.height.toFixed(1)}`).toBe(false)
          }

          const ratio = await fieldErrorContrast(error)
          expect(ratio, `${place} ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
        }
      }
    }
  })
})
