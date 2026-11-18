import { inflateSync } from 'node:zlib'

type Rgb = [number, number, number]

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Lowest contrast between `foreground` and the card pixels in an element
 * screenshot. Glyph pixels, plus a margin around them, are skipped so
 * antialiasing is not treated as the background. Rects are CSS pixels
 * relative to the element.
 */
export function minimumContrast(
  png: Buffer,
  elementWidth: number,
  elementHeight: number,
  textRects: Rect[],
  foreground: Rgb,
): number {
  const image = decodePng(png)
  const scale = image.width / elementWidth
  // A fractional device pixel makes the screenshot a little larger than the
  // element, so the outer CSS pixel can be the scene beside it. Inset from
  // the CSS box, not the inflated screenshot, or the extra row stays in.
  let lowest = Number.POSITIVE_INFINITY
  let samples = 0

  for (let y = 1; y < image.height - 1; y += 1) {
    for (let x = 1; x < image.width - 1; x += 1) {
      const cssX = x / scale
      const cssY = y / scale
      if (cssX < 1 || cssY < 1 || cssX > elementWidth - 1 || cssY > elementHeight - 1) continue
      const onGlyph = textRects.some((rect) =>
        cssX >= rect.x - 3 && cssX <= rect.x + rect.width + 3
        && cssY >= rect.y - 2 && cssY <= rect.y + rect.height + 2
      )
      if (onGlyph) continue
      const offset = (y * image.width + x) * 4
      const ratio = contrastRatio(foreground, [
        image.pixels[offset],
        image.pixels[offset + 1],
        image.pixels[offset + 2],
      ])
      samples += 1
      if (ratio < lowest) lowest = ratio
    }
  }

  if (samples < 20) {
    throw new Error(`not enough card pixels behind the error (${samples})`)
  }
  return lowest
}

const MIN_RING_SAMPLES = 100
const GLYPH_CHANNEL_DELTA = 12

/**
 * Lowest contrast of `foreground` against the background 1–3 CSS pixels
 * outside the glyph.
 *
 * `inkPng` is the link drawn in its text color with no shadow. `barePng` is
 * the same link with the text transparent and no shadow. Pixels that differ
 * are the glyph, including its antialiased edge. `renderedPng` is the real
 * link, text and shadow together. The sample is the ring just outside that
 * mask. The dark pixels under the letters, and the empty padding farther
 * than 3px out, are not part of it.
 */
export function legibleTextContrast(
  renderedPng: Buffer,
  inkPng: Buffer,
  barePng: Buffer,
  elementWidth: number,
  elementHeight: number,
  foreground: Rgb,
): number {
  const rendered = decodePng(renderedPng)
  const ink = decodePng(inkPng)
  const bare = decodePng(barePng)
  if (
    ink.width !== rendered.width || ink.height !== rendered.height
    || bare.width !== rendered.width || bare.height !== rendered.height
  ) {
    throw new Error('link screenshots differ in size')
  }
  const scale = rendered.width / elementWidth
  const glyph = new Uint8Array(rendered.width * rendered.height)
  for (let index = 0; index < glyph.length; index += 1) {
    const offset = index * 4
    const differs = Math.abs(ink.pixels[offset] - bare.pixels[offset]) >= GLYPH_CHANNEL_DELTA
      || Math.abs(ink.pixels[offset + 1] - bare.pixels[offset + 1]) >= GLYPH_CHANNEL_DELTA
      || Math.abs(ink.pixels[offset + 2] - bare.pixels[offset + 2]) >= GLYPH_CHANNEL_DELTA
    if (differs) glyph[index] = 1
  }

  const distance = chebyshevDistance(glyph, rendered.width, rendered.height)
  let lowest = Number.POSITIVE_INFINITY
  let samples = 0

  for (let y = 0; y < rendered.height; y += 1) {
    for (let x = 0; x < rendered.width; x += 1) {
      const cssX = x / scale
      const cssY = y / scale
      if (cssX < 1 || cssY < 1 || cssX > elementWidth - 1 || cssY > elementHeight - 1) continue
      const cssDistance = distance[y * rendered.width + x] / scale
      if (cssDistance < 1 || cssDistance > 3) continue
      const offset = (y * rendered.width + x) * 4
      const ratio = contrastRatio(foreground, [
        rendered.pixels[offset],
        rendered.pixels[offset + 1],
        rendered.pixels[offset + 2],
      ])
      samples += 1
      if (ratio < lowest) lowest = ratio
    }
  }

  if (samples < MIN_RING_SAMPLES) {
    throw new Error(`not enough ring pixels beside the text (${samples})`)
  }
  return lowest
}

