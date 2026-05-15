import { useEffect, useRef, type RefObject } from 'react'

const SWIPE_START_PX = 12
const SWIPE_COMMIT_PX = 48

export function usePlanTabSwipe(
  ref: RefObject<HTMLElement | null>,
  tab: 'text' | 'map',
  setTab: (next: 'text' | 'map') => void,
) {
  const tabRef = useRef(tab)
  tabRef.current = tab

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let start: { x: number; y: number; dragging: boolean } | null = null

    const excluded = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false
      return Boolean(target.closest('[data-plan-swipe-ignore]'))
    }

    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary || excluded(e.target)) return
      start = { x: e.clientX, y: e.clientY, dragging: false }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!start || !e.isPrimary) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      if (!start.dragging) {
        if (Math.abs(dx) < SWIPE_START_PX) return
        if (Math.abs(dx) < Math.abs(dy) * 1.08) {
          start = null
          return
        }
        start.dragging = true
      }
      if (e.cancelable) e.preventDefault()
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!start || !e.isPrimary) {
        start = null
        return
      }
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      const ax = Math.abs(dx)
      const ay = Math.abs(dy)
      const current = tabRef.current
      if (start.dragging && ax >= SWIPE_COMMIT_PX && ax >= ay * 1.08) {
        if (dx < 0 && current === 'text') setTab('map')
        else if (dx > 0 && current === 'map') setTab('text')
      }
      start = null
    }

    const onPointerCancel = () => {
      start = null
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerCancel)
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [ref, setTab])
}
