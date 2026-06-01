const VIDEO_SRC = '/images/backgrounds/background-animated-desktop.mp4'

/**
 * Animated dungeon background for the auth screen (desktop only; hidden on mobile via CSS,
 * where the static PNG in `.app-background` is used instead). The video is anchored top-left
 * and slightly zoomed (see CSS) to push the bottom-right generator watermark toward the
 * cropped edge. Decorative: aria-hidden.
 */
export default function AuthVideoBackground() {
  return (
    <div className="auth-video-bg absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="auth-video-stage">
        <video className="auth-video" autoPlay muted loop playsInline preload="auto">
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      </div>
      <div className="auth-video-tint" />
    </div>
  )
}
