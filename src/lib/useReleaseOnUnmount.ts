import { useEffect } from 'react'

/** Drop the recovery hold when the card leaves the page. Mounting leaves it in place. */
export function useReleaseOnUnmount(release: () => void) {
  useEffect(() => {
    return () => {
      release()
    }
  }, [release])
}
