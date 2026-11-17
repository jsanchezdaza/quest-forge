import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseAuthMode } from '../../src/lib/authMode.ts'

test('opens sign-in when the mode query is absent', () => {
  assert.equal(parseAuthMode(null), 'signin')
})

test('opens sign-up when the mode query is signup', () => {
  assert.equal(parseAuthMode('signup'), 'signup')
})

test('opens sign-in when the mode query is unknown', () => {
  assert.equal(parseAuthMode('bogus'), 'signin')
  assert.equal(parseAuthMode(''), 'signin')
  assert.equal(parseAuthMode('SIGNUP'), 'signin')
})

test('opens the new-password view when the mode query is update-password', () => {
  assert.equal(parseAuthMode('update-password'), 'update-password')
})

test('opens password recovery when the mode query is reset', () => {
  assert.equal(parseAuthMode('reset'), 'reset')
})
