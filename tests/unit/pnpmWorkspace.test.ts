import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('pnpm installs packages published today and lets esbuild write its binary', () => {
  const workspace = readFileSync(new URL('../../pnpm-workspace.yaml', import.meta.url), 'utf8')
  assert.match(workspace, /^minimumReleaseAge:\s*0$/m)
  assert.match(workspace, /^allowBuilds:\n {2}esbuild: true$/m)
})
