import { test, expect, type Page } from './setup'

/**
 * Set a new password from the recovery link (#37).
 *
 * The email from #36 opens /auth?mode=update-password. Supabase is mocked:
 * the harness session stands in for the recovery session, and PUT /auth/v1/user
 * stands in for updateUser({ password }).
 */

const EMAIL = 'hero@example.com'

function passwordField(page: Page) {
  return page.getByLabel(/^(new password|contraseña nueva)$/i)
}

function saveButton(page: Page) {
  return page.getByRole('button', { name: /^(save password|guardar contraseña)$/i })
}

/** The label sits on one line, inside the button, with 12px clear of each edge. */
async function expectCtaFits(button: ReturnType<Page['getByRole']>) {
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

async function installRecoverySession(page: Page, email = EMAIL) {
  await page.addInitScript((address) => {
    const session = {
      user: { id: 'recovery-user', email: address },
      profile: {
        id: 'recovery-user',
        username: 'Hero',
        created_at: '2024-01-01T00:00:00.000Z',
      },
      access_token: 'recovery-access-token',
      refresh_token: 'recovery-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      token_type: 'bearer',
    }
    localStorage.setItem('sb-mock-auth-token', JSON.stringify(session))
    ;(window as Window & { mockPasswordRecovery?: boolean }).mockPasswordRecovery = true
  }, email)
  // A language change stores the preference with updateUser. Answer that
  // metadata write here so it does not depend on the network. Password writes
  // fall through to the route the spec installs.
  await page.route('**/auth/v1/user**', async (route) => {
    const body = route.request().postDataJSON() as { password?: string } | null
    if (body?.password) {
      await route.fallback()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'recovery-user' }),
    })
  })
}

async function routePasswordUpdate(
  page: Page,
  fulfill: (password: string) => { status: number; body: unknown } | 'network',
) {
  await page.route('**/auth/v1/user**', async (route) => {
    const body = route.request().postDataJSON() as { password?: string } | null
    if (!body?.password) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'recovery-user', email: EMAIL }),
      })
      return
    }
    const result = fulfill(body.password)
    if (result === 'network') {
      await route.abort('failed')
      return
    }
    await route.fulfill({
      status: result.status,
      contentType: 'application/json',
      body: JSON.stringify(result.body),
    })
  })
}

