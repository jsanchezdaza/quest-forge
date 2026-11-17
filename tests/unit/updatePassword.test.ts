import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AuthApiError, AuthRetryableFetchError, AuthSessionMissingError, AuthWeakPasswordError } from '@supabase/supabase-js'
import { en } from '../../src/i18n/en.ts'
import { es } from '../../src/i18n/es.ts'
import type { TranslationKey } from '../../src/i18n/index.ts'
import {
  UPDATE_PASSWORD_CHECKING_MS,
  beginUpdatePassword,
  createRecoveryHold,
  retainedPassword,
  isUpdatePasswordSearch,
  recoveryHoldAfterAuthEvent,
  shouldRedirectSignedInToGame,
  signOutInBackground,
  showUpdatePasswordChecking,
  updatePasswordHelp,
  updatePasswordReducer,
  type UpdatePasswordState,
} from '../../src/lib/updatePassword.ts'

function form(fieldError: TranslationKey | null = null): UpdatePasswordState {
  return { status: 'form', email: 'hero@example.com', fieldError }
}

const saving: UpdatePasswordState = { status: 'saving', email: 'hero@example.com' }

test('auth stays on the checking state until the recovery session is known', () => {
  assert.deepEqual(beginUpdatePassword({ initializing: true, signedIn: false, email: '' }), {
    status: 'checking',
  })
  assert.deepEqual(beginUpdatePassword({ initializing: true, signedIn: true, email: 'hero@example.com' }), {
    status: 'checking',
  })
  assert.equal(showUpdatePasswordChecking({ status: 'checking' }, UPDATE_PASSWORD_CHECKING_MS - 1), false)
  assert.equal(showUpdatePasswordChecking({ status: 'checking' }, UPDATE_PASSWORD_CHECKING_MS), true)
  assert.equal(UPDATE_PASSWORD_CHECKING_MS, 300)
  assert.equal(showUpdatePasswordChecking(form(), UPDATE_PASSWORD_CHECKING_MS), false)
})

test('a resolved recovery session opens the form and no session is an invalid link', () => {
  const checking: UpdatePasswordState = { status: 'checking' }
  assert.deepEqual(
    updatePasswordReducer(checking, { type: 'resolved', signedIn: true, email: 'hero@example.com' }),
    form(),
  )
  assert.deepEqual(
    updatePasswordReducer(checking, { type: 'resolved', signedIn: false, email: '' }),
    { status: 'invalid' },
  )
  assert.deepEqual(
    beginUpdatePassword({ initializing: false, signedIn: true, email: 'hero@example.com' }),
    form(),
  )
  assert.deepEqual(beginUpdatePassword({ initializing: false, signedIn: false, email: '' }), {
    status: 'invalid',
  })
})

test('a late auth result does not leave the confirmation or the invalid link', () => {
  const done: UpdatePasswordState = { status: 'done' }
  const invalid: UpdatePasswordState = { status: 'invalid' }
  const resolved = { type: 'resolved' as const, signedIn: false, email: '' }
  assert.deepEqual(updatePasswordReducer(done, resolved), done)
  assert.deepEqual(updatePasswordReducer(invalid, { type: 'resolved', signedIn: true, email: 'hero@example.com' }), invalid)
  assert.deepEqual(updatePasswordReducer(saving, resolved), saving)
})

test('submit stays on the form until the new password meets the sign-up rules', () => {
  assert.deepEqual(updatePasswordReducer(form(), { type: 'submit', password: '' }), form('auth.passwordRequired'))
  assert.deepEqual(updatePasswordReducer(form(), { type: 'submit', password: 'abc1234' }), form('auth.passwordTooShort'))
  assert.deepEqual(updatePasswordReducer(form(), { type: 'submit', password: 'abcdefgh' }), form('auth.passwordNeedsNumber'))
  assert.deepEqual(updatePasswordReducer(form(), { type: 'submit', password: '12345678' }), form('auth.passwordNeedsLetter'))
  assert.deepEqual(updatePasswordReducer(form(), { type: 'submit', password: 'abcd1234' }), saving)
  assert.deepEqual(updatePasswordReducer(saving, { type: 'submit', password: 'abcd1234' }), saving)
})

test('the typed password is dropped once the card leaves the form', () => {
  assert.equal(retainedPassword('form', 'abcd1234'), 'abcd1234')
  assert.equal(retainedPassword('saving', 'abcd1234'), 'abcd1234')
  assert.equal(retainedPassword('checking', 'abcd1234'), 'abcd1234')
  assert.equal(retainedPassword('done', 'abcd1234'), '')
  assert.equal(retainedPassword('invalid', 'secret'), '')
})

