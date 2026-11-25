import { test, expect, type Page } from './setup'
import { AUTH_VIDEO_PLAYBACK_RATE } from '../../src/components/ui/AuthVideoBackground'

const DESKTOP_VIDEO = 'background-animated-desktop.mp4'

function recordVideoRequests(page: Page): string[] {
  const urls: string[] = []
  page.on('request', (request) => {
    if (request.url().includes(DESKTOP_VIDEO)) urls.push(new URL(request.url()).pathname)
  })
  return urls
}

test.describe('the desktop auth video is not downloaded on a phone and still loads from 768px', () => {
  test('a phone keeps the static png and does not request the desktop video', async ({ page }) => {
    const urls = recordVideoRequests(page)
    await page.setViewportSize({ width: 393, height: 851 })
    await page.goto('/auth', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()

    await expect(page.locator('video.auth-video')).toHaveCount(0)
    const background = await page.locator('.app-background').evaluate((element) => getComputedStyle(element).backgroundImage)
    expect(background).toContain('background-mobile.png')
    expect(urls).toEqual([])
  })

  test('desktop still loads the background video at the configured rate', async ({ page }) => {
    const requested = page.waitForRequest((request) => request.url().includes(DESKTOP_VIDEO))
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/auth')
    await requested

    const video = page.locator('video.auth-video')
    await expect(video).toBeAttached()
    await expect(video.locator('source')).toHaveAttribute('src', new RegExp(`${DESKTOP_VIDEO}$`))
    await expect(video).toHaveJSProperty('playbackRate', AUTH_VIDEO_PLAYBACK_RATE)
  })

  test('widening past 768px mounts the video and requests it', async ({ page }) => {
    const urls = recordVideoRequests(page)
    await page.setViewportSize({ width: 767, height: 900 })
    await page.goto('/auth', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1, name: /quest forge/i })).toBeVisible()
    await expect(page.locator('video.auth-video')).toHaveCount(0)
    expect(urls).toEqual([])

    const requested = page.waitForRequest((request) => request.url().includes(DESKTOP_VIDEO))
    await page.setViewportSize({ width: 800, height: 900 })
    await requested
    const video = page.locator('video.auth-video')
    await expect(video).toBeAttached()
    await expect(video).toHaveJSProperty('playbackRate', AUTH_VIDEO_PLAYBACK_RATE)
  })
})
