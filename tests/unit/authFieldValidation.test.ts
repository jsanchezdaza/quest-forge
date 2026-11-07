import assert from 'node:assert/strict'
import { test } from 'node:test'
import { passwordRequirementStatus, VALIDATION_RULES } from '../../src/constants/validation.ts'
import { en } from '../../src/i18n/en.ts'
import { es } from '../../src/i18n/es.ts'
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

test('a new password needs 8 characters, a letter, and a number', () => {
  assert.equal(PASSWORD_MIN_LENGTH, 8)
  assert.deepEqual(passwordRequirementStatus(''), {
    minLength: false,
    letter: false,
    number: false,
  })
  assert.deepEqual(passwordRequirementStatus('short'), {
    minLength: false,
    letter: true,
    number: false,
  })
  assert.deepEqual(passwordRequirementStatus('12345678'), {
    minLength: true,
    letter: false,
    number: true,
  })
  assert.deepEqual(passwordRequirementStatus('abcdefgh'), {
    minLength: true,
    letter: true,
    number: false,
  })
  assert.deepEqual(passwordRequirementStatus('ABCD1234'), {
    minLength: true,
    letter: true,
    number: true,
  })

  assert.equal(authFieldError('password', '', 'signup'), 'auth.passwordRequired')
  assert.equal(authFieldError('password', 'abc1234', 'signup'), 'auth.passwordTooShort')
  assert.equal(authFieldError('password', 'abcdefg', 'signup'), 'auth.passwordTooShort')
  assert.equal(authFieldError('password', '1234567', 'signup'), 'auth.passwordTooShort')
  assert.equal(authFieldError('password', 'abcdefgh', 'signup'), 'auth.passwordNeedsNumber')
  assert.equal(authFieldError('password', '12345678', 'signup'), 'auth.passwordNeedsLetter')
  assert.equal(authFieldError('password', 'abcd1234', 'signup'), null)
})

test('sign-in only requires a password, so an existing one still passes', () => {
  assert.equal(authFieldError('password', '', 'signin'), 'auth.passwordRequired')
  assert.equal(authFieldError('password', 'short', 'signin'), null)
  assert.equal(authFieldError('password', 'abcdef', 'signin'), null)
  assert.equal(authFieldError('password', '1234567', 'signin'), null)
  assert.equal(authFieldError('password', 'password', 'signin'), null)
})

test('the weak-password message states the same rule in English and Spanish', () => {
  const min = String(PASSWORD_MIN_LENGTH)
  assert.equal(
    en['error.weakPassword.message'],
    `Password must be at least ${min} characters and include at least one letter and one number.`,
  )
  assert.equal(
    es['error.weakPassword.message'],
    `La contraseña debe tener al menos ${min} caracteres e incluir al menos una letra y un número.`,
  )
})

test('the checklist copy lists the same three rules in English and Spanish', () => {
  assert.equal(en['auth.passwordRule.minLength'], 'At least {min} characters')
  assert.equal(en['auth.passwordRule.letter'], 'At least one letter')
  assert.equal(en['auth.passwordRule.number'], 'At least one number')
  assert.equal(en['auth.passwordRule.met'], 'met')
  assert.equal(en['auth.passwordRule.notMet'], 'not met')
  assert.equal(es['auth.passwordRule.minLength'], 'Al menos {min} caracteres')
  assert.equal(es['auth.passwordRule.letter'], 'Al menos una letra')
  assert.equal(es['auth.passwordRule.number'], 'Al menos un número')
  assert.equal(es['auth.passwordRule.met'], 'cumplido')
  assert.equal(es['auth.passwordRule.notMet'], 'no cumplido')
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
    null,
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
      { email: 'user@example.com', username: 'hero', password: 'abcdefgh' },
      'signup',
    ),
    'password',
  )
  assert.equal(
    firstInvalidAuthField(
      { email: 'user@example.com', username: 'hero', password: 'abcd1234' },
      'signup',
    ),
    null,
  )
})