test('a saved password replaces the form with the confirmation', () => {
  assert.deepEqual(updatePasswordReducer(saving, { type: 'saved' }), { status: 'done' })
  assert.deepEqual(updatePasswordReducer(form(), { type: 'saved' }), form())
})

test('same password, a weak password, a rate limit, and a network failure stay on the form', () => {
  const failed = (error: unknown, fieldError: TranslationKey) => {
    assert.deepEqual(updatePasswordReducer(saving, { type: 'failed', error }), form(fieldError))
  }
  failed(new AuthApiError('same', 422, 'same_password'), 'auth.updatePasswordSame')
  failed(new AuthApiError('weak', 422, 'weak_password'), 'error.weakPassword.message')
  failed(new AuthWeakPasswordError('weak', 422, ['characters']), 'error.weakPassword.message')
  failed(new AuthApiError('rate', 429, 'over_request_rate_limit'), 'auth.resetTooManyAttempts')
  failed(new AuthApiError('rate', 429, 'over_email_send_rate_limit'), 'auth.resetTooManyAttempts')
  failed({ status: 429 }, 'auth.resetTooManyAttempts')
  failed(new AuthRetryableFetchError('Failed to fetch', 0), 'auth.resetSendFailed')
  failed(new AuthApiError('nope', 400, 'unexpected_failure'), 'error.authError.message')
  failed(new AuthRetryableFetchError('Service Unavailable', 503), 'error.authError.message')
})

test('sign-out after an expired recovery link does not block the card', async () => {
  const blocked = new Promise<never>(() => {})
  const result = await Promise.race([
    Promise.resolve(signOutInBackground(() => blocked, () => {})).then(() => 'returned'),
    new Promise((resolve) => setTimeout(() => resolve('blocked'), 50)),
  ])
  assert.equal(result, 'returned')

  let reported = false
  signOutInBackground(
    () => Promise.reject(new Error('offline')),
    () => { reported = true },
  )
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.equal(reported, true)
})

test('a missing or rejected recovery session on save opens the invalid link', () => {
  const expired = (error: unknown) => {
    assert.deepEqual(updatePasswordReducer(saving, { type: 'failed', error }), { status: 'invalid' })
  }
  expired(new AuthApiError('unauthorized', 401, 'bad_jwt'))
  expired(new AuthSessionMissingError())
  expired({ status: 403, code: 'session_not_found' })
  expired(new AuthApiError('reauth', 400, 'reauthentication_needed'))
  expired(new AuthApiError('forbidden', 403, 'forbidden'))
})

test('the help line names the recovery email and drops the phrase when there is none', () => {
  assert.deepEqual(updatePasswordHelp('hero@example.com'), {
    key: 'auth.updatePasswordHelp',
    email: 'hero@example.com',
  })
  assert.deepEqual(updatePasswordHelp('  hero@example.com  '), {
    key: 'auth.updatePasswordHelp',
    email: 'hero@example.com',
  })
  assert.deepEqual(updatePasswordHelp(''), { key: 'auth.updatePasswordHelpNoEmail' })
  assert.deepEqual(updatePasswordHelp('   '), { key: 'auth.updatePasswordHelpNoEmail' })
})

test('the recovery url is the only auth url that skips the signed-in redirect', () => {
  assert.equal(isUpdatePasswordSearch('?mode=update-password'), true)
  assert.equal(isUpdatePasswordSearch('mode=update-password'), true)
  assert.equal(isUpdatePasswordSearch('?mode=update-password&next=1'), true)
  assert.equal(isUpdatePasswordSearch('?mode=reset'), false)
  assert.equal(isUpdatePasswordSearch(''), false)

  assert.equal(shouldRedirectSignedInToGame({ signedIn: false, mode: 'update-password', passwordRecovery: false }), false)
  assert.equal(shouldRedirectSignedInToGame({ signedIn: true, mode: 'update-password', passwordRecovery: false }), false)
  assert.equal(shouldRedirectSignedInToGame({ signedIn: true, mode: 'signin', passwordRecovery: true }), false)
  assert.equal(shouldRedirectSignedInToGame({ signedIn: true, mode: 'signin', passwordRecovery: false }), true)
  assert.equal(shouldRedirectSignedInToGame({ signedIn: true, mode: 'reset', passwordRecovery: false }), true)
  assert.equal(shouldRedirectSignedInToGame({ signedIn: false, mode: 'signin', passwordRecovery: false }), false)
})

