let lockDepth = 0

function preventTouchScroll(e: TouchEvent) {
  if (e.cancelable) e.preventDefault()
}

export function lockHorizontalSwipeScroll() {
  if (typeof window === 'undefined') return
  lockDepth += 1
  if (lockDepth > 1) return

  document.documentElement.classList.add('horizontal-swipe-lock')
  window.addEventListener('touchmove', preventTouchScroll, { capture: true, passive: false })
}

export function unlockHorizontalSwipeScroll() {
  if (typeof window === 'undefined' || lockDepth === 0) return
  lockDepth -= 1
  if (lockDepth > 0) return

  document.documentElement.classList.remove('horizontal-swipe-lock')
  window.removeEventListener('touchmove', preventTouchScroll, { capture: true })
}
