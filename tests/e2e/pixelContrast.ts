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

/**
 * Lowest contrast of `foreground` against the shadow the text is drawn on.
 *
 * `minimumContrast` skips a margin around the whole line, which is where a
 * text-shadow is drawn, so that check cannot see the shadow. Here `shadowPng`
 * is the element with the text color removed and the shadow left in place,
 * and `barePng` is the same element with the shadow removed too. A pixel the
 * shadow darkens by at least half is the reading background. The faint edge
 * of the blur, and the empty padding of a 44px target, are not.
 */
export function legibleTextContrast(
  shadowPng: Buffer,
  barePng: Buffer,
  elementWidth: number,
  elementHeight: number,
  foreground: Rgb,
): number {
  const shadow = decodePng(shadowPng)
  const bare = decodePng(barePng)
  if (bare.width !== shadow.width || bare.height !== shadow.height) {
    throw new Error('shadow screenshots differ in size')
  }
  const scale = shadow.width / elementWidth
  let lowest = Number.POSITIVE_INFINITY
  let samples = 0

  for (let y = 0; y < shadow.height; y += 1) {
    for (let x = 0; x < shadow.width; x += 1) {
      const cssX = x / scale
      const cssY = y / scale
      if (cssX < 1 || cssY < 1 || cssX > elementWidth - 1 || cssY > elementHeight - 1) continue
      const offset = (y * shadow.width + x) * 4
      const painted: Rgb = [shadow.pixels[offset], shadow.pixels[offset + 1], shadow.pixels[offset + 2]]
      const underneath: Rgb = [bare.pixels[offset], bare.pixels[offset + 1], bare.pixels[offset + 2]]
      if (shadowCoverage(underneath, painted) < 0.5) continue
      const ratio = contrastRatio(foreground, painted)
      samples += 1
      if (ratio < lowest) lowest = ratio
    }
  }

  if (samples < 20) {
    throw new Error(`not enough shadow pixels around the text (${samples})`)
  }
  return lowest
}

interface DecodedPng {
  width: number
  height: number
  pixels: Uint8ClampedArray
}

/** How much of a black shadow is covering `underneath` in `painted`. */
function shadowCoverage(underneath: Rgb, painted: Rgb): number {
  let covered = 0
  let channels = 0
  for (let channel = 0; channel < 3; channel += 1) {
    if (underneath[channel] < 8) continue
    const alpha = 1 - painted[channel] / underneath[channel]
    covered += Math.min(1, Math.max(0, alpha))
    channels += 1
  }
  return channels === 0 ? 0 : covered / channels
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
