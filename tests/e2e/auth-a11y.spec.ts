import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from './setup'
import { unexpectedViolations } from './authAxeExclusions'

/**
 * Contrast and ARIA on /auth.
 *
 * `wcag143` is the WCAG AA contrast rule (`color-contrast`, 4.5:1). It does
 * not include `color-contrast-enhanced` (WCAG AAA, 7:1), which axe disables
 * by default and which #30 does not ask for. Labels already clear AA
 * (about 6.71:1 where axe could measure them).
 *
 * Nodes axe cannot measure (video frame, gradient, text-shadow) come back as
 * `incomplete`, not violations. Those stay visible in the test output and are
 * not excluded.
 */
async function expectAuthAccessible(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['cat.aria', 'wcag143']).analyze()
  const incomplete = results.incomplete.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id} ${node.target.join(' ')}`)
  )
  if (incomplete.length > 0) {
    console.log(`axe incomplete on ${label} (not a failure):\n${incomplete.join('\n')}`)
  }

  expect(unexpectedViolations(results.violations)).toEqual([])
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
    await page.getByLabel(/password/i).fill('wrong-password')
    await page.getByRole('button', { name: /^sign in$/i }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expectAuthAccessible(page, 'sign-in error')
  })
})
