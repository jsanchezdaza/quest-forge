import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'
import { en } from '../../src/i18n/en.ts'
import { es } from '../../src/i18n/es.ts'
import {
  passwordRecoveryRedirectTo,
  recoveryConcealsAccount,
  recoveryErrorMessageKey,
} from '../../src/lib/passwordRecovery.ts'

test('the recovery link returns to the update-password view on this origin', () => {
  assert.equal(
    passwordRecoveryRedirectTo('https://quest-forge-omega.vercel.app'),
    'https://quest-forge-omega.vercel.app/auth?mode=update-password',
  )
  assert.equal(
    passwordRecoveryRedirectTo('http://localhost:5173'),
    'http://localhost:5173/auth?mode=update-password',
  )
})

test('a rate limit is the only recovery failure with its own message', () => {
  assert.equal(
    recoveryErrorMessageKey(new AuthApiError('too many', 429, 'over_email_send_rate_limit')),
    'auth.resetTooManyAttempts',
  )
  assert.equal(
    recoveryErrorMessageKey(new AuthApiError('too many', 429, 'over_request_rate_limit')),
    'auth.resetTooManyAttempts',
  )
  assert.equal(recoveryErrorMessageKey({ status: 429 }), 'auth.resetTooManyAttempts')
})

test('any other recovery failure uses the same connection message', () => {
  assert.equal(
    recoveryErrorMessageKey(new AuthRetryableFetchError('Failed to fetch', 0)),
    'auth.resetSendFailed',
  )
  assert.equal(
    recoveryErrorMessageKey(new AuthApiError('nope', 500, 'unexpected_failure')),
    'auth.resetSendFailed',
  )
  assert.equal(recoveryErrorMessageKey(null), 'auth.resetSendFailed')
})

test('a missing account is the same confirmation, not a failure', () => {
  const missing = new AuthApiError('missing', 400, 'user_not_found')
  assert.equal(recoveryConcealsAccount(missing), true)
  assert.equal(recoveryConcealsAccount(new AuthApiError('nope', 500, 'unexpected_failure')), false)
  assert.equal(recoveryConcealsAccount(new AuthRetryableFetchError('Failed to fetch', 0)), false)
  assert.equal(recoveryConcealsAccount(null), false)
})

test('recovery copy does not say whether an account exists', () => {
  for (const dictionary of [en, es]) {
    assert.match(dictionary['auth.resetConfirmedBody'], /if an account exists|si existe una cuenta/i)
    assert.doesNotMatch(dictionary['auth.resetConfirmedBody'], /@/)
  }
  assert.equal(
    en['auth.resetConfirmedBody'],
    "If an account exists for that email, we've sent a link to reset your password. Check your inbox and your spam folder.",
  )
  assert.equal(
    es['auth.resetConfirmedBody'],
    'Si existe una cuenta con ese correo, te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam.',
  )
  assert.equal(en['auth.forgotPassword'], 'Forgot your password?')
  assert.equal(es['auth.forgotPassword'], '¿Olvidaste tu contraseña?')
  assert.equal(en['auth.resetTitle'], 'Reset your password')
  assert.equal(es['auth.resetTitle'], 'Recupera tu contraseña')
  assert.equal(
    en['auth.resetHelp'],
    "Enter your email and we'll send you a link to choose a new password.",
  )
  assert.equal(
    es['auth.resetHelp'],
    'Escribe tu correo y te enviaremos un enlace para elegir una nueva contraseña.',
  )
  assert.equal(en['auth.resetConfirmedTitle'], 'Check your email')
  assert.equal(es['auth.resetConfirmedTitle'], 'Revisa tu correo')
  assert.equal(en['auth.resetDifferentEmail'], 'Use a different email')
  assert.equal(es['auth.resetDifferentEmail'], 'Usar otro correo')
  assert.equal(en['auth.resetSend'], 'Send reset link')
  assert.equal(es['auth.resetSend'], 'Enviar enlace')
  assert.equal(en['auth.resetSending'], 'Sending…')
  assert.equal(es['auth.resetSending'], 'Enviando…')
  assert.equal(en['auth.resetBack'], 'Back to sign in')
  assert.equal(es['auth.resetBack'], 'Volver a entrar')
  assert.equal(en['auth.resetSendFailed'], "We couldn't send the link. Check your connection and try again.")
  assert.equal(es['auth.resetSendFailed'], 'No hemos podido enviar el enlace. Revisa tu conexión e inténtalo de nuevo.')
  assert.equal(en['auth.resetTooManyAttempts'], 'Too many attempts. Wait a minute and try again.')
  assert.equal(es['auth.resetTooManyAttempts'], 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.')
})
