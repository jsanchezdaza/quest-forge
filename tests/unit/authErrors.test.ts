import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'
import { authErrorMessageKey } from '../../src/lib/authErrors.ts'

// Real supabase-js errors: every AuthError carries a `code` property, set to
// undefined when the failure happened before a response, so the shape matters.
const authError = (code: string) => new AuthApiError('upstream copy, not shown', 400, code)

test('names the wrong email or password when credentials are rejected', () => {
  assert.equal(authErrorMessageKey(authError('invalid_credentials')), 'error.loginFailed.message')
})

test('asks the user to confirm their email when the account is unconfirmed', () => {
  assert.equal(authErrorMessageKey(authError('email_not_confirmed')), 'error.emailNotConfirmed.message')
})

test('tells a returning email that the account already exists', () => {
  assert.equal(authErrorMessageKey(authError('user_already_exists')), 'error.userAlreadyExists.message')
})

test('states the password requirements when the password is too weak', () => {
  assert.equal(authErrorMessageKey(authError('weak_password')), 'error.weakPassword.message')
})

test('asks for a valid address when the email is malformed', () => {
  assert.equal(authErrorMessageKey(authError('email_address_invalid')), 'error.invalidEmail.message')
})

test('explains that signups are turned off when registration is disabled', () => {
  assert.equal(authErrorMessageKey(authError('signup_disabled')), 'error.signupDisabled.message')
})

test('explains that the address is not allowed when it is not authorized', () => {
  assert.equal(authErrorMessageKey(authError('email_address_not_authorized')), 'error.emailNotAuthorized.message')
})

test('asks the user to wait when either rate limit is hit', () => {
  assert.equal(authErrorMessageKey(authError('over_request_rate_limit')), 'error.tooManyRequests.message')
  assert.equal(authErrorMessageKey(authError('over_email_send_rate_limit')), 'error.tooManyRequests.message')
})

test('blames the connection when the request never reached the server', () => {
  const transportFailure = new AuthRetryableFetchError('Failed to fetch', 0)
  assert.equal(authErrorMessageKey(transportFailure), 'error.connectionIssue.message')
})

test('does not blame the connection when the server answered and failed', () => {
  const serverUnavailable = new AuthRetryableFetchError('Service Unavailable', 503)
  assert.equal(authErrorMessageKey(serverUnavailable), 'error.authError.message')
})

test('falls back to the generic message for a code it does not know', () => {
  assert.equal(authErrorMessageKey(authError('mfa_challenge_expired')), 'error.authError.message')
})

test('falls back to the generic message when the code is not a string', () => {
  assert.equal(authErrorMessageKey(Object.assign(new Error('odd'), { code: 500 })), 'error.authError.message')
})

test('survives being handed something that is not an error at all', () => {
  assert.equal(authErrorMessageKey(null), 'error.authError.message')
  assert.equal(authErrorMessageKey(undefined), 'error.authError.message')
  assert.equal(authErrorMessageKey('a string'), 'error.authError.message')
})
