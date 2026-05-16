'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  HOME_RETURN_FEED_ITEM_QUERY,
  HOME_RETURN_FEED_ITEM_STORAGE_KEY,
  HOME_RETURN_PANEL_NEWS,
  HOME_RETURN_PANEL_QUERY,
  HOME_RETURN_PANEL_SEARCH,
  HOME_RETURN_PANEL_STORAGE_KEY,
} from '@/lib/home-return-panel'
import Image from 'next/image'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocale, useT } from '@/i18n'
import type { Grenade, MapData } from '@/types'
import type { MapPosition } from '@/types/positions'
import { getMap } from '@/lib/grenades'
import { countGrenadesForPosition, pickPositionCardLineupPhoto } from '@/lib/positions'
import { getZoneIdForPositionOnSide } from '@/lib/position-zones'
import type { SideKey } from '@/lib/side'
import { isSideMatch } from '@/lib/side'
import { lockHorizontalSwipeScroll, unlockHorizontalSwipeScroll } from '@/lib/horizontal-swipe-scroll-lock'
import {
  pickLocalizedLabel,
  positionMatchesSearch,
} from '@/lib/i18n-helpers'
import { usePositionOverrides } from '@/lib/usePositionOverrides'
import { PositionPhotoCard } from '@/components/PositionPhotoGrid'
import { APP_SEARCH_ICON_SRC, SearchInputLeadingIcon } from '@/components/SearchInputLeadingIcon'
import HomeActiveMeetPreview from '@/components/HomeActiveMeetPreview'
import HomeNewsFeed from '@/components/HomeNewsFeed'
import type { LineupFeedItem } from '@/lib/lineup-feed-types'
import { closeActiveMeetLocally, getActiveMeetResumePath, loadActiveMeet } from '@/lib/meet'
import type { Meet } from '@/types/meet'

const TAB_COUNT = 4
const NAV_SWIPE_START_PX = 8
const NAV_SWIPE_COMMIT_PX = 36
const NAV_SWIPE_COMMIT_RATIO = 0.22
const NAV_TRACK_TRANSITION = 'transform 320ms cubic-bezier(0.22, 0.72, 0.18, 1)'
/** Иконки нижней навигации — `public/nav/*.png` */
const NAV_ICON_SRC = [
  APP_SEARCH_ICON_SRC,
  '/nav/home-maps.png',
  '/nav/home-tactics.png',
  '/nav/home-news.png',
] as const

interface MapEntry {
  map: MapData
  grenadeCount: number
}

interface Props {
  mapsWithCounts: MapEntry[]
  grenadesByMap: Record<string, Grenade[]>
  positionCatalog: MapPosition[]
  lineupFeedItems: LineupFeedItem[]
}

type SearchHit = {
  pos: MapPosition
  sideKey: SideKey
  count: number
  mapName: string
}

