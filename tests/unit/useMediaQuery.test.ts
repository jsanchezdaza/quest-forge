import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { Window } from 'happy-dom'

function mountDesktopVideoQuery(): string {
  const source = readFileSync(
    new URL('../../src/components/ui/AuthVideoBackground.tsx', import.meta.url),
    'utf8',
  )
  const match = source.match(/export const MOUNT_DESKTOP_VIDEO_FROM = '([^']+)'/)
  assert.ok(match)
  return match[1]
}

type Harness = {
  text: () => string | null
  resize: (width: number) => Promise<void>
  unmount: () => Promise<void>
}

function install(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
}

async function renderQuery(dom: Window, query: string): Promise<Harness> {
  install('window', dom)
  install('document', dom.document)
  install('HTMLElement', dom.HTMLElement)
  install('Element', dom.Element)
  install('Node', dom.Node)
  install('IS_REACT_ACT_ENVIRONMENT', true)

  const { createElement, act } = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { useMediaQuery } = await import('../../src/hooks/usePrefersReducedMotion.ts')

  function Probe() {
    const matches = useMediaQuery(query)
    return createElement('div', { id: 'probe' }, matches ? 'yes' : 'no')
  }

  const host = dom.document.createElement('div')
  dom.document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => {
    root.render(createElement(Probe))
  })

  return {
    text: () => dom.document.getElementById('probe')?.textContent ?? null,
    async resize(width: number) {
      dom.innerWidth = width
      await act(async () => {
        dom.dispatchEvent(new dom.Event('resize'))
      })
    },
    async unmount() {
      await act(async () => {
        root.unmount()
      })
    },
  }
}

test('the desktop auth video query is off below 768px and on from 768px', async () => {
  const query = mountDesktopVideoQuery()
  assert.equal(query, '(min-width: 768px)')

  const narrow = await renderQuery(new Window({ width: 767, height: 800 }), query)
  assert.equal(narrow.text(), 'no')
  await narrow.unmount()

  const desktop = await renderQuery(new Window({ width: 768, height: 800 }), query)
  assert.equal(desktop.text(), 'yes')
  await desktop.unmount()
})

test('crossing 768px updates the desktop auth video query', async () => {
  const view = await renderQuery(new Window({ width: 375, height: 667 }), mountDesktopVideoQuery())
  assert.equal(view.text(), 'no')

  await view.resize(1280)
  assert.equal(view.text(), 'yes')

  await view.resize(375)
  assert.equal(view.text(), 'no')
  await view.unmount()
})

test('reduced motion still follows prefers-reduced-motion', async () => {
  const dom = new Window({
    width: 1280,
    height: 720,
    settings: { device: { prefersReducedMotion: 'reduce' } },
  })
  install('window', dom)
  install('document', dom.document)
  install('HTMLElement', dom.HTMLElement)
  install('Element', dom.Element)
  install('Node', dom.Node)
  install('IS_REACT_ACT_ENVIRONMENT', true)

  const { createElement, act } = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { default: usePrefersReducedMotion } = await import('../../src/hooks/usePrefersReducedMotion.ts')

  function Probe() {
    const reduce = usePrefersReducedMotion()
    return createElement('div', { id: 'motion' }, reduce ? 'reduce' : 'allow')
  }

  const host = dom.document.createElement('div')
  dom.document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => {
    root.render(createElement(Probe))
  })
  assert.equal(dom.document.getElementById('motion')?.textContent, 'reduce')
  await act(async () => {
    root.unmount()
  })
})
