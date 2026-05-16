'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { lockHorizontalSwipeScroll, unlockHorizontalSwipeScroll } from '@/lib/horizontal-swipe-scroll-lock'
import {
  HORIZONTAL_PANEL_TRACK_TRANSITION,
  setHorizontalPanelTrackTransform,
} from '@/lib/horizontal-panel-track'

const SWIPE_START_PX = 6
const SWIPE_COMMIT_PX = 28
const SWIPE_COMMIT_RATIO = 0.18

/** @deprecated используйте HORIZONTAL_PANEL_TRACK_TRANSITION */
export const PANEL_TRACK_TRANSITION = HORIZONTAL_PANEL_TRACK_TRANSITION

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
  const draggingRef = useRef(false)
  const navSwipeStartRef = useRef<{
    x: number
    y: number
    panelIndex: number
    width: number
    dragging: boolean
  } | null>(null)
  const ignoreClickRef = useRef(false)

  const viewportWidth = useCallback(
    () => containerRef.current?.clientWidth || window.innerWidth || 1,
    [containerRef],
  )

  const setTrackTransform = useCallback(
    (index: number, offsetPx: number, transition?: string) => {
      setHorizontalPanelTrackTransform(
        trackRef.current,
        index,
        viewportWidth(),
        offsetPx,
        transition,
      )
    },
    [trackRef, viewportWidth],
  )

  const settleTrack = useCallback(
    (index: number) => {
      setTrackTransform(index, 0, HORIZONTAL_PANEL_TRACK_TRANSITION)
    },
    [setTrackTransform],
  )

  const goToPanel = useCallback(
    (index: number) => {
      const i = Math.max(0, Math.min(panelCount - 1, index))
      draggingRef.current = false
      onActiveIndexChange(i)
      settleTrack(i)
    },
    [onActiveIndexChange, panelCount, settleTrack],
  )

  useLayoutEffect(() => {
    activeIndexRef.current = activeIndex
    if (draggingRef.current) return
    settleTrack(activeIndex)
  }, [activeIndex, settleTrack])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'transform') el.style.willChange = ''
    }
    el.addEventListener('transitionend', onEnd)
    return () => el.removeEventListener('transitionend', onEnd)
  }, [trackRef])

  useEffect(() => {
    const onResize = () => {
      if (!draggingRef.current) settleTrack(activeIndexRef.current)
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [settleTrack])

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
      draggingRef.current = false
      unlockHorizontalSwipeScroll()
      if (!start) {
        settleTrack(activeIndexRef.current)
        return
      }
      if (start.dragging) {
        ignoreClickRef.current = true
        window.setTimeout(() => {
          ignoreClickRef.current = false
        }, 250)
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
      const width = viewportWidth()
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
        draggingRef.current = true
        lockHorizontalSwipeScroll()
        setTrackTransform(start.panelIndex, 0, 'none')
      }
      if (e.cancelable) e.preventDefault()
      setTrackTransform(start.panelIndex, dragOffsetFor(start, dx), 'none')
    }

    const onPointerUpCapture = (e: PointerEvent) => {
      if (!e.isPrimary) return
      finishSwipe(e.clientX, e.clientY)
    }

    const onPointerCancelCapture = () => {
      const index = navSwipeStartRef.current?.panelIndex ?? activeIndexRef.current
      navSwipeStartRef.current = null
      draggingRef.current = false
      unlockHorizontalSwipeScroll()
      settleTrack(index)
    }

    window.addEventListener('pointerdown', onPointerDownCapture, true)
    window.addEventListener('pointermove', onPointerMoveCapture, true)
    window.addEventListener('pointerup', onPointerUpCapture, true)
    window.addEventListener('pointercancel', onPointerCancelCapture, true)
    return () => {
      unlockHorizontalSwipeScroll()
      window.removeEventListener('pointerdown', onPointerDownCapture, true)
      window.removeEventListener('pointermove', onPointerMoveCapture, true)
      window.removeEventListener('pointerup', onPointerUpCapture, true)
      window.removeEventListener('pointercancel', onPointerCancelCapture, true)
    }
  }, [containerRef, excludeSelector, goToPanel, panelCount, settleTrack, setTrackTransform, viewportWidth])

  const trackStyle = useMemo(
    () => ({
      width: `${panelCount * 100}%`,
    }),
    [panelCount],
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
