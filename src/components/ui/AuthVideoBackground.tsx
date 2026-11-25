import { useEffect, useRef } from 'react'
import usePrefersReducedMotion, { useMediaQuery } from '../../hooks/usePrefersReducedMotion'

const VIDEO_SRC = '/images/backgrounds/background-animated-desktop.mp4'

export const MOUNT_DESKTOP_VIDEO_FROM = '(min-width: 768px)'

export const AUTH_VIDEO_PLAYBACK_RATE = 0.6

const FIREFOX_TABS_INTO_ARIA_HIDDEN_VIDEO = -1

function holdPlaybackRateAcrossLoopAndLaterPlay(video: HTMLVideoElement) {
  video.playbackRate = AUTH_VIDEO_PLAYBACK_RATE
}

function startPlaybackAfterReducedMotionTurnsOff(video: HTMLVideoElement) {
  video.play().catch(() => {})
}

export default function AuthVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduceMotion = usePrefersReducedMotion()
  const mountDesktopVideo = useMediaQuery(MOUNT_DESKTOP_VIDEO_FROM)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    holdPlaybackRateAcrossLoopAndLaterPlay(video)
    if (reduceMotion) {
      video.pause()
      return
    }
    startPlaybackAfterReducedMotionTurnsOff(video)
  }, [reduceMotion, mountDesktopVideo])

  return (
    <div className="auth-video-bg absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="auth-video-stage">
        {mountDesktopVideo && (
          <video
            ref={videoRef}
            className="auth-video auth-video-crop-watermark"
            tabIndex={FIREFOX_TABS_INTO_ARIA_HIDDEN_VIDEO}
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
