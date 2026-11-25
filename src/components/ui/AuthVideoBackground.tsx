import { useEffect, useRef } from 'react'
import usePrefersReducedMotion, { useMediaQuery } from '../../hooks/usePrefersReducedMotion'

const VIDEO_SRC = '/images/backgrounds/background-animated-desktop.mp4'

/** Phone layouts stay on the static PNG. The desktop video starts at this width. */
const DESKTOP_VIDEO_QUERY = '(min-width: 768px)'

/**
 * Desktop auth background speed, as a multiple of realtime.
 * Initial value inside the 0.5–0.7 range; tune after a visual check.
 */
export const AUTH_VIDEO_PLAYBACK_RATE = 0.6

/**
 * Animated dungeon background for the auth screen. Below 768px the video is not
 * mounted, so a phone never requests the file; the static PNG in `.app-background`
 * is the background there. The video is anchored top-left and slightly zoomed
 * (see CSS) to push the bottom-right generator watermark toward the cropped edge.
 * Decorative: aria-hidden and out of the tab order. Reduced motion pauses it.
 * Playback uses AUTH_VIDEO_PLAYBACK_RATE.
 */
export default function AuthVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduceMotion = usePrefersReducedMotion()
  const desktop = useMediaQuery(DESKTOP_VIDEO_QUERY)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    // The element keeps this rate across a loop and a later play().
    video.playbackRate = AUTH_VIDEO_PLAYBACK_RATE
    if (reduceMotion) {
      video.pause()
      return
    }
    // autoPlay only applies on mount. Turning reduced motion off later has to start it.
    video.play().catch(() => {})
  }, [reduceMotion, desktop])

  return (
    <div className="auth-video-bg absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="auth-video-stage">
        {desktop && (
          <video
            ref={videoRef}
            className="auth-video"
            // Firefox still tabs to a video inside an aria-hidden wrapper.
            tabIndex={-1}
            autoPlay={!reduceMotion}
            muted
            loop
            playsInline
            preload={reduceMotion ? 'none' : 'auto'}
          >
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
        )}
      </div>
      <div className="auth-video-tint" />
    </div>
  )
}
