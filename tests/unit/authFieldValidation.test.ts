import assert from 'node:assert/strict'
import { test } from 'node:test'
import { VALIDATION_RULES } from '../../src/constants/validation.ts'
import {
  authFieldError,
  firstInvalidAuthField,
} from '../../src/lib/authFieldValidation.ts'

const { PASSWORD_MIN_LENGTH, USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH } = VALIDATION_RULES

test('email is required, including whitespace, and otherwise follows the HTML email format', () => {
  assert.equal(authFieldError('email', '', 'signin'), 'auth.emailRequired')
  assert.equal(authFieldError('email', '   ', 'signup'), 'auth.emailRequired')
  assert.equal(authFieldError('email', 'not-an-email', 'signin'), 'auth.emailInvalid')
  assert.equal(authFieldError('email', 'a@', 'signin'), 'auth.emailInvalid')
  assert.equal(authFieldError('email', '@example.com', 'signin'), 'auth.emailInvalid')
  assert.equal(authFieldError('email', 'a@b.', 'signin'), 'auth.emailInvalid')
  // Same grammar as input type="email": a dot in the domain is not required.
  assert.equal(authFieldError('email', 'a@b', 'signin'), null)
  assert.equal(authFieldError('email', '  user+tag@example.co.uk  ', 'signup'), null)
})

test('username is required, and too short or too long, after trimming', () => {
  assert.equal(authFieldError('username', '', 'signup'), 'auth.usernameRequired')
  assert.equal(authFieldError('username', '   ', 'signup'), 'auth.usernameRequired')
  assert.equal(authFieldError('username', 'a'.repeat(USERNAME_MIN_LENGTH - 1), 'signup'), 'auth.usernameTooShort')
  assert.equal(authFieldError('username', 'a'.repeat(USERNAME_MAX_LENGTH + 1), 'signup'), 'auth.usernameTooLong')
  assert.equal(authFieldError('username', 'a'.repeat(USERNAME_MIN_LENGTH), 'signup'), null)
  assert.equal(authFieldError('username', 'a'.repeat(USERNAME_MAX_LENGTH), 'signup'), null)
  assert.equal(authFieldError('username', `  ${'a'.repeat(USERNAME_MIN_LENGTH)}  `, 'signup'), null)
})

test('username is not checked on sign-in', () => {
  assert.equal(authFieldError('username', '', 'signin'), null)
  assert.equal(authFieldError('username', 'ab', 'signin'), null)
})

test('password is required and must meet the current minimum length', () => {
  assert.equal(authFieldError('password', '', 'signin'), 'auth.passwordRequired')
  assert.equal(authFieldError('password', 'a'.repeat(PASSWORD_MIN_LENGTH - 1), 'signup'), 'auth.passwordTooShort')
  assert.equal(authFieldError('password', 'a'.repeat(PASSWORD_MIN_LENGTH), 'signin'), null)
  // Letters-and-numbers is a server message today, not a client rule. US-07 owns that policy.
  assert.equal(authFieldError('password', '1'.repeat(PASSWORD_MIN_LENGTH), 'signup'), null)
  assert.equal(authFieldError('password', ' '.repeat(PASSWORD_MIN_LENGTH), 'signin'), null)
})

test('the first invalid field follows email, username, then password', () => {
  assert.equal(
    firstInvalidAuthField({ email: '', username: '', password: '' }, 'signin'),
    'email',
  )
  assert.equal(
    firstInvalidAuthField(
      { email: 'user@example.com', username: '', password: 'short' },
      'signin',
    ),
    'password',
  )
  assert.equal(
    firstInvalidAuthField({ email: 'not-an-email', username: 'ab', password: '' }, 'signup'),
    'email',
  )
  assert.equal(
    firstInvalidAuthField(
      { email: 'user@example.com', username: '   ', password: '' },
      'signup',
    ),
    'username',
  )
  assert.equal(
    firstInvalidAuthField(
      {
        email: 'user@example.com',
        username: 'hero',
        password: 'a'.repeat(PASSWORD_MIN_LENGTH),
      },
      'signup',
    ),
    null,
  )
})
