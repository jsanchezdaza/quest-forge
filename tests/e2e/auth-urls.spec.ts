import { test, expect, type Page } from './setup'

const emailField = (page: Page) => page.getByLabel(/email|correo/i)
const usernameField = (page: Page) => page.getByLabel(/username|nombre de usuario/i)
const signInButton = (page: Page) => page.getByRole('button', { name: /^sign in$/i })
const createAccountButton = (page: Page) => page.getByRole('button', { name: /^create account$/i })
const switchToSignUp = (page: Page) => page.getByRole('button', { name: /sign up$/i })
const switchToSignIn = (page: Page) => page.getByRole('button', { name: /already have an account/i })
const spanishButton = (page: Page) => page.getByRole('button', { name: 'ES', exact: true })

async function markDocument(page: Page) {
  await page.evaluate(() => {
    document.documentElement.dataset.nav = 'spa'
  })
}

function documentStillMarked(page: Page) {
  return expect(page.locator('html')).toHaveAttribute('data-nav', 'spa')
}

test.describe('linkable auth urls', () => {
  test('/auth opens sign-in', async ({ page }) => {
    await page.goto('/auth')

    await expect(page).toHaveURL('/auth')
    await expect(signInButton(page)).toBeVisible()
    await expect(emailField(page)).toBeVisible()
    await expect(usernameField(page)).not.toBeVisible()
  })

  test('/auth?mode=signup opens sign-up', async ({ page }) => {
    await page.goto('/auth?mode=signup')

    await expect(page).toHaveURL('/auth?mode=signup')
    await expect(createAccountButton(page)).toBeVisible()
    await expect(usernameField(page)).toBeVisible()
  })

  test('/auth?mode=bogus opens sign-in', async ({ page }) => {
    await page.goto('/auth?mode=bogus')

    await expect(page).toHaveURL('/auth?mode=bogus')
    await expect(signInButton(page)).toBeVisible()
    await expect(usernameField(page)).not.toBeVisible()
  })

  test('/auth?mode=reset opens sign-in until password recovery exists', async ({ page }) => {
    await page.goto('/auth?mode=reset')

    await expect(page).toHaveURL('/auth?mode=reset')
    await expect(signInButton(page)).toBeVisible()
    await expect(usernameField(page)).not.toBeVisible()
  })

  test('the toggle updates the url without reloading', async ({ page }) => {
    await page.goto('/auth')
    await markDocument(page)

    await switchToSignUp(page).click()

    await expect(page).toHaveURL('/auth?mode=signup')
    await expect(createAccountButton(page)).toBeVisible()
    await documentStillMarked(page)

    await switchToSignIn(page).click()

    await expect(page).toHaveURL('/auth')
    await expect(signInButton(page)).toBeVisible()
    await expect(usernameField(page)).not.toBeVisible()
    await documentStillMarked(page)
  })

  test('back and forward restore the previous view', async ({ page }) => {
    await page.goto('/auth')
    await switchToSignUp(page).click()
    await expect(page).toHaveURL('/auth?mode=signup')
    await expect(usernameField(page)).toBeVisible()

    await page.goBack()

    await expect(page).toHaveURL('/auth')
    await expect(signInButton(page)).toBeVisible()
    await expect(usernameField(page)).not.toBeVisible()

    await page.goForward()

    await expect(page).toHaveURL('/auth?mode=signup')
    await expect(createAccountButton(page)).toBeVisible()
    await expect(usernameField(page)).toBeVisible()
  })

  test('the selected language stays across a view switch and history', async ({ page }) => {
    await page.goto('/auth')
    await spanishButton(page).click()
    await expect(page.getByRole('button', { name: /^entrar$/i })).toBeVisible()

    await page.getByRole('button', { name: /regístrate$/i }).click()

    await expect(page).toHaveURL('/auth?mode=signup')
    await expect(page.getByRole('button', { name: /^crear cuenta$/i })).toBeVisible()
    await expect(page.getByLabel(/nombre de usuario/i)).toBeVisible()
    await expect(spanishButton(page)).toHaveAttribute('aria-pressed', 'true')

    await page.goBack()

    await expect(page).toHaveURL('/auth')
    await expect(page.getByRole('button', { name: /^entrar$/i })).toBeVisible()
    await expect(page.getByLabel(/nombre de usuario/i)).not.toBeVisible()
    await expect(spanishButton(page)).toHaveAttribute('aria-pressed', 'true')

    await page.goForward()

    await expect(page).toHaveURL('/auth?mode=signup')
    await expect(page.getByRole('button', { name: /^crear cuenta$/i })).toBeVisible()
    await expect(spanishButton(page)).toHaveAttribute('aria-pressed', 'true')
  })
})