export default function HomeContent({
  mapsWithCounts,
  grenadesByMap,
  positionCatalog,
  lineupFeedItems,
}: Props) {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const lang = useLocale()
  const { screenshotFor } = usePositionOverrides()
  const trackRef = useRef<HTMLDivElement>(null)
  const homeTrackRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [activeIndex, setActiveIndex] = useState(1)
  const activeIndexRef = useRef(activeIndex)
  const panelWidthPercent = 100 / TAB_COUNT
  const navRafRef = useRef<number | null>(null)
  const navPendingOffsetRef = useRef(0)
  const navSwipeStartRef = useRef<{
    x: number
    y: number
    activeIndex: number
    width: number
    dragging: boolean
  } | null>(null)
  const ignoreHomeClickRef = useRef(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const setHomeTrackTransform = useCallback(
    (index: number, offsetPx: number, transition?: string) => {
      const el = homeTrackRef.current
      if (!el) return
      if (transition !== undefined) el.style.transition = transition
      el.style.transform = `translate3d(calc(${-index * panelWidthPercent}% + ${offsetPx}px), 0, 0)`
    },
    [panelWidthPercent],
  )

  const cancelNavRaf = useCallback(() => {
    if (navRafRef.current === null) return
    window.cancelAnimationFrame(navRafRef.current)
    navRafRef.current = null
  }, [])

  const scheduleHomeDragFrame = useCallback(
    (index: number, offsetPx: number) => {
      navPendingOffsetRef.current = offsetPx
      if (navRafRef.current !== null) return
      navRafRef.current = window.requestAnimationFrame(() => {
        navRafRef.current = null
        setHomeTrackTransform(index, navPendingOffsetRef.current, 'none')
      })
    },
    [setHomeTrackTransform],
  )

  const settleHomeTrack = useCallback(
    (index: number) => {
      cancelNavRaf()
      setHomeTrackTransform(index, 0, NAV_TRACK_TRANSITION)
    },
    [cancelNavRaf, setHomeTrackTransform],
  )

  useLayoutEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 140)
    return () => window.clearTimeout(id)
  }, [query])

  useLayoutEffect(() => {
    const panelFromUrl = searchParams.get(HOME_RETURN_PANEL_QUERY)
    if (panelFromUrl === HOME_RETURN_PANEL_NEWS) {
      const feedItemId = searchParams.get(HOME_RETURN_FEED_ITEM_QUERY)
      if (feedItemId) {
        try {
          sessionStorage.setItem(HOME_RETURN_FEED_ITEM_STORAGE_KEY, feedItemId)
        } catch {
          /* private mode / quota */
        }
      }
      setActiveIndex(3)
      settleHomeTrack(3)
      try {
        // Не удаляем ключ до очистки URL: после router.replace('/') эффект снова
        // сработает без query — ветка sessionStorage ниже удержит вкладку «Новинки».
        sessionStorage.setItem(HOME_RETURN_PANEL_STORAGE_KEY, HOME_RETURN_PANEL_NEWS)
      } catch {
        /* private mode / quota */
      }
      router.replace('/', { scroll: false })
      return
    }

    let restoreSearch = false
    let savedQuery = ''
    try {
      const returnPanel = sessionStorage.getItem(HOME_RETURN_PANEL_STORAGE_KEY)
      if (returnPanel === HOME_RETURN_PANEL_SEARCH) {
        restoreSearch = true
        savedQuery = sessionStorage.getItem('cs2-home-search-query') ?? ''
        sessionStorage.removeItem(HOME_RETURN_PANEL_STORAGE_KEY)
        sessionStorage.removeItem('cs2-home-search-query')
      } else if (returnPanel === HOME_RETURN_PANEL_NEWS) {
        sessionStorage.removeItem(HOME_RETURN_PANEL_STORAGE_KEY)
        setActiveIndex(3)
        settleHomeTrack(3)
        return
      }
    } catch {
      /* private mode / quota */
    }
    const panel = restoreSearch ? 0 : 1
    setActiveIndex(panel)
    settleHomeTrack(panel)
    if (restoreSearch) {
      setQuery(savedQuery)
      setDebouncedQuery(savedQuery.trim())
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [router, searchParams, settleHomeTrack])

  const resumePathRef = useRef<string | null>(null)
  const [activeMeet, setActiveMeet] = useState<Meet | null>(null)

  useEffect(() => {
    const meet = loadActiveMeet()
    const path = getActiveMeetResumePath()
    resumePathRef.current = path
    setActiveMeet(meet)
    if (path) router.prefetch(path)
  }, [router])

  const openActiveMeet = useCallback(() => {
    const path = resumePathRef.current ?? getActiveMeetResumePath()
    if (path) router.push(path)
  }, [router])

  const dismissActiveMeet = useCallback(() => {
    closeActiveMeetLocally()
    resumePathRef.current = null
    setActiveMeet(null)
  }, [])

  const scrollToPanel = useCallback((index: number) => {
    const i = Math.max(0, Math.min(TAB_COUNT - 1, index))
    setActiveIndex(i)
    if (i === 0) {
      searchInputRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    const commitDistanceFor = (width: number) =>
      Math.max(NAV_SWIPE_COMMIT_PX, width * NAV_SWIPE_COMMIT_RATIO)

    const dragOffsetFor = (start: NonNullable<typeof navSwipeStartRef.current>, dx: number) => {
      const hasPrev = start.activeIndex > 0
      const hasNext = start.activeIndex < TAB_COUNT - 1
      const edgeDamped = (dx > 0 && !hasPrev) || (dx < 0 && !hasNext)
      const raw = edgeDamped ? dx * 0.28 : dx
      return Math.max(-start.width, Math.min(start.width, raw))
    }

    const finishNavSwipe = (clientX: number, clientY: number) => {
      const start = navSwipeStartRef.current
      navSwipeStartRef.current = null
      unlockHorizontalSwipeScroll()
      if (!start) {
        settleHomeTrack(activeIndexRef.current)
        return
      }
      if (start.dragging) {
        ignoreHomeClickRef.current = true
        window.setTimeout(() => {
          ignoreHomeClickRef.current = false
        }, 400)
      }

      const dx = clientX - start.x
      const dy = clientY - start.y
      const ax = Math.abs(dx)
      const ay = Math.abs(dy)
      if (!start.dragging && (ax < NAV_SWIPE_COMMIT_PX || ax < ay * 1.08)) {
        settleHomeTrack(start.activeIndex)
        return
      }

      const offset = dragOffsetFor(start, dx)
      const commitDistance = commitDistanceFor(start.width)
      const next = offset < -commitDistance ? start.activeIndex + 1 : offset > commitDistance ? start.activeIndex - 1 : start.activeIndex
      if (next < 0 || next >= TAB_COUNT || next === start.activeIndex) {
        settleHomeTrack(start.activeIndex)
        return
      }
      settleHomeTrack(next)
      setActiveIndex(next)
      if (next === 0) searchInputRef.current?.focus()
    }

    const onPointerDownCapture = (e: PointerEvent) => {
      if (!e.isPrimary) return
      if (e.target instanceof Element && e.target.closest('[data-home-global-swipe-ignore]')) {
        navSwipeStartRef.current = null
        return
      }
      const width = trackRef.current?.clientWidth || window.innerWidth || 1
      navSwipeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        activeIndex: activeIndexRef.current,
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
        if (ax < NAV_SWIPE_START_PX) return
        if (ax < ay * 1.08) {
          navSwipeStartRef.current = null
          return
        }
        start.dragging = true
        lockHorizontalSwipeScroll()
        setHomeTrackTransform(start.activeIndex, 0, 'none')
      }
      if (e.cancelable) e.preventDefault()
      scheduleHomeDragFrame(start.activeIndex, dragOffsetFor(start, dx))
    }

    const onPointerUpCapture = (e: PointerEvent) => {
      if (!e.isPrimary) return
      finishNavSwipe(e.clientX, e.clientY)
    }

    const onPointerCancelCapture = () => {
      const index = navSwipeStartRef.current?.activeIndex ?? activeIndexRef.current
      navSwipeStartRef.current = null
      unlockHorizontalSwipeScroll()
      settleHomeTrack(index)
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
  }, [cancelNavRaf, scheduleHomeDragFrame, setHomeTrackTransform, settleHomeTrack])

  const navLabels = useMemo(
    () => [
      t('home.nav.search'),
      t('home.nav.maps'),
      t('home.nav.tactics'),
      t('home.nav.news'),
    ],
    [t],
  )

  const searchHits = useMemo((): SearchHit[] => {
    if (!debouncedQuery) return []
    const hits: SearchHit[] = []
    for (const pos of positionCatalog) {
      if (pos.parent_id) continue
      const catLabel = t(`position.category.${pos.category}` as const)
      if (!positionMatchesSearch(pos, debouncedQuery, [catLabel])) continue
      const g = grenadesByMap[pos.map] ?? []
      const mapName = getMap(pos.map)?.display_name ?? pos.map
      const tryPush = (sk: SideKey) => {
        const filt = g.filter((x) => isSideMatch(x.side, sk))
        const c = countGrenadesForPosition(filt, pos, positionCatalog)
        if (c <= 0) return
        hits.push({ pos, sideKey: sk, count: c, mapName })
      }
      if (pos.side === 'T') tryPush('t')
      else if (pos.side === 'CT') tryPush('ct')
      else {
        tryPush('t')
        tryPush('ct')
      }
    }
    hits.sort((a, b) => {
      if (a.mapName !== b.mapName) return a.mapName.localeCompare(b.mapName)
      return pickLocalizedLabel(a.pos, lang).localeCompare(
        pickLocalizedLabel(b.pos, lang),
      )
    })
    return hits
  }, [debouncedQuery, grenadesByMap, lang, positionCatalog, t])

  const homeTrackStyle = useMemo(
    () => ({
      width: `${TAB_COUNT * 100}%`,
      transform: `translate3d(${-activeIndex * panelWidthPercent}%, 0, 0)`,
      transition: NAV_TRACK_TRANSITION,
      willChange: 'transform',
    }),
    [activeIndex, panelWidthPercent],
  )
  const homePanelStyle = useMemo(
    () => ({ width: `${panelWidthPercent}%` }),
    [panelWidthPercent],
  )

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col bg-[#0d0d0d]">
      <div
        ref={trackRef}
        className="flex min-h-0 w-full min-w-0 max-w-full flex-1 overflow-hidden"
        style={{ touchAction: 'pan-y' }}
        onClickCapture={(e) => {
          if (!ignoreHomeClickRef.current) return
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <div ref={homeTrackRef} className="flex h-full min-h-0 shrink-0" style={homeTrackStyle}>
        <section className="flex h-full min-h-0 shrink-0 grow-0 flex-col" style={homePanelStyle} aria-hidden={activeIndex !== 0}>
            <div className="no-scrollbar min-h-0 w-full max-w-full flex-1 overflow-y-auto overscroll-y-contain px-app-screen pt-3 pb-[calc(8.1rem+env(safe-area-inset-bottom,0px))] [-webkit-overflow-scrolling:touch]">
            <div className="relative">
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('position.search')}
                className="mb-2 h-11 w-full rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] pl-10 pr-3 text-sm placeholder:text-[#555] focus:border-[#444] focus:outline-none"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                spellCheck={false}
              />
              <SearchInputLeadingIcon />
            </div>
            <p className="mb-3 text-[11px] leading-snug text-[#666]">
              {debouncedQuery ? t('home.globalSearch.resultsHint') : t('home.globalSearch.hint')}
            </p>
            {!debouncedQuery ? null : searchHits.length === 0 ? (
              <p className="pt-8 text-center text-sm text-[#666]">{t('common.nothingFound')}</p>
            ) : (
              <ul className="grid w-full list-none grid-cols-2 gap-3 p-0 pb-2">
                {searchHits.map((h, hitIdx) => {
                  const label = pickLocalizedLabel(h.pos, lang)
                  const zoneId = getZoneIdForPositionOnSide(
                    h.pos.map,
                    h.pos.id,
                    h.sideKey,
                    positionCatalog,
                  )
                  const href = `/map/${h.pos.map}?side=${h.sideKey}&zone=${encodeURIComponent(zoneId)}&pos=${encodeURIComponent(h.pos.id)}`
                  const singlePill = h.sideKey === 't' ? 'T' : 'CT'
                  const filt = (grenadesByMap[h.pos.map] ?? []).filter((x) => isSideMatch(x.side, h.sideKey))
                  const lineupPhoto = pickPositionCardLineupPhoto(filt, h.pos, positionCatalog)
                  const photo =
                    screenshotFor(h.pos.id, undefined) ?? lineupPhoto ?? h.pos.screenshot_url
                  return (
                    <li key={`${h.pos.map}-${h.pos.id}-${h.sideKey}`} className="min-w-0">
                      <PositionPhotoCard
                        pos={h.pos}
                        mapLabel={h.mapName}
                        photo={photo}
                        imagePriority={hitIdx < 6}
                        label={label}
                        count={h.count}
                        empty={h.count === 0}
                        side={h.pos.side}
                        singlePill={h.pos.side === 'both' ? singlePill : undefined}
                        onPick={() => {}}
                        href={href}
                        onBeforeClientNavigate={() => {
                          try {
                            sessionStorage.setItem(HOME_RETURN_PANEL_STORAGE_KEY, HOME_RETURN_PANEL_SEARCH)
                            sessionStorage.setItem('cs2-home-search-query', query)
                          } catch {
                            /* noop */
                          }
                        }}
                        noPhotoLabel={t('position.noPhoto')}
                        soonLabel={t('common.soon')}
                      />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="flex h-full min-h-0 shrink-0 grow-0 flex-col" style={homePanelStyle} aria-hidden={activeIndex !== 1}>
            <div className="no-scrollbar min-h-0 w-full max-w-full flex-1 overflow-y-auto overscroll-y-contain px-app-screen pt-3 pb-[calc(8.1rem+env(safe-area-inset-bottom,0px))] [-webkit-overflow-scrolling:touch]">
            <div className="grid grid-cols-2 gap-3">
              {mapsWithCounts.map(({ map, grenadeCount }, idx) => (
                <Link key={map.id} href={`/map/${map.id}`} prefetch>
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#1a1a1a] transition-transform active:scale-95">
                    <Image
                      src={`/minimaps/${map.radar}`}
                      alt={map.display_name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      priority={idx < 4}
                      className="object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="text-base font-bold">{map.display_name}</div>
                      <div className="mt-0.5 text-xs text-[#888]">
                        {grenadeCount > 0
                          ? t('home.lineupsCount', { count: grenadeCount })
                          : t('home.grenadesEmpty')}
                      </div>
                    </div>
                    {map.layers.length > 1 && (
                      <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-[#F0B429]">
                        {t('home.twoLayers')}
                      </div>
                    )}
                    {grenadeCount === 0 && (
                      <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-[#888]">
                        {t('home.grenadesEmpty')}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 pb-2 text-center text-xs text-[#555]">
              {t('home.footerHint')}
            </div>
          </div>
        </section>

        <section className="flex h-full min-h-0 shrink-0 grow-0 flex-col" style={homePanelStyle} aria-hidden={activeIndex !== 2}>
          {activeMeet ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-app-screen pb-[calc(8.1rem+env(safe-area-inset-bottom,0px))] pt-6">
              <h2 className="mb-1 text-center text-lg font-bold">{t('home.tacticsTab.title')}</h2>
              <p className="mb-5 max-w-sm text-center text-sm leading-relaxed text-[#888]">
                {t('home.tacticsTab.hint')}
              </p>
              <HomeActiveMeetPreview
                meet={activeMeet}
                onOpen={openActiveMeet}
                onClose={dismissActiveMeet}
              />
              <button
                type="button"
                data-home-global-swipe-ignore
                onClick={() => router.push('/team?create=1')}
                className="mt-4 flex h-12 w-full max-w-sm items-center justify-center rounded-xl border border-[#333] text-sm font-semibold text-[#ccc] transition-colors active:scale-[0.98] hover:border-[#444] hover:text-white"
              >
                {t('home.tacticsTab.createNewMeet')}
              </button>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-app-screen pb-[calc(8.1rem+env(safe-area-inset-bottom,0px))] pt-8 text-center">
              <span className="mb-3 text-4xl" aria-hidden>
                ⚡
              </span>
              <h2 className="text-lg font-bold">{t('home.tacticsTab.title')}</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#888]">
                {t('home.tacticsTab.hint')}
              </p>
              <p className="mt-3 max-w-sm text-sm text-[#666]">{t('home.teamCta.description')}</p>
              <button
                type="button"
                data-home-global-swipe-ignore
                onClick={() => router.push('/team?create=1')}
                className="mt-6 flex h-14 w-full max-w-sm items-center justify-center rounded-xl bg-[#F0B429] text-base font-bold text-black"
              >
                {t('home.teamCta.create')}
              </button>
              <Link
                href="/team"
                data-home-global-swipe-ignore
                className="mt-3 flex h-12 w-full max-w-sm items-center justify-center rounded-xl border border-[#333] text-sm font-semibold text-[#ccc]"
              >
                {t('team.join')}
              </Link>
            </div>
          )}
        </section>

        <section
          className="flex h-full min-h-0 min-w-0 shrink-0 grow-0 flex-col overflow-hidden"
          style={homePanelStyle}
          aria-hidden={activeIndex !== 3}
        >
          <HomeNewsFeed items={lineupFeedItems} />
        </section>
        </div>
      </div>

      <nav
        data-home-bottom-nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pt-1 sm:px-4"
        style={{
          paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))',
        }}
        aria-label={t('home.nav.ariaLabel')}
      >
        <div
          data-home-global-swipe-ignore
          className="pointer-events-auto mx-auto inline-flex max-w-[min(calc(100vw-2.25rem),29rem)] shrink-0 gap-1 rounded-[1.14rem] border border-white/[0.08] bg-black/78 px-1.5 py-1 shadow-[0_10px_34px_rgba(0,0,0,0.52)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/65"
          role="tablist"
        >
          {navLabels.map((label, i) => {
            const active = i === activeIndex
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={label}
                title={label}
                onClick={() => scrollToPanel(i)}
                className={`flex shrink-0 touch-manipulation items-center justify-center rounded-[0.6rem] px-0.5 py-0.5 outline-none transition-colors duration-300 ease-[cubic-bezier(0.25,0.85,0.35,1)] [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#F0B429]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] ${
                  active ? 'text-[#F0B429]' : 'text-white/85 active:text-white'
                }`}
              >
                <span
                  className={`box-border flex min-h-12 items-center rounded-[1.05rem] transition-[border-color,padding,gap] duration-300 ease-out ${
                    active
                      ? 'w-auto max-w-none gap-1.5 border-2 border-[#F0B429] px-1.5 py-0.5'
                      : 'size-12 shrink-0 justify-center border-2 border-transparent'
                  }`}
                >
                  <span className="flex size-[calc(36px*1.2)] shrink-0 items-center justify-center">
                    <img
                      src={NAV_ICON_SRC[i]}
                      alt=""
                      width={38}
                      height={38}
                      loading="eager"
                      decoding="async"
                      draggable={false}
                      className={`block h-[calc(32px*1.2)] w-[calc(32px*1.2)] object-contain object-center select-none transition-opacity duration-300 ease-out ${
                        active ? 'opacity-100' : 'opacity-[0.9]'
                      }`}
                    />
                  </span>
                  {active && (
                    <span
                      className="max-w-[6.9rem] truncate text-left text-[12px] font-black uppercase leading-none tracking-wide sm:max-w-none sm:overflow-visible sm:whitespace-nowrap"
                      aria-hidden
                    >
                      {label}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
