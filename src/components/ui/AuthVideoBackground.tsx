import { useEffect, useRef } from 'react'
import usePrefersReducedMotion, { useMediaQuery } from '../../hooks/usePrefersReducedMotion'

const VIDEO_SRC = '/images/backgrounds/background-animated-desktop.mp4'

export const MOUNT_DESKTOP_VIDEO_FROM = '(min-width: 768px)'

export const AUTH_VIDEO_PLAYBACK_RATE = 0.6

export default function AuthVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduceMotion = usePrefersReducedMotion()
  const mountDesktopVideo = useMediaQuery(MOUNT_DESKTOP_VIDEO_FROM)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = AUTH_VIDEO_PLAYBACK_RATE
    if (reduceMotion) {
      video.pause()
      return
    }
    video.play().catch(() => {})
  }, [reduceMotion, mountDesktopVideo])

  return (
    <div className="auth-video-bg absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="auth-video-stage">
        {mountDesktopVideo && (
          <video
            ref={videoRef}
            className="auth-video"
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
