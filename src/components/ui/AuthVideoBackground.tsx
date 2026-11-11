import { useEffect, useRef } from 'react'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion'

const VIDEO_SRC = '/images/backgrounds/background-animated-desktop.mp4'

/**
 * Desktop auth background speed, as a multiple of realtime.
 * Initial value inside the 0.5–0.7 range; tune after a visual check.
 */
export const AUTH_VIDEO_PLAYBACK_RATE = 0.6

/**
 * Animated dungeon background for the auth screen (desktop only; hidden on mobile via CSS,
 * where the static PNG in `.app-background` is used instead). The video is anchored top-left
 * and slightly zoomed (see CSS) to push the bottom-right generator watermark toward the
 * cropped edge. Decorative: aria-hidden and out of the tab order. Reduced
 * motion pauses it; playback speed is left alone.
 */
export default function AuthVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduceMotion = usePrefersReducedMotion()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (reduceMotion) {
      video.pause()
      return
    }
    // autoPlay only applies on mount. Turning reduced motion off later has to start it.
    video.play().catch(() => {})
  }, [reduceMotion])

  return (
    <div className="auth-video-bg absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="auth-video-stage">
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
      </div>
      <div className="auth-video-tint" />
    </div>
  )
}