/** Device-pixel Chebyshev distance to the nearest glyph pixel. */
function chebyshevDistance(glyph: Uint8Array, width: number, height: number): Int32Array {
  const distance = new Int32Array(width * height)
  distance.fill(1_000_000)
  for (let index = 0; index < glyph.length; index += 1) {
    if (glyph[index] === 1) distance[index] = 0
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      let nearest = distance[index]
      if (x > 0) nearest = Math.min(nearest, distance[index - 1] + 1)
      if (y > 0) nearest = Math.min(nearest, distance[index - width] + 1)
      if (x > 0 && y > 0) nearest = Math.min(nearest, distance[index - width - 1] + 1)
      if (x + 1 < width && y > 0) nearest = Math.min(nearest, distance[index - width + 1] + 1)
      distance[index] = nearest
    }
  }

  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      const index = y * width + x
      let nearest = distance[index]
      if (x + 1 < width) nearest = Math.min(nearest, distance[index + 1] + 1)
      if (y + 1 < height) nearest = Math.min(nearest, distance[index + width] + 1)
      if (x + 1 < width && y + 1 < height) nearest = Math.min(nearest, distance[index + width + 1] + 1)
      if (x > 0 && y + 1 < height) nearest = Math.min(nearest, distance[index + width - 1] + 1)
      distance[index] = nearest
    }
  }

  return distance
}

interface DecodedPng {
  width: number
  height: number
  pixels: Uint8ClampedArray
}

function contrastRatio(foreground: Rgb, background: Rgb): number {
  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

function luminance([red, green, blue]: Rgb): number {
  const channel = (value: number) => {
    const srgb = value / 255
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
}

function paeth(left: number, up: number, upLeft: number): number {
  const estimate = left + up - upLeft
  const leftDistance = Math.abs(estimate - left)
  const upDistance = Math.abs(estimate - up)
  const diagonal = Math.abs(estimate - upLeft)
  if (leftDistance <= upDistance && leftDistance <= diagonal) return left
  if (upDistance <= diagonal) return up
  return upLeft
}

function decodePng(buffer: Buffer): DecodedPng {
  let offset = 8
  let width = 0
  let height = 0
  let colorType = 2
  const idat: Buffer[] = []

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      colorType = data[9]
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }

  const inflated = inflateSync(Buffer.concat(idat))
  const channels = colorType === 6 ? 4 : 3
  const stride = width * channels
  const pixels = new Uint8ClampedArray(width * height * 4)
  let source = 0
  let previous = new Uint8Array(stride)

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[source]
    source += 1
    const row = inflated.subarray(source, source + stride)
    source += stride
    const reconstructed = new Uint8Array(stride)
    for (let index = 0; index < stride; index += 1) {
      const left = index >= channels ? reconstructed[index - channels] : 0
      const up = previous[index]
      const upLeft = index >= channels ? previous[index - channels] : 0
      let value = row[index]
      if (filter === 1) value = (value + left) & 255
      else if (filter === 2) value = (value + up) & 255
      else if (filter === 3) value = (value + Math.floor((left + up) / 2)) & 255
      else if (filter === 4) value = (value + paeth(left, up, upLeft)) & 255
      reconstructed[index] = value
    }
    previous = reconstructed
    for (let x = 0; x < width; x += 1) {
      const index = x * channels
      const pixel = (y * width + x) * 4
      pixels[pixel] = reconstructed[index]
      pixels[pixel + 1] = reconstructed[index + 1]
      pixels[pixel + 2] = reconstructed[index + 2]
      pixels[pixel + 3] = channels === 4 ? reconstructed[index + 3] : 255
    }
  }

  return { width, height, pixels }
}
