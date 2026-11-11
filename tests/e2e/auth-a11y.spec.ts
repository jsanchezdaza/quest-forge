import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from './setup'

/**
 * Contrast and ARIA on /auth.
 *
 * `wcag143` is the WCAG AA contrast rule (`color-contrast`, 4.5:1). It does
 * not include `color-contrast-enhanced` (WCAG AAA, 7:1), which axe disables
 * by default. Nothing is excluded: the welcome line and the footer author
 * line have to clear 4.5:1 on mobile, where the static background can be
 * measured.
 *
 * Nodes axe cannot measure (the desktop video, a gradient, text-shadow) come
 * back as `incomplete`, not violations. Those stay visible in the test output.
 */
async function expectAuthAccessible(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['cat.aria', 'wcag143']).analyze()
  const incomplete = results.incomplete.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id} ${node.target.join(' ')}`)
  )
  if (incomplete.length > 0) {
    console.log(`axe incomplete on ${label} (not a failure):\n${incomplete.join('\n')}`)
  }

  const failures = results.violations.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id}: ${node.html}`)
  )
  expect(failures).toEqual([])
}

test.describe('auth accessibility', () => {
  test('sign in has no unexpected contrast or ARIA violations', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()
    await expectAuthAccessible(page, 'sign in')
  })

  test('sign up has no unexpected contrast or ARIA violations', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: /sign up$/i }).click()
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expectAuthAccessible(page, 'sign up')
  })

  test('a sign-in error has no unexpected contrast or ARIA violations', async ({ page }) => {
    await page.route('**/auth/v1/token**', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }),
      })
    )

    await page.goto('/auth')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByRole('textbox', { name: /^password$/i }).fill('wrong-password')
    await page.getByRole('button', { name: /^sign in$/i }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expectAuthAccessible(page, 'sign-in error')
  })

  test('password recovery has no unexpected contrast or ARIA violations', async ({ page }) => {
    await page.goto('/auth?mode=reset')
    await expect(page.getByRole('heading', { level: 2, name: /reset your password/i })).toBeVisible()
    await expectAuthAccessible(page, 'password recovery')
  })

  test('a recovery confirmation has no unexpected contrast or ARIA violations', async ({ page }) => {
    await page.route('**/auth/v1/recover**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      }),
    )

    await page.goto('/auth?mode=reset')
    await page.getByLabel(/email/i).fill('user@example.com')
    await page.getByRole('button', { name: /send reset link/i }).click()
    await expect(page.getByRole('heading', { level: 2, name: /check your email/i })).toBeVisible()
    await expectAuthAccessible(page, 'recovery confirmation')
  })

  test('a field format error has no unexpected contrast or ARIA violations', async ({ page }) => {
    await page.goto('/auth')
    const email = page.getByLabel(/email/i)
    await email.focus()
    await email.blur()
    await expect(page.locator('#email-error')).toHaveText('Enter your email.')
    await expectAuthAccessible(page, 'field format error')
  })
})
