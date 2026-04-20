import { useEffect, useRef } from 'react'

// Pushes a history entry when a modal mounts so the browser/mobile back
// button closes the modal instead of navigating away. Also handles Escape.
//
// The pushState is deferred to the next tick so React StrictMode's synchronous
// mount→cleanup→mount cycle in dev doesn't leave a stale entry that triggers
// a popstate right after remount and auto-closes the modal.
export function useModalBackButton(onClose) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    let closedByBack = false
    let guardPushed = false
    let pushTimer = setTimeout(() => {
      window.history.pushState({ __modalGuard: true }, '')
      guardPushed = true
      pushTimer = null
    }, 0)

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
      if (pushTimer) clearTimeout(pushTimer)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('keydown', handleEscape)
      if (guardPushed && !closedByBack && window.history.state?.__modalGuard) {
        window.history.back()
      }
    }
  }, [])
}