test.describe('new password from the recovery link', () => {
  test('a slow session check shows neither the form nor an error, then the checking line', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as Window & { mockInitialLoading?: boolean }).mockInitialLoading = true
    })
    await page.goto('/auth?mode=update-password')

    await expect(passwordField(page)).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /isn't valid|no es válido/i })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 2, name: 'Checking your link…' })).toBeVisible()
    await expect(passwordField(page)).toHaveCount(0)
  })

  test('stays on the form instead of entering the game', async ({ page }) => {
    await installRecoverySession(page)
    await page.goto('/auth?mode=update-password')

    await expect(page).toHaveURL(/\/auth\?mode=update-password/)
    const title = page.getByRole('heading', { level: 2, name: 'Set a new password' })
    await expect(title).toBeVisible()
    await expect(title).toBeFocused()
    await expect(title).toHaveAttribute('tabindex', '-1')
    await expect(page.getByText(`Choose a new password for ${EMAIL}.`)).toBeVisible()
    await expect(passwordField(page)).toBeVisible()
    await expect(passwordField(page)).toHaveAttribute('autocomplete', 'new-password')
    const username = page.locator('input[autocomplete="username"]')
    await expect(username).toHaveValue(EMAIL)
    await expect(username).toHaveAttribute('readonly', '')
    await expect(username).toHaveAttribute('tabindex', '-1')
    await expect(username).toHaveAttribute('aria-hidden', 'true')
    await expect(username).not.toHaveAttribute('hidden')
    const visuallyHidden = await username.evaluate((element) => {
      const style = getComputedStyle(element)
      return style.position === 'absolute' && Number.parseFloat(style.width) <= 1
    })
    expect(visuallyHidden).toBe(true)
    await expect(page.locator('#password-requirements')).toBeVisible()
    await expect(saveButton(page)).toBeVisible()
    await expect(page.getByRole('button', { name: /back to sign in/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /sign up/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'EN', exact: true })).toBeVisible()
  })

  test('leaving the card drops the recovery hold so sign-in enters the game', async ({ page }) => {
    await installRecoverySession(page)
    await page.goto('/auth?mode=update-password')
    await expect(passwordField(page)).toBeVisible()

    await page.evaluate(() => {
      window.history.pushState(null, '', '/auth')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    await expect(page).toHaveURL(/\/game$/)
  })

  test('a signed-in visit to the recovery url is not sent to the game before the recovery event', async ({ page }) => {
    await page.addInitScript((address) => {
      localStorage.setItem('sb-mock-auth-token', JSON.stringify({
        user: { id: 'recovery-user', email: address },
        profile: {
          id: 'recovery-user',
          username: 'Hero',
          created_at: '2024-01-01T00:00:00.000Z',
        },
      }))
    }, EMAIL)

    await page.goto('/auth?mode=update-password')

    await expect(page).toHaveURL(/\/auth\?mode=update-password/)
    await expect(page.getByRole('heading', { level: 2, name: 'Set a new password' })).toBeVisible()
  })

  test('shows the Spanish form, including a password with only some rules met', async ({ page }) => {
    await installRecoverySession(page)
    await page.goto('/auth?mode=update-password')
    await page.getByRole('button', { name: 'ES', exact: true }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'Crea una contraseña nueva' })).toBeVisible()
    await expect(page.getByText(`Elige una contraseña nueva para ${EMAIL}.`)).toBeVisible()
    await passwordField(page).fill('abcdefgh')
    const rules = page.locator('#password-requirements li')
    await expect(rules).toHaveCount(3)
    await expect(rules.nth(0).locator('.sr-only')).toHaveText('cumplido')
    await expect(rules.nth(1).locator('.sr-only')).toHaveText('cumplido')
    await expect(rules.nth(2).locator('.sr-only')).toHaveText('no cumplido')
    await expect(page.getByRole('button', { name: /^guardar contraseña$/i })).toBeVisible()
  })

  test('drops the email phrase when the recovery session has no email', async ({ page }) => {
    await installRecoverySession(page, '')
    await page.goto('/auth?mode=update-password')

    await expect(page.getByText('Choose a new password.')).toBeVisible()
    await expect(page.getByText(/for \./)).toHaveCount(0)
  })

  test('saving a valid password confirms it, then enters the game', async ({ page }) => {
    const passwords: string[] = []
    await installRecoverySession(page)
    await routePasswordUpdate(page, (password) => {
      passwords.push(password)
      return { status: 200, body: { id: 'recovery-user', email: EMAIL } }
    })

    await page.goto('/auth?mode=update-password')
    await passwordField(page).fill('abcd1234')
    await saveButton(page).click()

    const title = page.getByRole('heading', { level: 2, name: 'Password updated' })
    await expect(title).toBeVisible()
    await expect(title).toBeFocused()
    await expect(page.getByText('From now on, sign in with your new password.')).toBeVisible()
    await expect(page.locator('[aria-live="polite"], [aria-live="assertive"]')).toHaveCount(0)
    await expect(passwordField(page)).toHaveCount(0)
    expect(passwords).toEqual(['abcd1234'])

    await page.getByRole('button', { name: 'Enter the game' }).click()
    await expect(page).toHaveURL(/\/game/)
  })

  test('the Spanish confirmation uses the same card and then enters the game', async ({ page }) => {
    await installRecoverySession(page)
    await routePasswordUpdate(page, () => ({
      status: 200,
      body: { id: 'recovery-user', email: EMAIL },
    }))

    await page.goto('/auth?mode=update-password')
    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await passwordField(page).fill('abcd1234')
    await page.getByRole('button', { name: /^guardar contraseña$/i }).click()

    const title = page.getByRole('heading', { level: 2, name: 'Contraseña actualizada' })
    await expect(title).toBeFocused()
    await expect(page.getByText('A partir de ahora, entra con tu contraseña nueva.')).toBeVisible()
    await expect(page.getByRole('button', { name: /volver a entrar/i })).toHaveCount(0)

    await page.getByRole('button', { name: 'Entrar al juego' }).click()
    await expect(page).toHaveURL(/\/game/)
  })

  test('an unmet password stays on the field, in English and Spanish', async ({ page }) => {
    await installRecoverySession(page)
    let calls = 0
    await page.route('**/auth/v1/user**', () => {
      calls += 1
    })
    await page.goto('/auth?mode=update-password')

    await saveButton(page).click()
    const error = page.locator('#password-error')
    await expect(passwordField(page)).toBeFocused()
    await expect(error).toHaveText('Enter your password.')
    await expect(passwordField(page)).toHaveAttribute('aria-invalid', 'true')
    await expect(passwordField(page)).toHaveAttribute('aria-describedby', /password-error/)
    await expect(passwordField(page)).toHaveAttribute('aria-describedby', /password-requirements/)
    expect(calls).toBe(0)

    await passwordField(page).fill('abcdefgh')
    await saveButton(page).click()
    await expect(error).toHaveText('Include at least one number.')

    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await expect(error).toHaveText('Incluye al menos un número.')
  })

  test('the same password is rejected under the field, in Spanish and English', async ({ page }) => {
    await installRecoverySession(page)
    await routePasswordUpdate(page, () => ({
      status: 422,
      body: { error_code: 'same_password', msg: 'New password should be different from the old password.' },
    }))

    await page.goto('/auth?mode=update-password')
    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await passwordField(page).fill('abcd1234')
    await page.getByRole('button', { name: /^guardar contraseña$/i }).click()

    const error = page.locator('#password-error')
    await expect(error).toHaveText('La contraseña nueva tiene que ser distinta de la actual.')
    await expect(passwordField(page)).toHaveAttribute('aria-invalid', 'true')
    await expect(passwordField(page)).toBeFocused()
    await expect(page.getByRole('heading', { level: 2, name: 'Contraseña actualizada' })).toHaveCount(0)

    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await expect(error).toHaveText('Your new password must be different from your current one.')
  })

  test('a weak password reuses the requirements message', async ({ page }) => {
    await installRecoverySession(page)
    await routePasswordUpdate(page, () => ({
      status: 422,
      body: { error_code: 'weak_password', msg: 'Password is known to be weak.', weak_password: { reasons: ['characters'] } },
    }))

    await page.goto('/auth?mode=update-password')
    await passwordField(page).fill('abcd1234')
    await saveButton(page).click()

    await expect(page.locator('#password-error')).toHaveText(
      'Password must be at least 8 characters and include at least one letter and one number.',
    )
  })

  test('a network failure and a rate limit reuse the recovery messages', async ({ page }) => {
    await installRecoverySession(page)
    await routePasswordUpdate(page, () => 'network')
    await page.goto('/auth?mode=update-password')
    await passwordField(page).fill('abcd1234')
    await saveButton(page).click()

    const error = page.locator('#password-error')
    await expect(error).toHaveText("We couldn't send the link. Check your connection and try again.")

    await page.unroute('**/auth/v1/user**')
    await routePasswordUpdate(page, () => ({
      status: 429,
      body: { error_code: 'over_request_rate_limit', msg: 'Too many requests' },
    }))
    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await page.getByRole('button', { name: /^guardar contraseña$/i }).click()
    await expect(error).toHaveText('Demasiados intentos. Espera un minuto e inténtalo de nuevo.')
  })

  test('an expired session on save shows the invalid link', async ({ page }) => {
    await installRecoverySession(page)
    await routePasswordUpdate(page, () => ({
      status: 403,
      body: { error_code: 'session_not_found', msg: 'Session from session_id claim in JWT does not exist' },
    }))

    await page.goto('/auth?mode=update-password')
    await passwordField(page).fill('abcd1234')
    await saveButton(page).click()

    const title = page.getByRole('heading', { level: 2, name: "This link isn't valid" })
    await expect(title).toBeVisible()
    await expect(title).toBeFocused()
    await expect(passwordField(page)).toHaveCount(0)
    await expect(page.getByText('Request a new link to reset your password.')).toBeVisible()

    await page.getByRole('button', { name: 'Request a new link' }).click()
    await expect(page).toHaveURL(/mode=reset/)
    await expect(page.getByRole('heading', { level: 2, name: 'Reset your password' })).toBeVisible()
  })

  test('a recovery url with no session offers a new link and a way back to sign in', async ({ page }) => {
    await page.goto('/auth?mode=update-password')

    const title = page.getByRole('heading', { level: 2, name: "This link isn't valid" })
    await expect(title).toBeFocused()
    await expect(passwordField(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /sign up/i })).toHaveCount(0)

    await page.getByRole('button', { name: 'ES', exact: true }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Este enlace no es válido' })).toBeVisible()
    await expect(page.getByText('Pide un enlace nuevo para restablecer tu contraseña.')).toBeVisible()

    await page.getByRole('button', { name: 'Volver a entrar' }).click()
    await expect(page).toHaveURL(/\/auth$/)
    await expect(page.getByRole('button', { name: /^entrar$/i })).toBeVisible()
  })

  test('saving keeps the field, lets the eye work, and sends one request', async ({ page }) => {
    let calls = 0
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    await installRecoverySession(page)
    await page.route('**/auth/v1/user**', async (route) => {
      const body = route.request().postDataJSON() as { password?: string } | null
      if (!body?.password) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'recovery-user', email: EMAIL }),
        })
        return
      }
      calls += 1
      await gate
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'recovery-user', email: EMAIL }),
      })
    })

    await page.goto('/auth?mode=update-password')
    await passwordField(page).fill('abcd1234')
    await saveButton(page).click()

    const saving = page.getByRole('button', { name: /^saving…$/i })
    await expect(saving).toBeVisible()
    await expect(saving).toHaveAttribute('aria-disabled', 'true')
    expect(await saving.evaluate((element) => element.hasAttribute('disabled'))).toBe(false)
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true')
    await expect(passwordField(page)).toHaveAttribute('readonly', '')

    await page.getByRole('button', { name: /^show password$/i }).click()
    await expect(passwordField(page)).toHaveAttribute('type', 'text')
    await saving.click({ force: true })
    expect(calls).toBe(1)

    release()
    await expect(page.getByRole('heading', { level: 2, name: 'Password updated' })).toBeVisible()
  })

  test('short landscape hides the help text and keeps the checklist', async ({ page }) => {
    await installRecoverySession(page)
    await page.setViewportSize({ width: 740, height: 360 })
    await page.goto('/auth?mode=update-password')

    const help = page.getByText(`Choose a new password for ${EMAIL}.`)
    await expect(help).toBeAttached()
    const hidden = await help.evaluate((element) => {
      const style = getComputedStyle(element)
      return style.position === 'absolute' && Number.parseFloat(style.width) <= 1
    })
    expect(hidden).toBe(true)
    await expect(page.locator('#password-requirements')).toBeVisible()
  })

  test('Spanish auth buttons keep 12px of clearance on one line at 320', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('questforge.language', 'es')
    })
    await page.setViewportSize({ width: 320, height: 568 })

    await page.goto('/auth')
    await page.evaluate(() => document.fonts.ready)
    await expectCtaFits(page.getByRole('button', { name: 'Entrar', exact: true }))

    await page.getByRole('button', { name: /regístrate/i }).click()
    await expectCtaFits(page.getByRole('button', { name: 'Crear cuenta' }))

    await page.goto('/auth?mode=reset')
    await expectCtaFits(page.getByRole('button', { name: 'Enviar enlace' }))

    await page.goto('/auth?mode=update-password')
    await expectCtaFits(page.getByRole('button', { name: 'Pedir un enlace nuevo' }))

    await installRecoverySession(page)
    await routePasswordUpdate(page, () => ({
      status: 200,
      body: { id: 'recovery-user', email: EMAIL },
    }))
    await page.goto('/auth?mode=update-password')
    await page.evaluate(() => document.fonts.ready)
    await expectCtaFits(page.getByRole('button', { name: 'Guardar contraseña' }))

    await page.getByLabel('Contraseña nueva').fill('abcd1234')
    await page.getByRole('button', { name: 'Guardar contraseña' }).click()
    await expectCtaFits(page.getByRole('button', { name: 'Entrar al juego' }))
  })

  test('auth button padding stays 24px from 375px up', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/auth')
    const padding = await page.locator('button[type="submit"]').evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        left: style.paddingLeft,
        right: style.paddingRight,
        tracking: style.letterSpacing,
        fontSize: style.fontSize,
      }
    })
    expect(padding.left).toBe('24px')
    expect(padding.right).toBe('24px')
    expect(padding.tracking).toBe('0.4px')
    expect(padding.fontSize).toBe('16px')
  })
})
