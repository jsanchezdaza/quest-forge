import { test, expect, type Page } from './setup'

/**
 * Login usable on a phone (#35).
 *
 * Between 320 and 480px the card fills the width inside the page margins
 * and nothing scrolls sideways, including while the embers move.
 */

/** Page padding (`p-4`) plus the card wrapper's `px-4`, on each side. */
const MOBILE_SIDE_INSET = 16 + 16

const emailField = (page: Page) => page.getByLabel(/email|correo/i)
const switchToSignUp = (page: Page) => page.getByRole('button', { name: /sign up$/i })

function authCard(page: Page) {
  return page.getByRole('heading', { level: 1, name: /quest forge/i }).locator('..').locator('..')
}

async function showSignIn(page: Page) {
  await page.goto('/auth')
  await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()
  await expect(emailField(page)).toBeVisible()
}

test.describe('mobile auth layout', () => {
  for (const width of [320, 375, 480]) {
    test(`the card fills a ${width}px screen inside the margins without horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 })
      await showSignIn(page)

      const box = await authCard(page).boundingBox()
      expect(box).not.toBeNull()
      expect(Math.round(box!.width)).toBe(width - MOBILE_SIDE_INSET * 2)

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBe(0)
    })
  }

  for (const width of [320, 375]) {
    test(`embers never widen a ${width}px page`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 })
      await showSignIn(page)

      // The rise loop is 9–16s. Twenty samples across two seconds catch an
      // ember that drifts past the right edge.
      const overflows = await page.evaluate(async () => {
        const samples: number[] = []
        for (let sample = 0; sample < 20; sample += 1) {
          samples.push(document.documentElement.scrollWidth - document.documentElement.clientWidth)
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
        return samples
      })

      expect(overflows).toEqual(Array(20).fill(0))
    })
  }

  test('sign-up at 320px stays inside the viewport too', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await showSignIn(page)
    await switchToSignUp(page).click()
    await expect(page.getByLabel(/username|nombre de usuario/i)).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBe(0)
  })
})
