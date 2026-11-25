import { useEffect } from 'react'

export function useReleaseOnUnmount(release: () => void) {
  useEffect(() => {
    return () => {
      release()
    }
  }, [release])
}
