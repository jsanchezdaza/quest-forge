import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Linter } from 'eslint'
import plugin from '../../eslint/plugin.js'

const RULE_ID = 'local/no-comments'

function messagesFor(code: string, filename = 'fixture.js') {
  const linter = new Linter({ configType: 'flat' })
  return linter.verify(
    code,
    [
      {
        files: ['**/*.{js,ts,tsx}'],
        languageOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        plugins: { local: plugin },
        rules: { [RULE_ID]: 'error' },
      },
    ],
    { filename },
  ).filter((message) => message.ruleId === RULE_ID)
}

function reports(code: string, filename?: string) {
  const messages = messagesFor(code, filename)
  assert.equal(messages.length, 1)
  assert.equal(messages[0].messageId, 'unexpected')
}

function allows(code: string, filename?: string) {
  assert.deepEqual(messagesFor(code, filename), [])
}

test('the local plugin exposes the no-comments rule', () => {
  assert.equal(typeof plugin.rules['no-comments'].create, 'function')
})

test('reports a line comment and a block comment', () => {
  reports('const value = 1 // reason\n')
  reports('/* reason */\nconst value = 1\n')
  reports('const view = <div>{/* reason */}</div>\n', 'fixture.tsx')
})

test('reports a comment that only mentions a directive', () => {
  reports('// see the eslint-disable docs before changing this\nconst value = 1\n')
  reports('/* eslint-disable no-unused-vars\n   still a comment\n*/\nconst value = 1\n')
})

test('ignores comment-like text inside a string and a shebang', () => {
  allows('const site = "https://vitejs.dev/config/"\n')
  allows('const note = "/* not a comment */"\n')
  allows('#!/usr/bin/env node\nconst value = 1\n')
})

test('allows eslint-disable directives and a same-line reason', () => {
  allows('const value = 1 // eslint-disable-line no-unused-vars\n')
  allows('// eslint-disable-next-line no-unused-vars -- fixture\nconst value = 1\n')
  allows('/* eslint-disable no-unused-vars */\nconst value = 1\n')
})

test('allows an eslint-enable directive', () => {
  allows('// eslint-enable no-unused-vars\nconst value = 1\n')
  allows('/* eslint-enable no-unused-vars */\nconst value = 1\n')
})

test('allows TypeScript directives', () => {
  allows('// @ts-expect-error the fixture is intentionally wrong\nconst value = 1\n')
  allows('// @ts-ignore\nconst value = 1\n')
  allows('// @ts-nocheck\nconst value = 1\n')
  allows('/// <reference path="types.d.ts" />\nexport {}\n')
})

test('allows vitest and jest pragmas', () => {
  allows('// @vitest-environment happy-dom\nexport {}\n')
  allows('/**\n * @jest-environment jsdom\n */\nexport {}\n')
})
