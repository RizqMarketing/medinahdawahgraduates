import { useEffect, useRef } from 'react'

// Pushes a history entry when a modal mounts so the browser/mobile back
// button closes the modal instead of navigating away. Also handles Escape.
// Cleans up its history marker when the modal closes via X, backdrop, or
// Link — skipping cleanup if a Link navigation already consumed it.
export function useModalBackButton(onClose) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    window.history.pushState({ __modalGuard: true }, '')
    let closedByBack = false

    const handlePopState = () => {
      closedByBack = true
      onCloseRef.current?.()
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.()
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('keydown', handleEscape)
      if (!closedByBack && window.history.state?.__modalGuard) {
        window.history.back()
      }
    }
  }, [])
}
