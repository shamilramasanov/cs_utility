'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useT } from '@/i18n'
import { GRENADE_COLORS, GRENADE_EMOJIS, GRENADE_LABELS } from '@/lib/grenades'
import type { LineupFeedItem } from '@/lib/lineup-feed-types'
import { lineupFeedDetailHref } from '@/lib/lineup-feed-nav'
import {
  HOME_RETURN_FEED_ITEM_QUERY,
  HOME_RETURN_FEED_ITEM_STORAGE_KEY,
  HOME_RETURN_PANEL_NEWS,
  HOME_RETURN_PANEL_STORAGE_KEY,
} from '@/lib/home-return-panel'

const LONG_PRESS_MS = 280
const FAST_PLAYBACK_RATE = 2.5
const FEED_STACK_GAP_PX = 12
const HOME_BOTTOM_NAV_SELECTOR = '[data-home-bottom-nav]'
/** Запас, пока не измерился нижний nav */
const FEED_BOTTOM_PAD_FALLBACK_PX = 72
const FEED_CARD =
  'overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-[0_8px_28px_rgba(0,0,0,0.35)]'

interface Props {
  items: LineupFeedItem[]
  /** Вкладка «Новинки» на экране — иначе видео на паузе */
  panelActive?: boolean
}

export default function HomeNewsFeed({ items, panelActive = true }: Props) {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const restoreFeedPendingRef = useRef<string | null>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const slideRefs = useRef<(HTMLElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)
  const snapRafRef = useRef<number | null>(null)
  const [slideHeightPx, setSlideHeightPx] = useState(0)
  const slideHeightPxRef = useRef(slideHeightPx)
  slideHeightPxRef.current = slideHeightPx
  const [slideBottomPadPx, setSlideBottomPadPx] = useState(
    FEED_BOTTOM_PAD_FALLBACK_PX + FEED_STACK_GAP_PX,
  )

  useLayoutEffect(() => {
    const root = scrollerRef.current
    if (!root) return

    const measureScroller = () => {
      const h = root.clientHeight
      if (h > 0) setSlideHeightPx(h)
    }

    const measureBottomPad = () => {
      const nav = document.querySelector(HOME_BOTTOM_NAV_SELECTOR)
      const navH = nav ? Math.ceil(nav.getBoundingClientRect().height) : FEED_BOTTOM_PAD_FALLBACK_PX
      setSlideBottomPadPx(navH + FEED_STACK_GAP_PX)
    }

    const measureAll = () => {
      measureScroller()
      measureBottomPad()
    }

    measureAll()
    const ro = new ResizeObserver(measureAll)
    ro.observe(root)
    const nav = document.querySelector(HOME_BOTTOM_NAV_SELECTOR)
    if (nav) ro.observe(nav)
    window.addEventListener('resize', measureAll, { passive: true })
    window.visualViewport?.addEventListener('resize', measureAll)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measureAll)
      window.visualViewport?.removeEventListener('resize', measureAll)
    }
  }, [])

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  const updateActiveFromScroll = useCallback(() => {
    const root = scrollerRef.current
    if (!root) return
    const mid = root.getBoundingClientRect().top + root.clientHeight * 0.45
    let best = 0
    let bestDist = Infinity
    slideRefs.current.forEach((el, i) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      const center = r.top + r.height / 2
      const d = Math.abs(center - mid)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    if (best !== activeIndexRef.current) {
      activeIndexRef.current = best
      setActiveIndex(best)
    }
  }, [])

  const onScroll = useCallback(() => {
    if (snapRafRef.current !== null) return
    snapRafRef.current = window.requestAnimationFrame(() => {
      snapRafRef.current = null
      updateActiveFromScroll()
    })
  }, [updateActiveFromScroll])

  useEffect(() => {
    return () => {
      if (snapRafRef.current !== null) window.cancelAnimationFrame(snapRafRef.current)
    }
  }, [])

  const scrollToFeedItem = useCallback((feedId: string): boolean => {
    const index = itemsRef.current.findIndex((i) => i.id === feedId)
    if (index < 0) return false
    const root = scrollerRef.current
    const height = slideHeightPxRef.current
    if (!root || height <= 0) return false
    root.scrollTop = index * height
    activeIndexRef.current = index
    setActiveIndex(index)
    return true
  }, [])

  const returnFeedItemId = searchParams.get(HOME_RETURN_FEED_ITEM_QUERY)

  useLayoutEffect(() => {
    let feedId: string | null = restoreFeedPendingRef.current
    if (!feedId) {
      try {
        feedId =
          returnFeedItemId ?? sessionStorage.getItem(HOME_RETURN_FEED_ITEM_STORAGE_KEY)
      } catch {
        /* noop */
      }
    }
    if (!feedId) return

    if (!scrollToFeedItem(feedId)) {
      restoreFeedPendingRef.current = feedId
      return
    }

    restoreFeedPendingRef.current = null
    try {
      sessionStorage.removeItem(HOME_RETURN_FEED_ITEM_STORAGE_KEY)
    } catch {
      /* noop */
    }
  }, [returnFeedItemId, items.length, slideHeightPx])

  const openDetail = useCallback(
    (item: LineupFeedItem) => {
      try {
        sessionStorage.setItem(HOME_RETURN_PANEL_STORAGE_KEY, HOME_RETURN_PANEL_NEWS)
        sessionStorage.setItem(HOME_RETURN_FEED_ITEM_STORAGE_KEY, item.id)
      } catch {
        /* noop */
      }
      router.push(lineupFeedDetailHref(item))
    },
    [router],
  )

  if (!items.length) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-app-screen pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-8 text-center">
        <span className="mb-3 text-4xl" aria-hidden>
          ✨
        </span>
        <h2 className="text-lg font-bold">{t('home.newsTab.title')}</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#888]">{t('home.newsTab.empty')}</p>
      </div>
    )
  }

  return (
    <div
      ref={scrollerRef}
      className="no-scrollbar h-full min-h-0 w-full flex-1 snap-y snap-mandatory overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
      style={{ scrollSnapType: 'y mandatory' }}
      onScroll={onScroll}
    >
      {items.map((item, index) => (
        <NewsFeedSlide
          key={item.id}
          ref={(el) => {
            slideRefs.current[index] = el
          }}
          item={item}
          isActive={panelActive && activeIndex === index}
          slideHeightPx={slideHeightPx}
          slideBottomPadPx={slideBottomPadPx}
          onOpen={() => openDetail(item)}
        />
      ))}
    </div>
  )
}

