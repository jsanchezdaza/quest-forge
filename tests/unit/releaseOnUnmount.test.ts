import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { Window } from 'happy-dom'
import { createRecoveryHold } from '../../src/lib/updatePassword.ts'

/**
 * The end-to-end check runs in dev with StrictMode, which unmounts the card
 * once during mount and already releases the hold. This renders once, so the
 * hold has to survive mount and drop only on unmount.
 */
test('unmounting the new-password card releases the recovery hold', async () => {
  const dom = new Window()
  const install = (name: string, value: unknown) => {
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
  }
  install('window', dom)
  install('document', dom.document)
  install('HTMLElement', dom.HTMLElement)
  install('Element', dom.Element)
  install('Node', dom.Node)
  install('IS_REACT_ACT_ENVIRONMENT', true)

  const { createElement, act } = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { useReleaseOnUnmount } = await import('../../src/lib/useReleaseOnUnmount.ts')

  const hold = createRecoveryHold()
  hold.apply('PASSWORD_RECOVERY', true)
  const release = () => {
    hold.release()
  }

  function Card() {
    useReleaseOnUnmount(release)
    return null
  }

  const host = dom.document.createElement('div')
  dom.document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => {
    root.render(createElement(Card))
  })
  assert.equal(hold.current(), true)

  await act(async () => {
    root.unmount()
  })
  assert.equal(hold.current(), false)

  const panel = readFileSync(
    new URL('../../src/components/auth/UpdatePasswordPanel.tsx', import.meta.url),
    'utf8',
  )
  assert.equal(panel.includes('useReleaseOnUnmount(clearPasswordRecovery)'), true)
})
