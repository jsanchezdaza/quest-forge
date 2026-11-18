import assert from 'node:assert/strict'
import { deflateSync, crc32 } from 'node:zlib'
import { test } from 'node:test'
import { cropPng, legibleTextContrast } from '../e2e/pixelContrast.ts'

type Rgb = [number, number, number]

const GOLD: Rgb = [240, 210, 122]
const STONE: Rgb = [186, 164, 122]
const BLACK: Rgb = [0, 0, 0]
const WHITE: Rgb = [255, 255, 255]

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(body) >>> 0)
  return Buffer.concat([length, body, checksum])
}

function encodePng(width: number, height: number, paint: (x: number, y: number) => Rgb): Buffer {
  const stride = width * 3 + 1
  const raw = Buffer.alloc(stride * height)
  for (let y = 0; y < height; y += 1) {
    const row = y * stride
    raw[row] = 0
    for (let x = 0; x < width; x += 1) {
      const [red, green, blue] = paint(x, y)
      const index = row + 1 + x * 3
      raw[index] = red
      raw[index + 1] = green
      raw[index + 2] = blue
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 2
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function paint(
  width: number,
  height: number,
  glyph: (x: number, y: number) => boolean,
  glyphColor: Rgb,
  rest: (x: number, y: number) => Rgb,
): Buffer {
  return encodePng(width, height, (x, y) => (glyph(x, y) ? glyphColor : rest(x, y)))
}

test('the ring beside the letters is the reading edge, not the dark core under the glyph', () => {
  const width = 80
  const height = 40
  const glyph = (x: number, y: number) => x >= 20 && x < 60 && y >= 16 && y < 24
  const ink = paint(width, height, glyph, GOLD, () => STONE)
  const bare = paint(width, height, () => false, GOLD, () => STONE)
  // The glyph itself is black. The 1–3px ring stays the light stone, and the
  // padding farther out is white. Only the ring may count.
  const rendered = paint(width, height, glyph, BLACK, () => STONE)
  const ratio = legibleTextContrast(rendered, ink, bare, width, height, GOLD)
  assert.ok(ratio < 4.5, `dark core measured ${ratio.toFixed(2)}:1`)
})

test('a dark ring 1–3px outside the glyph clears 4.5:1 even when the padding does not', () => {
  const width = 80
  const height = 40
  const glyph = (x: number, y: number) => x >= 20 && x < 60 && y >= 16 && y < 24
  const near = (x: number, y: number) => {
    const dx = x < 20 ? 20 - x : x >= 60 ? x - 59 : 0
    const dy = y < 16 ? 16 - y : y >= 24 ? y - 23 : 0
    return Math.max(dx, dy) <= 3
  }
  const ink = paint(width, height, glyph, GOLD, () => WHITE)
  const bare = paint(width, height, () => false, GOLD, () => WHITE)
  const rendered = paint(width, height, glyph, GOLD, (x, y) => (near(x, y) ? BLACK : WHITE))
  const ratio = legibleTextContrast(rendered, ink, bare, width, height, GOLD)
  assert.ok(ratio >= 4.5, `dark ring measured ${ratio.toFixed(2)}:1`)
})

test('a ring with fewer than 100 pixels is not a measurement', () => {
  const width = 20
  const height = 20
  const glyph = (x: number, y: number) => x >= 9 && x < 11 && y >= 9 && y < 11
  const ink = paint(width, height, glyph, GOLD, () => STONE)
  const bare = paint(width, height, () => false, GOLD, () => STONE)
  const rendered = paint(width, height, glyph, GOLD, () => BLACK)
  assert.throws(
    () => legibleTextContrast(rendered, ink, bare, width, height, GOLD),
    /not enough ring pixels/,
  )
})

test('cropPng keeps the ring inside the rectangle and drops the padding outside it', () => {
  const width = 80
  const height = 40
  const glyph = (x: number, y: number) => x >= 20 && x < 60 && y >= 16 && y < 24
  const near = (x: number, y: number) => {
    const dx = x < 20 ? 20 - x : x >= 60 ? x - 59 : 0
    const dy = y < 16 ? 16 - y : y >= 24 ? y - 23 : 0
    return Math.max(dx, dy) <= 3
  }
  const ink = paint(width, height, glyph, GOLD, () => WHITE)
  const bare = paint(width, height, () => false, GOLD, () => WHITE)
  const rendered = paint(width, height, glyph, GOLD, (x, y) => (near(x, y) ? BLACK : WHITE))
  const crop = (png: Buffer) => cropPng(png, 10, 8, 60, 24)
  const ratio = legibleTextContrast(crop(rendered), crop(ink), crop(bare), 60, 24, GOLD)
  assert.ok(ratio >= 4.5, `cropped ring measured ${ratio.toFixed(2)}:1`)
  assert.throws(
    () => legibleTextContrast(cropPng(rendered, 0, 0, 8, 8), cropPng(ink, 0, 0, 8, 8), cropPng(bare, 0, 0, 8, 8), 8, 8, GOLD),
    /not enough ring pixels/,
  )
})

test('device pixels are grouped into CSS pixels before the 1–3px ring is chosen', () => {
  const scale = 2
  const cssWidth = 40
  const cssHeight = 24
  const width = cssWidth * scale
  const height = cssHeight * scale
  const glyph = (x: number, y: number) => x >= 20 && x < 60 && y >= 16 && y < 32
  const near = (x: number, y: number) => {
    const dx = x < 20 ? 20 - x : x >= 60 ? x - 59 : 0
    const dy = y < 16 ? 16 - y : y >= 32 ? y - 31 : 0
    const css = Math.max(dx, dy) / scale
    return css >= 1 && css <= 3
  }
  const ink = paint(width, height, glyph, GOLD, () => WHITE)
  const bare = paint(width, height, () => false, GOLD, () => WHITE)
  const rendered = paint(width, height, glyph, GOLD, (x, y) => (near(x, y) ? BLACK : WHITE))
  const ratio = legibleTextContrast(rendered, ink, bare, cssWidth, cssHeight, GOLD)
  assert.ok(ratio >= 4.5, `scaled ring measured ${ratio.toFixed(2)}:1`)
})
