'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { lockHorizontalSwipeScroll, unlockHorizontalSwipeScroll } from '@/lib/horizontal-swipe-scroll-lock'

const SWIPE_START_PX = 8
const SWIPE_COMMIT_PX = 36
const SWIPE_COMMIT_RATIO = 0.22
export const PANEL_TRACK_TRANSITION = 'transform 320ms cubic-bezier(0.22, 0.72, 0.18, 1)'

interface Options {
  panelCount: number
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  containerRef: RefObject<HTMLElement | null>
  trackRef: RefObject<HTMLElement | null>
  excludeSelector?: string
}

export function useHorizontalPanelSwipe({
  panelCount,
  activeIndex,
  onActiveIndexChange,
  containerRef,
  trackRef,
  excludeSelector = '[data-panel-swipe-ignore]',
}: Options) {
  const activeIndexRef = useRef(activeIndex)
  const panelWidthPercent = 100 / panelCount
  const navRafRef = useRef<number | null>(null)
  const navPendingOffsetRef = useRef(0)
  const navSwipeStartRef = useRef<{
    x: number
    y: number
    panelIndex: number
    width: number
    dragging: boolean
  } | null>(null)
  const ignoreClickRef = useRef(false)

  useLayoutEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  const setTrackTransform = useCallback(
    (index: number, offsetPx: number, transition?: string) => {
      const el = trackRef.current
      if (!el) return
      if (transition !== undefined) el.style.transition = transition
      el.style.transform = `translate3d(calc(${-index * panelWidthPercent}% + ${offsetPx}px), 0, 0)`
    },
    [panelWidthPercent, trackRef],
  )

  const cancelNavRaf = useCallback(() => {
    if (navRafRef.current === null) return
    window.cancelAnimationFrame(navRafRef.current)
    navRafRef.current = null
  }, [])

  const scheduleDragFrame = useCallback(
    (index: number, offsetPx: number) => {
      navPendingOffsetRef.current = offsetPx
      if (navRafRef.current !== null) return
      navRafRef.current = window.requestAnimationFrame(() => {
        navRafRef.current = null
        setTrackTransform(index, navPendingOffsetRef.current, 'none')
      })
    },
    [setTrackTransform],
  )

  const settleTrack = useCallback(
    (index: number) => {
      cancelNavRaf()
      setTrackTransform(index, 0, PANEL_TRACK_TRANSITION)
    },
    [cancelNavRaf, setTrackTransform],
  )

  const goToPanel = useCallback(
    (index: number) => {
      const i = Math.max(0, Math.min(panelCount - 1, index))
      onActiveIndexChange(i)
      settleTrack(i)
    },
    [onActiveIndexChange, panelCount, settleTrack],
  )

  useEffect(() => {
    settleTrack(activeIndex)
  }, [activeIndex, settleTrack])

  useEffect(() => {
    const dragOffsetFor = (start: NonNullable<typeof navSwipeStartRef.current>, dx: number) => {
      const hasPrev = start.panelIndex > 0
      const hasNext = start.panelIndex < panelCount - 1
      const edgeDamped = (dx > 0 && !hasPrev) || (dx < 0 && !hasNext)
      const raw = edgeDamped ? dx * 0.28 : dx
      return Math.max(-start.width, Math.min(start.width, raw))
    }

    const finishSwipe = (clientX: number, clientY: number) => {
      const start = navSwipeStartRef.current
      navSwipeStartRef.current = null
      unlockHorizontalSwipeScroll()
      if (!start) {
        settleTrack(activeIndexRef.current)
        return
      }
      if (start.dragging) {
        ignoreClickRef.current = true
        window.setTimeout(() => {
          ignoreClickRef.current = false
        }, 400)
      }

      const dx = clientX - start.x
      const dy = clientY - start.y
      const ax = Math.abs(dx)
      const ay = Math.abs(dy)
      if (!start.dragging && (ax < SWIPE_COMMIT_PX || ax < ay * 1.08)) {
        settleTrack(start.panelIndex)
        return
      }

      const offset = dragOffsetFor(start, dx)
      const commitDistance = Math.max(SWIPE_COMMIT_PX, start.width * SWIPE_COMMIT_RATIO)
      const next =
        offset < -commitDistance
          ? start.panelIndex + 1
          : offset > commitDistance
            ? start.panelIndex - 1
            : start.panelIndex
      if (next < 0 || next >= panelCount || next === start.panelIndex) {
        settleTrack(start.panelIndex)
        return
      }
      goToPanel(next)
    }

    const onPointerDownCapture = (e: PointerEvent) => {
      if (!e.isPrimary) return
      if (e.target instanceof Element && e.target.closest(excludeSelector)) {
        navSwipeStartRef.current = null
        return
      }
      const width = containerRef.current?.clientWidth || window.innerWidth || 1
      navSwipeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panelIndex: activeIndexRef.current,
        width,
        dragging: false,
      }
    }

    const onPointerMoveCapture = (e: PointerEvent) => {
      if (!e.isPrimary) return
      const start = navSwipeStartRef.current
      if (!start) return

      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      const ax = Math.abs(dx)
      const ay = Math.abs(dy)
      if (!start.dragging) {
        if (ax < SWIPE_START_PX) return
        if (ax < ay * 1.08) {
          navSwipeStartRef.current = null
          return
        }
        start.dragging = true
        lockHorizontalSwipeScroll()
        setTrackTransform(start.panelIndex, 0, 'none')
      }
      if (e.cancelable) e.preventDefault()
      scheduleDragFrame(start.panelIndex, dragOffsetFor(start, dx))
    }

    const onPointerUpCapture = (e: PointerEvent) => {
      if (!e.isPrimary) return
      finishSwipe(e.clientX, e.clientY)
    }

    const onPointerCancelCapture = () => {
      const index = navSwipeStartRef.current?.panelIndex ?? activeIndexRef.current
      navSwipeStartRef.current = null
      unlockHorizontalSwipeScroll()
      settleTrack(index)
    }

    window.addEventListener('pointerdown', onPointerDownCapture, true)
    window.addEventListener('pointermove', onPointerMoveCapture, true)
    window.addEventListener('pointerup', onPointerUpCapture, true)
    window.addEventListener('pointercancel', onPointerCancelCapture, true)
    return () => {
      cancelNavRaf()
      unlockHorizontalSwipeScroll()
      window.removeEventListener('pointerdown', onPointerDownCapture, true)
      window.removeEventListener('pointermove', onPointerMoveCapture, true)
      window.removeEventListener('pointerup', onPointerUpCapture, true)
      window.removeEventListener('pointercancel', onPointerCancelCapture, true)
    }
  }, [
    cancelNavRaf,
    containerRef,
    excludeSelector,
    goToPanel,
    panelCount,
    scheduleDragFrame,
    setTrackTransform,
    settleTrack,
  ])

  const trackStyle = useMemo(
    () => ({
      width: `${panelCount * 100}%`,
      transform: `translate3d(${-activeIndex * panelWidthPercent}%, 0, 0)`,
      transition: PANEL_TRACK_TRANSITION,
      willChange: 'transform' as const,
    }),
    [activeIndex, panelCount, panelWidthPercent],
  )

  const panelStyle = useMemo(
    () => ({ width: `${panelWidthPercent}%` }),
    [panelWidthPercent],
  )

  return {
    trackStyle,
    panelStyle,
    goToPanel,
    ignoreClickRef,
  }
}
