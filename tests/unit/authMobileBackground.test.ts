import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { test } from 'node:test'

const TRANSFER_BUDGET_BYTES = 250 * 1000

const css = readFileSync(new URL('../../src/styles/index.css', import.meta.url), 'utf8')

type StyleRule = { query: string | null; selector: string; declarations: string }

function matchingBrace(source: string, open: number): number {
  let depth = 0
  for (let index = open; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  throw new Error('unbalanced braces')
}

function styleRules(source: string): StyleRule[] {
  const rules: StyleRule[] = []
  const walk = (body: string, query: string | null) => {
    let index = 0
    while (index < body.length) {
      const open = body.indexOf('{', index)
      if (open === -1) return
      const prelude = body.slice(index, open).replace(/\s+/g, ' ').trim()
      const close = matchingBrace(body, open)
      const inner = body.slice(open + 1, close)
      if (prelude.startsWith('@media')) walk(inner, prelude.slice('@media'.length).trim())
      else if (prelude.startsWith('@')) walk(inner, query)
      else if (prelude) rules.push({ query, selector: prelude, declarations: inner })
      index = close + 1
    }
  }
  walk(source, null)
  return rules
}

function rule(query: string | null, selector: string): string {
  const found = styleRules(css).find(
    (candidate) => candidate.query === query && candidate.selector === selector,
  )
  assert.ok(found, `${query ?? 'base'} ${selector}`)
  return found.declarations
}

test('the mobile auth background offers avif, webp, and the png fallback', () => {
  const image = rule('(max-width: 768px)', '.app-background')
  assert.match(image, /type\(["']image\/avif["']\)/)
  assert.match(image, /type\(["']image\/webp["']\)/)
  assert.match(image, /background-mobile\.png/)
})

function modernBackgroundUrls(declarations: string): string[] {
  return [...declarations.matchAll(/url\('(\/images\/backgrounds\/[^']+\.(?:avif|webp))'\)/g)].map(
    (match) => match[1],
  )
}

test('a 390px viewport transfers at most 250KB of mobile background', () => {
  const urls = styleRules(css)
    .filter((candidate) => candidate.selector === '.app-background' && candidate.query?.includes('max-width'))
    .flatMap((candidate) => modernBackgroundUrls(candidate.declarations))
  assert.ok(urls.length > 0)
  for (const url of urls) {
    const file = new URL(`../../public${url}`, import.meta.url)
    assert.ok(existsSync(file), url)
    const bytes = statSync(file).size
    assert.ok(bytes <= TRANSFER_BUDGET_BYTES, `${url} transfers ${bytes} bytes`)
  }
})

function mediaMatches(query: string, viewport: number, dpr: number): boolean {
  return query.split(/\s+and\s+/).every((part) => {
    const width = part.match(/max-width:\s*(\d+)px/)
    if (width) return viewport <= Number(width[1])
    const resolution = part.match(/max-resolution:\s*([\d.]+)dppx/)
    if (resolution) return dpr <= Number(resolution[1])
    throw new Error(`unsupported media ${part}`)
  })
}

function avifFor(viewport: number, dpr: number): string {
  const matches = styleRules(css).filter(
    (candidate) =>
      candidate.selector === '.app-background' &&
      candidate.query !== null &&
      mediaMatches(candidate.query, viewport, dpr),
  )
  const winner = matches.at(-1)
  assert.ok(winner, `no background at ${viewport}px ${dpr}x`)
  const url = winner.declarations.match(/url\('(\/images\/backgrounds\/[^']+\.avif)'\)/)
  assert.ok(url, 'avif url')
  return url[1]
}

function imageSize(file: URL): { width: number; height: number } {
  const bytes = readFileSync(file)
  if (bytes.toString('ascii', 1, 4) === 'PNG') {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
  }
  const ispe = bytes.indexOf('ispe')
  if (ispe !== -1) {
    return { width: bytes.readUInt32BE(ispe + 8), height: bytes.readUInt32BE(ispe + 12) }
  }
  throw new Error(`no size in ${file.pathname}`)
}

test('a dense phone keeps the full mobile background', () => {
  const source = imageSize(new URL('../../public/images/backgrounds/background-mobile.png', import.meta.url))
  const served = imageSize(new URL(`../../public${avifFor(390, 2)}`, import.meta.url))
  assert.deepEqual(served, source)
})

test('a narrow low-density screen gets a smaller background than a dense phone', () => {
  const widthOf = (viewport: number, dpr: number) => {
    const match = avifFor(viewport, dpr).match(/-(\d+)\.avif$/)
    assert.ok(match)
    return Number(match[1])
  }
  const lowDensity = widthOf(390, 1)
  const dense = widthOf(390, 2)
  assert.ok(lowDensity >= 390)
  assert.ok(lowDensity < dense)
  assert.ok(dense >= Math.min(390 * 2, 864))
  assert.ok(widthOf(740, 1) >= 740)
  assert.ok(widthOf(412, 1.75) >= 721)
})

test('the desktop background still uses the desktop still image', () => {
  const desktop = rule(null, '.app-background')
  assert.match(desktop, /background-desktop\.png/)
  assert.doesNotMatch(desktop, /background-mobile/)
  assert.doesNotMatch(desktop, /image\/avif|image\/webp/)
})

test('the game background on a phone still uses the mobile png', () => {
  const game = rule('(max-width: 768px)', '.app-background.game-background')
  assert.match(game, /background-mobile\.png/)
  assert.doesNotMatch(game, /image\/avif|image\/webp/)
})