interface SlideProps {
  item: LineupFeedItem
  isActive: boolean
  slideHeightPx: number
  slideBottomPadPx: number
  onOpen: () => void
}

const NewsFeedSlide = forwardRef<HTMLElement, SlideProps>(function NewsFeedSlide(
  { item, isActive, slideHeightPx, slideBottomPadPx, onOpen },
  ref,
) {
  const t = useT()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)
  const [fastForward, setFastForward] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressTapRef = useRef(false)
  const fastForwardRef = useRef(false)

  const color = GRENADE_COLORS[item.type]
  const typeLabel = GRENADE_LABELS[item.type]
  const emoji = GRENADE_EMOJIS[item.type]
  /** «Подпись в шите» из админки — откуда бросаем; positionLabel — точка на карте каталога */
  const throwFromLabel = item.variantLabel?.trim() || null

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const stopFastForward = useCallback(() => {
    const v = videoRef.current
    if (v) v.playbackRate = 1
    fastForwardRef.current = false
    setFastForward(false)
  }, [])

  const startFastForward = useCallback(() => {
    const v = videoRef.current
    if (!v || !isActive) return
    suppressTapRef.current = true
    v.playbackRate = FAST_PLAYBACK_RATE
    fastForwardRef.current = true
    setFastForward(true)
    setPaused(false)
    void v.play().catch(() => {})
  }, [isActive])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    clearLongPressTimer()
    stopFastForward()
    suppressTapRef.current = false
    v.playbackRate = 1
    v.currentTime = 0
    if (isActive) {
      setPaused(false)
      void v.play().catch(() => {})
    } else {
      v.pause()
      setPaused(false)
    }
  }, [isActive, item.videoUrl, clearLongPressTimer, stopFastForward])

  useEffect(() => {
    return () => clearLongPressTimer()
  }, [clearLongPressTimer])

  const onVideoPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive || e.button !== 0) return
    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(startFastForward, LONG_PRESS_MS)
  }

  const endPointerGesture = () => {
    clearLongPressTimer()
    if (fastForwardRef.current) stopFastForward()
  }

  const onVideoClick = () => {
    if (!isActive) return
    if (suppressTapRef.current) {
      suppressTapRef.current = false
      return
    }
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      void v.play().catch(() => {})
      setPaused(false)
    } else {
      v.pause()
      setPaused(true)
    }
  }

  const slideStyle =
    slideHeightPx > 0
      ? { height: slideHeightPx, minHeight: slideHeightPx, maxHeight: slideHeightPx }
      : { height: '100%', minHeight: '100%' }

  return (
    <article
      ref={ref}
      className="box-border grid shrink-0 snap-start snap-always grid-rows-[minmax(0,1fr)_auto] px-app-screen pt-3"
      style={{
        ...slideStyle,
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        gap: FEED_STACK_GAP_PX,
        paddingBottom: slideBottomPadPx,
      }}
    >
      <div
        role="button"
        tabIndex={isActive ? 0 : -1}
        aria-pressed={paused}
        aria-label={paused ? t('home.newsTab.playVideo') : t('home.newsTab.pauseVideo')}
        className={`relative isolate h-full min-h-0 w-full overflow-hidden touch-manipulation select-none outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#F0B429]/55 ${FEED_CARD}`}
        onClick={onVideoClick}
        onPointerDown={onVideoPointerDown}
        onPointerUp={endPointerGesture}
        onPointerCancel={endPointerGesture}
        onPointerLeave={endPointerGesture}
      >
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a0a0a]">
          <video
            ref={videoRef}
            src={item.videoUrl}
            className={`pointer-events-none relative z-0 h-full w-full object-cover transition-opacity duration-150 ease-out ${
              isActive ? 'opacity-100' : 'opacity-40'
            }`}
            muted
            playsInline
            disablePictureInPicture
            loop
            preload="metadata"
          />
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] bg-gradient-to-b from-black/85 via-black/55 to-transparent px-3 pb-10 pt-3 [transform:translate3d(0,0,1px)] [-webkit-transform:translate3d(0,0,1px)]"
          aria-hidden
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white [transform:translate3d(0,0,2px)] [-webkit-transform:translate3d(0,0,2px)]">
            <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${color}44`, color }}>
              {emoji} {typeLabel}
            </span>
            <span className="text-white/95">{item.mapName}</span>
            {throwFromLabel ? (
              <span className="text-white/80">· {throwFromLabel}</span>
            ) : item.positionLabel ? (
              <span className="text-white/80">
                · {t('home.newsTab.positionFrom', { position: item.positionLabel })}
              </span>
            ) : null}
          </div>
        </div>

        {paused && isActive ? (
          <span
            className="pointer-events-none absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 pl-0.5 text-xl text-white shadow-lg backdrop-blur-sm"
            aria-hidden
          >
            ▶
          </span>
        ) : null}

        {fastForward && isActive ? (
          <span
            className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-black/65 px-2.5 py-1 text-xs font-bold text-[#F0B429] backdrop-blur-sm"
            aria-hidden
          >
            {t('home.newsTab.fastForwardBadge')}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className={`w-full p-4 text-left outline-none transition-[transform,opacity] duration-150 ease-out [-webkit-tap-highlight-color:transparent] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#F0B429]/55 ${FEED_CARD} ${
          isActive ? 'translate-y-0 opacity-100' : 'opacity-75'
        }`}
        aria-label={t('home.newsTab.openLineup', { title: item.title })}
      >
        <h3 className="text-lg font-bold leading-snug text-white">{item.title}</h3>
        <p className="throw-method-attention mt-3 w-full rounded-xl border-2 border-[#3ecf6e]/45 bg-[#102015] px-3 py-3 text-center text-[15px] font-bold leading-snug text-white sm:text-base">
          {t('home.newsTab.throwMethodWithLabel', { method: item.throwMethodLabel })}
        </p>
        {item.methodHint ? (
          <p className="mt-2 text-base font-semibold leading-snug text-white">{item.methodHint}</p>
        ) : item.description && item.description !== item.methodHint ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#ddd]">{item.description}</p>
        ) : (
          <p className="mt-2 text-sm text-[#666]">{t('home.newsTab.noThrowHint')}</p>
        )}
        <p className="mt-3 text-xs font-semibold text-[#F0B429]">{t('home.newsTab.tapForDetails')}</p>
      </button>
    </article>
  )
})