test('leaving the recovery card drops the hold, and a later session event stays dropped', () => {
  const hold = createRecoveryHold()
  assert.equal(hold.apply('PASSWORD_RECOVERY', true), true)
  assert.equal(hold.apply('USER_UPDATED', true), true)
  assert.equal(hold.release(), false)
  assert.equal(hold.current(), false)
  assert.equal(hold.apply('TOKEN_REFRESHED', true), false)
  assert.equal(hold.apply('USER_UPDATED', true), false)
})

test('PASSWORD_RECOVERY holds the session and a following sign-in event keeps the hold', () => {
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'INITIAL_SESSION', hasSession: true, held: false }), false)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'PASSWORD_RECOVERY', hasSession: true, held: false }), true)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'INITIAL_SESSION', hasSession: true, held: true }), true)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'SIGNED_IN', hasSession: true, held: true }), true)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'USER_UPDATED', hasSession: true, held: true }), true)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'TOKEN_REFRESHED', hasSession: true, held: true }), true)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'SIGNED_OUT', hasSession: false, held: true }), false)
  assert.equal(recoveryHoldAfterAuthEvent({ event: 'PASSWORD_RECOVERY', hasSession: false, held: true }), false)
})

test('new-password copy matches the recovery screen in English and Spanish', () => {
  assert.equal(en['auth.updatePasswordTitle'], 'Set a new password')
  assert.equal(es['auth.updatePasswordTitle'], 'Crea una contraseña nueva')
  assert.equal(en['auth.updatePasswordHelp'], 'Choose a new password for {email}.')
  assert.equal(es['auth.updatePasswordHelp'], 'Elige una contraseña nueva para {email}.')
  assert.equal(en['auth.updatePasswordHelpNoEmail'], 'Choose a new password.')
  assert.equal(es['auth.updatePasswordHelpNoEmail'], 'Elige una contraseña nueva.')
  assert.equal(en['auth.updatePasswordLabel'], 'New password')
  assert.equal(es['auth.updatePasswordLabel'], 'Contraseña nueva')
  assert.equal(en['auth.updatePasswordSave'], 'Save password')
  assert.equal(es['auth.updatePasswordSave'], 'Guardar contraseña')
  assert.equal(en['auth.updatePasswordSaving'], 'Saving…')
  assert.equal(es['auth.updatePasswordSaving'], 'Guardando…')
  assert.equal(en['auth.updatePasswordSame'], 'Your new password must be different from your current one.')
  assert.equal(es['auth.updatePasswordSame'], 'La contraseña nueva tiene que ser distinta de la actual.')
  assert.equal(en['auth.updatePasswordDoneTitle'], 'Password updated')
  assert.equal(es['auth.updatePasswordDoneTitle'], 'Contraseña actualizada')
  assert.equal(en['auth.updatePasswordDoneBody'], 'From now on, sign in with your new password.')
  assert.equal(es['auth.updatePasswordDoneBody'], 'A partir de ahora, entra con tu contraseña nueva.')
  assert.equal(en['auth.updatePasswordEnter'], 'Enter the game')
  assert.equal(es['auth.updatePasswordEnter'], 'Entrar al juego')
  assert.equal(en['auth.updatePasswordChecking'], 'Checking your link…')
  assert.equal(es['auth.updatePasswordChecking'], 'Comprobando el enlace…')
  assert.equal(en['auth.updatePasswordInvalidTitle'], "This link isn't valid")
  assert.equal(es['auth.updatePasswordInvalidTitle'], 'Este enlace no es válido')
  assert.equal(en['auth.updatePasswordInvalidBody'], 'Request a new link to reset your password.')
  assert.equal(es['auth.updatePasswordInvalidBody'], 'Pide un enlace nuevo para restablecer tu contraseña.')
  assert.equal(en['auth.updatePasswordRequest'], 'Request a new link')
  assert.equal(es['auth.updatePasswordRequest'], 'Pedir un enlace nuevo')
  assert.equal(en['error.weakPassword.message'], 'Password must be at least 8 characters and include at least one letter and one number.')
  assert.equal(en['auth.resetSendFailed'], "We couldn't send the link. Check your connection and try again.")
  assert.equal(en['auth.resetTooManyAttempts'], 'Too many attempts. Wait a minute and try again.')
  assert.equal(en['auth.resetBack'], 'Back to sign in')
  assert.equal(es['auth.resetBack'], 'Volver a entrar')
})
