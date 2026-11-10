import { test, expect, type Locator, type Page } from './setup'

/**
 * Auth card spacing (#31).
 *
 * The card is 420px wide on a desktop viewport. On a narrow viewport it fills
 * the width inside the outer padding: the auth panel's 16px page padding and
 * the wrapper's 16px (`px-4`). Padding is 32px from the `sm` breakpoint up
 * and 20px below it. Fields are 20px apart, and each label sits 8px above
 * its input. Each field keeps a one-line error slot 8px under the input, so
 * the 20px gap is measured from that slot to the next label. Sign-up's
 * password field keeps that slot, then the requirements list 8px below it.
 * The 20px gap to the button is measured from the list.
 */

const DESKTOP_CARD_WIDTH = 420
const FIELD_GAP = 20
const LABEL_GAP = 8
const DESKTOP_PADDING = 32
const MOBILE_PADDING = 20
/** Page padding (`p-4`) plus the card wrapper's `px-4`. */
const MOBILE_SIDE_INSET = 16 + 16

const emailField = (page: Page) => page.getByLabel(/email|correo/i)
const passwordField = (page: Page) =>
  page.getByRole('textbox', { name: /^(password|contraseña)$/i })
const usernameField = (page: Page) => page.getByLabel(/username|nombre de usuario/i)
const signInButton = (page: Page) => page.getByRole('button', { name: /^sign in$/i })
const createAccountButton = (page: Page) => page.getByRole('button', { name: /^create account$/i })
const switchToSignUp = (page: Page) => page.getByRole('button', { name: /sign up$/i })

function authCard(page: Page): Locator {
  return page.getByRole('heading', { level: 1, name: /quest forge/i }).locator('..').locator('..')
}

async function showMode(page: Page, mode: 'sign-in' | 'sign-up') {
  await page.goto('/auth')
  await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()
  if (mode === 'sign-up') {
    await switchToSignUp(page).click()
    await expect(usernameField(page)).toBeVisible()
    // The click leaves the pointer where the toggle was. Sign-up grows the form
    // and the submit button slides under that pointer, which scales it.
    await page.mouse.move(0, 0)
  }
}

async function expectGap(above: Locator, below: Locator, expected: number) {
  const top = await above.boundingBox()
  const bottom = await below.boundingBox()
  expect(top).not.toBeNull()
  expect(bottom).not.toBeNull()
  // Flex gaps land on a half pixel in Firefox. A one pixel miss is that rounding.
  const gap = bottom!.y - (top!.y + top!.height)
  expect(Math.abs(gap - expected)).toBeLessThanOrEqual(1)
}

async function labelFor(field: Locator): Promise<Locator> {
  const id = await field.getAttribute('id')
  expect(id).toBeTruthy()
  return field.page().locator(`label[for="${id}"]`)
}

function fieldsFor(page: Page, mode: 'sign-in' | 'sign-up'): Locator[] {
  const fields = [emailField(page)]
  if (mode === 'sign-up') fields.push(usernameField(page))
  fields.push(passwordField(page))
  return fields
}

async function errorFor(field: Locator): Promise<Locator> {
  const id = await field.getAttribute('id')
  expect(id).toBeTruthy()
  return field.page().locator(`#${id}-error`)
}

async function expectFieldSpacing(page: Page, mode: 'sign-in' | 'sign-up') {
  const fields = fieldsFor(page, mode)
  for (const field of fields) {
    await expectGap(await labelFor(field), field, LABEL_GAP)
    await expectGap(field, await errorFor(field), LABEL_GAP)
  }
  if (mode === 'sign-up') {
    await expectGap(await errorFor(passwordField(page)), page.locator('#password-requirements'), LABEL_GAP)
  }
  for (let index = 0; index < fields.length - 1; index += 1) {
    const nextLabel = await labelFor(fields[index + 1])
    await expectGap(await errorFor(fields[index]), nextLabel, FIELD_GAP)
  }
  const submit = mode === 'sign-in' ? signInButton(page) : createAccountButton(page)
  const aboveSubmit = mode === 'sign-up'
    ? page.locator('#password-requirements')
    : await errorFor(fields[fields.length - 1])
  await expectGap(aboveSubmit, submit, FIELD_GAP)
}

async function expectPadding(card: Locator, padding: number) {
  const sides = await card.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      top: Number.parseFloat(style.paddingTop),
      right: Number.parseFloat(style.paddingRight),
      bottom: Number.parseFloat(style.paddingBottom),
      left: Number.parseFloat(style.paddingLeft),
    }
  })
  expect(sides).toEqual({ top: padding, right: padding, bottom: padding, left: padding })
}

async function expectCardWidth(page: Page, width: number) {
  const box = await authCard(page).boundingBox()
  expect(box).not.toBeNull()
  expect(Math.round(box!.width)).toBe(width)
}

for (const mode of ['sign-in', 'sign-up'] as const) {
  test.describe(`auth card spacing (${mode})`, () => {
    test('desktop card is 420px wide with 32px padding and token gaps', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await showMode(page, mode)
      await expectCardWidth(page, DESKTOP_CARD_WIDTH)
      await expectPadding(authCard(page), DESKTOP_PADDING)
      await expectFieldSpacing(page, mode)
    })

    test('mobile card fills the width inside the outer padding, with 20px padding', async ({ page }) => {
      await page.setViewportSize({ width: 393, height: 851 })
      await showMode(page, mode)
      const viewport = page.viewportSize()
      expect(viewport).not.toBeNull()
      await expectCardWidth(page, viewport!.width - MOBILE_SIDE_INSET * 2)
      await expectPadding(authCard(page), MOBILE_PADDING)
      await expectFieldSpacing(page, mode)
    })
  })
}
