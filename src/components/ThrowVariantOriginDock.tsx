'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '@/i18n'

interface Props {
  count: number
  activeIndex: number
  onChange: (i: number) => void
  labels?: string[]
  /**
   * `fixed` у низа экрана + отступы как у навбара режимов карты (portal на body).
   */
  pinToScreenBottom?: boolean
  /**
   * Плавающее меню внутри родителя с `position: relative`.
   */
  overlay?: boolean
  overlayPositionClass?: string
}

const SWIPE_MIN = 36

function isDominantHorizontal(dx: number, dy: number): boolean {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax < SWIPE_MIN) return false
  return ax >= ay * 1.08
}

/**
 * Свайп: touch-сессия слушает `window` (touchmove/end), чтобы жест не съедался скроллом.
 * Без pointer capture и без touch-none — тап по кнопкам работает как обычно.
 */
export default function ThrowVariantOriginDock({
  count,
  activeIndex,
  onChange,
  labels,
  pinToScreenBottom = false,
  overlay = false,
  overlayPositionClass = 'bottom-[6rem] z-30',
}: Props) {
  const t = useT()
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    setPortalReady(pinToScreenBottom)
  }, [pinToScreenBottom])

  const buttonsWrapRef = useRef<HTMLDivElement>(null)
  const skipNextClickRef = useRef(false)
  const windowCleanupRef = useRef<(() => void) | null>(null)
  const mouseUpHandlerRef = useRef<((ev: MouseEvent) => void) | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const clamped = Math.max(0, Math.min(count - 1, activeIndex))

  const trySwipeNavigate = useCallback(
    (dx: number, dy: number): boolean => {
      if (count < 2 || !isDominantHorizontal(dx, dy)) return false
      if (dx < 0 && clamped < count - 1) {
        skipNextClickRef.current = true
        onChange(clamped + 1)
        return true
      }
      if (dx > 0 && clamped > 0) {
        skipNextClickRef.current = true
        onChange(clamped - 1)
        return true
      }
      return false
    },
    [clamped, count, onChange],
  )

  const scrollActiveIntoView = useCallback(() => {
    const wrap = buttonsWrapRef.current
    if (!wrap || count <= 0) return
    const btn = wrap.querySelector<HTMLElement>(`[data-variant-idx="${clamped}"]`)
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [clamped, count])

  useEffect(() => {
    scrollActiveIntoView()
  }, [scrollActiveIntoView])

  useEffect(
    () => () => {
      windowCleanupRef.current?.()
      windowCleanupRef.current = null
      if (mouseUpHandlerRef.current) {
        window.removeEventListener('mouseup', mouseUpHandlerRef.current)
        mouseUpHandlerRef.current = null
      }
    },
    [],
  )

  const teardownWindowTouches = useCallback(() => {
    windowCleanupRef.current?.()
    windowCleanupRef.current = null
  }, [])

  const beginWindowTouchSwipe = useCallback(
    (touchId: number, x0: number, y0: number) => {
      teardownWindowTouches()

      let lastX = x0
      let lastY = y0

      const onMove = (ev: TouchEvent) => {
        for (let i = 0; i < ev.touches.length; i++) {
          const tch = ev.touches[i]
          if (tch.identifier === touchId) {
            lastX = tch.clientX
            lastY = tch.clientY
            break
          }
        }
      }

      const onEnd = (ev: TouchEvent) => {
        for (let i = 0; i < ev.changedTouches.length; i++) {
          const c = ev.changedTouches[i]
          if (c.identifier !== touchId) continue
          teardownWindowTouches()
          const dx = c.clientX - x0
          const dy = c.clientY - y0
          trySwipeNavigate(dx, dy)
          return
        }
        teardownWindowTouches()
        trySwipeNavigate(lastX - x0, lastY - y0)
      }

      const onCancel = () => {
        teardownWindowTouches()
      }

      window.addEventListener('touchmove', onMove as EventListener, { passive: true })
      window.addEventListener('touchend', onEnd as EventListener, { passive: true })
      window.addEventListener('touchcancel', onCancel, { passive: true })

      windowCleanupRef.current = () => {
        window.removeEventListener('touchmove', onMove as EventListener)
        window.removeEventListener('touchend', onEnd as EventListener)
        window.removeEventListener('touchcancel', onCancel)
      }
    },
    [teardownWindowTouches, trySwipeNavigate],
  )

  /** Старт жеста на плашке: вешаем window, не блокируя клики по кнопкам */
  const onTouchStartBubble = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const tch = e.touches[0]
    touchStartRef.current = { x: tch.clientX, y: tch.clientY }
    beginWindowTouchSwipe(tch.identifier, tch.clientX, tch.clientY)
  }

  /** Фолбек свайпа напрямую через touch-события тулбара (для WebView, где window-touch нестабилен). */
  const onTouchMoveToolbar = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !touchStartRef.current) return
    const tch = e.touches[0]
    const dx = tch.clientX - touchStartRef.current.x
    const dy = tch.clientY - touchStartRef.current.y
    if (trySwipeNavigate(dx, dy)) {
      touchStartRef.current = { x: tch.clientX, y: tch.clientY }
    }
  }

  const onTouchEndToolbar = () => {
    touchStartRef.current = null
  }

  const onMouseDownToolbar = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    if (mouseUpHandlerRef.current) {
      window.removeEventListener('mouseup', mouseUpHandlerRef.current)
      mouseUpHandlerRef.current = null
    }
    const x0 = e.clientX
    const y0 = e.clientY
    const up = (ev: MouseEvent) => {
      if (mouseUpHandlerRef.current) {
        window.removeEventListener('mouseup', mouseUpHandlerRef.current)
        mouseUpHandlerRef.current = null
      }
      trySwipeNavigate(ev.clientX - x0, ev.clientY - y0)
    }
    mouseUpHandlerRef.current = up
    window.addEventListener('mouseup', up)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' && clamped < count - 1) {
      e.preventDefault()
      onChange(clamped + 1)
    } else if (e.key === 'ArrowLeft' && clamped > 0) {
      e.preventDefault()
      onChange(clamped - 1)
    }
  }

  const onNumberTap = useCallback(
    (i: number) => {
      if (skipNextClickRef.current) {
        skipNextClickRef.current = false
        return
      }
      onChange(i)
    },
    [onChange],
  )

  const toolbarEl = (
    <div
      tabIndex={0}
      role="toolbar"
      onTouchStart={onTouchStartBubble}
      onTouchMove={onTouchMoveToolbar}
      onTouchEnd={onTouchEndToolbar}
      onMouseDown={onMouseDownToolbar}
      onKeyDown={onKeyDown}
      className="pointer-events-auto mx-auto inline-flex max-w-[min(calc(100vw-2.25rem),24rem)] shrink-0 gap-1 rounded-[1.14rem] border border-white/[0.08] bg-black px-1.5 py-1 shadow-[0_10px_34px_rgba(0,0,0,0.52)]"
      style={
        overlay && !pinToScreenBottom
          ? {
              paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))',
            }
          : undefined
      }
    >
      <div
        ref={buttonsWrapRef}
        className="flex max-w-full flex-wrap justify-center gap-1 [overflow-anchor:none]"
      >
        {Array.from({ length: count }, (_, i) => {
          const active = i === clamped
          const title = `${i + 1} позиция`
          return (
            <button
              key={i}
              type="button"
              data-variant-idx={i}
              title={title}
              aria-label={title}
              aria-pressed={active}
              onClick={() => onNumberTap(i)}
              className={`flex shrink-0 touch-manipulation items-center justify-center rounded-[0.6rem] px-0.5 py-0.5 outline-none transition-colors duration-300 ease-[cubic-bezier(0.25,0.85,0.35,1)] [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#F0B429]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] ${
                active ? 'text-[#F0B429]' : 'text-white/85 active:text-white'
              }`}
            >
              <span
                className={`box-border flex min-h-12 items-center justify-center rounded-[1.05rem] transition-[border-color,padding,gap,width] duration-300 ease-out ${
                  active
                    ? 'max-w-none gap-1.5 border-2 border-[#F0B429] px-1.5 py-0.5'
                    : 'size-12 shrink-0 border-2 border-transparent'
                }`}
              >
                <span className="shrink-0 text-[12px] font-black leading-none tracking-wide sm:text-[13px]">
                  {active ? `${i + 1} позиция` : i + 1}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )

  if (pinToScreenBottom && portalReady && typeof document !== 'undefined') {
    return createPortal(
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[260] flex justify-center px-3 pt-1 sm:px-4"
        style={{
          paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))',
        }}
        aria-label={t('throwOrigin.variantDockAria')}
      >
        {toolbarEl}
      </nav>,
      document.body,
    )
  }

  if (pinToScreenBottom) return null

  const navClass = overlay
    ? `pointer-events-none absolute inset-x-0 flex justify-center px-3 pt-1 sm:px-4 ${overlayPositionClass}`
    : 'pointer-events-none flex shrink-0 justify-center px-3 pt-1 sm:px-4'

  return (
    <nav className={navClass} aria-label={t('throwOrigin.variantDockAria')}>
      {toolbarEl}
    </nav>
  )
}
