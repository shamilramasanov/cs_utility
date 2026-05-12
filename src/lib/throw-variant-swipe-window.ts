/**
 * Горизонтальный свайп для переключения варианта броска (нижний док и широкая зона медиа).
 * Сессия вешает touchmove/touchend на window, чтобы жест не съедался вложенным скроллом.
 */

import { lockHorizontalSwipeScroll, unlockHorizontalSwipeScroll } from './horizontal-swipe-scroll-lock'

export const THROW_VARIANT_SWIPE_MIN_PX = 36

export function isDominantHorizontalThrowVariantSwipe(dx: number, dy: number): boolean {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax < THROW_VARIANT_SWIPE_MIN_PX) return false
  return ax >= ay * 1.08
}

export type ThrowVariantSwipeContext = {
  count: number
  activeIndex: number
  onChange: (next: number) => void
  /** При успешном свайпе — чтобы клик по кнопке не дублировал смену. */
  markSkipNextClick?: () => void
}

export function tryThrowVariantSwipeNavigate(
  ctx: ThrowVariantSwipeContext,
  dx: number,
  dy: number,
): boolean {
  const { count, activeIndex: clamped, onChange, markSkipNextClick } = ctx
  if (count < 2 || !isDominantHorizontalThrowVariantSwipe(dx, dy)) return false
  if (dx < 0 && clamped < count - 1) {
    markSkipNextClick?.()
    onChange(clamped + 1)
    return true
  }
  if (dx > 0 && clamped > 0) {
    markSkipNextClick?.()
    onChange(clamped - 1)
    return true
  }
  return false
}

let activeTeardown: (() => void) | null = null

export function teardownThrowVariantSwipeWindow(): void {
  activeTeardown?.()
  activeTeardown = null
}

/**
 * @param getCtx — на момент touchend актуальный индекс/количество (refs из родителя).
 */
export function beginThrowVariantSwipeWindowTracking(
  touchId: number,
  x0: number,
  y0: number,
  getCtx: () => ThrowVariantSwipeContext,
): () => void {
  activeTeardown?.()

  let lastX = x0
  let lastY = y0
  let scrollLocked = false

  const onMove = (ev: TouchEvent) => {
    for (let i = 0; i < ev.touches.length; i++) {
      const tch = ev.touches[i]
      if (tch.identifier === touchId) {
        lastX = tch.clientX
        lastY = tch.clientY
        break
      }
    }
    if (!scrollLocked && isDominantHorizontalThrowVariantSwipe(lastX - x0, lastY - y0)) {
      scrollLocked = true
      lockHorizontalSwipeScroll()
    }
  }

  const detach = () => {
    if (scrollLocked) {
      scrollLocked = false
      unlockHorizontalSwipeScroll()
    }
    window.removeEventListener('touchmove', onMove as EventListener)
    window.removeEventListener('touchend', onEnd as EventListener)
    window.removeEventListener('touchcancel', onCancel)
    activeTeardown = null
  }

  const onEnd = (ev: TouchEvent) => {
    for (let i = 0; i < ev.changedTouches.length; i++) {
      const c = ev.changedTouches[i]
      if (c.identifier !== touchId) continue
      detach()
      tryThrowVariantSwipeNavigate(getCtx(), c.clientX - x0, c.clientY - y0)
      return
    }
    detach()
    tryThrowVariantSwipeNavigate(getCtx(), lastX - x0, lastY - y0)
  }

  const onCancel = () => {
    detach()
  }

  window.addEventListener('touchmove', onMove as EventListener, { passive: true })
  window.addEventListener('touchend', onEnd as EventListener, { passive: true })
  window.addEventListener('touchcancel', onCancel, { passive: true })
  activeTeardown = detach
  return detach
}
