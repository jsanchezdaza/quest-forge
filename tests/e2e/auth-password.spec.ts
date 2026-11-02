import { test, expect, type Page } from './setup'

// Exact name so the show/hide button, whose label also contains "password",
// is not treated as the field.
const passwordField = (page: Page) =>
  page.getByRole('textbox', { name: /^(password|contraseña)$/i })
const showPassword = (page: Page) =>
  page.getByRole('button', { name: /^(show password|mostrar contraseña)$/i })
const hidePassword = (page: Page) =>
  page.getByRole('button', { name: /^(hide password|ocultar contraseña)$/i })

function selection(page: Page): Promise<[number, number]> {
  return passwordField(page).evaluate((el: HTMLInputElement) => [
    el.selectionStart ?? -1,
    el.selectionEnd ?? -1,
  ])
}

test.describe('show or hide the password', () => {
  test('the password stays hidden until the button reveals it, and the value and caret stay put', async ({ page }) => {
    await page.goto('/auth')
    const field = passwordField(page)
    await expect(field).toHaveAttribute('type', 'password')

    const show = showPassword(page)
    await expect(show).toHaveAttribute('type', 'button')
    await expect(show).toHaveAttribute('aria-pressed', 'false')
    await expect(show.locator('svg')).toHaveAttribute('aria-hidden', 'true')

    await field.fill('secret-pass')
    await field.evaluate((el: HTMLInputElement) => el.setSelectionRange(3, 7))
    await show.click()

    await expect(field).toHaveAttribute('type', 'text')
    await expect(field).toHaveValue('secret-pass')
    await expect.poll(() => selection(page)).toEqual([3, 7])

    const hide = hidePassword(page)
    await expect(hide).toHaveAttribute('type', 'button')
    await expect(hide).toHaveAttribute('aria-pressed', 'true')
    await expect(hide.locator('svg')).toHaveAttribute('aria-hidden', 'true')

    await field.evaluate((el: HTMLInputElement) => el.setSelectionRange(1, 4))
    await hide.click()

    await expect(field).toHaveAttribute('type', 'password')
    await expect(field).toHaveValue('secret-pass')
    await expect.poll(() => selection(page)).toEqual([1, 4])
  })

  test('the keyboard toggles visibility without submitting, and Enter in a field still submits', async ({ page }) => {
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
    const email = page.getByRole('textbox', { name: /^email$/i })
    const field = passwordField(page)
    await email.fill('test@example.com')
    await field.fill('secret-pass')
    await field.evaluate((el: HTMLInputElement) => el.setSelectionRange(2, 6))

    await showPassword(page).focus()
    await page.keyboard.press('Enter')

    expect(submissions).toBe(0)
    await expect(field).toHaveAttribute('type', 'text')
    await expect(field).toHaveValue('secret-pass')
    await expect.poll(() => selection(page)).toEqual([2, 6])
    await expect(hidePassword(page)).toBeFocused()

    await page.keyboard.press('Space')

    expect(submissions).toBe(0)
    await expect(field).toHaveAttribute('type', 'password')
    await expect(field).toHaveValue('secret-pass')
    await expect.poll(() => selection(page)).toEqual([2, 6])
    await expect(showPassword(page)).toBeFocused()

    await field.focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => submissions).toBe(1)
    await expect(field).toHaveAttribute('type', 'password')
    await expect(page.getByRole('alert')).toContainText('Invalid email or password')

    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeEnabled()
    await email.focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => submissions).toBe(2)
    await expect(field).toHaveAttribute('type', 'password')
  })

  test('the button label follows the language on sign-in and sign-up', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('button', { name: 'Show password', exact: true })).toBeVisible()
    await expect(passwordField(page)).toHaveAttribute('type', 'password')

    await page.getByRole('button', { name: 'ES', exact: true }).click()
    const showEs = page.getByRole('button', { name: 'Mostrar contraseña', exact: true })
    await expect(showEs).toBeVisible()
    await expect(showEs).toHaveAttribute('aria-pressed', 'false')

    await page.getByRole('button', { name: /regístrate/i }).click()
    await expect(passwordField(page)).toHaveAttribute('type', 'password')
    await showEs.click()

    const hideEs = page.getByRole('button', { name: 'Ocultar contraseña', exact: true })
    await expect(hideEs).toBeVisible()
    await expect(hideEs).toHaveAttribute('aria-pressed', 'true')
    await expect(passwordField(page)).toHaveAttribute('type', 'text')

    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Hide password', exact: true })).toBeVisible()
    await expect(passwordField(page)).toHaveAttribute('type', 'text')
  })
})
