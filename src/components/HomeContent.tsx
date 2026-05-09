'use client'

import Link from 'next/link'
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
import {
  pickLocalizedLabel,
  positionMatchesSearch,
} from '@/lib/i18n-helpers'
import { usePositionOverrides } from '@/lib/usePositionOverrides'
import { PositionPhotoCard } from '@/components/PositionPhotoGrid'
import { APP_SEARCH_ICON_SRC, SearchInputLeadingIcon } from '@/components/SearchInputLeadingIcon'

const TAB_COUNT = 4
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
}

type SearchHit = {
  pos: MapPosition
  sideKey: SideKey
  count: number
  mapName: string
}

export default function HomeContent({ mapsWithCounts, grenadesByMap, positionCatalog }: Props) {
  const t = useT()
  const lang = useLocale()
  const { screenshotFor } = usePositionOverrides()
  const trackRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [activeIndex, setActiveIndex] = useState(1)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 260)
    return () => window.clearTimeout(id)
  }, [query])

  useLayoutEffect(() => {
    const el = trackRef.current
    if (!el) return
    let restoreSearch = false
    let savedQuery = ''
    try {
      if (sessionStorage.getItem('cs2-home-return-panel') === 'search') {
        restoreSearch = true
        savedQuery = sessionStorage.getItem('cs2-home-search-query') ?? ''
        sessionStorage.removeItem('cs2-home-return-panel')
        sessionStorage.removeItem('cs2-home-search-query')
      }
    } catch {
      /* private mode / quota */
    }
    const apply = () => {
      const w = el.clientWidth
      if (!w) {
        requestAnimationFrame(apply)
        return
      }
      const panel = restoreSearch ? 0 : 1
      el.scrollLeft = w * panel
      setActiveIndex(panel)
      if (restoreSearch) {
        setQuery(savedQuery)
        setDebouncedQuery(savedQuery.trim())
        requestAnimationFrame(() => searchInputRef.current?.focus())
      }
    }
    apply()
  }, [])

  const scrollToPanel = useCallback((index: number) => {
    const el = trackRef.current
    if (!el) return
    const w = el.clientWidth
    if (!w) return
    const i = Math.max(0, Math.min(TAB_COUNT - 1, index))
    /** Без smooth — иначе debounce snap и scroll дают подёргивание при клике. */
    el.scrollLeft = i * w
    setActiveIndex(i)
    if (i === 0) {
      // Сразу в обработчике tap — иначе iOS/Android не показывают клавиатуру после setTimeout/rAF
      searchInputRef.current?.focus()
    }
  }, [])

  const snapToNearestPage = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const w = el.clientWidth
    if (!w) return
    const idx = Math.round(el.scrollLeft / w)
    const clamped = Math.max(0, Math.min(TAB_COUNT - 1, idx))
    const target = clamped * w
    if (Math.abs(el.scrollLeft - target) < 1) {
      setActiveIndex(clamped)
      return
    }
    el.scrollTo({ left: target, behavior: 'auto' })
    setActiveIndex(clamped)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    let raf = 0
    let debounceTimer = 0

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth || 1
        const i = Math.round(el.scrollLeft / w)
        setActiveIndex(Math.max(0, Math.min(TAB_COUNT - 1, i)))
      })
      window.clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(() => snapToNearestPage(), 280)
    }

    const onScrollEnd = () => {
      window.clearTimeout(debounceTimer)
      snapToNearestPage()
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('scrollend', onScrollEnd as EventListener)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(debounceTimer)
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('scrollend', onScrollEnd as EventListener)
    }
  }, [snapToNearestPage])

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

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col bg-[#0d0d0d]">
      <div
        ref={trackRef}
        className="flex min-h-0 w-full min-w-0 max-w-full flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ touchAction: 'pan-x' }}
      >
        <section className="flex h-full min-h-0 w-full shrink-0 grow-0 basis-full snap-start snap-always flex-col">
            <div className="min-h-0 w-full max-w-full flex-1 overflow-y-auto overscroll-y-contain px-app-screen pt-3 pb-[calc(8.1rem+env(safe-area-inset-bottom,0px))] [-webkit-overflow-scrolling:touch]">
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
                {searchHits.map((h) => {
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
                        label={label}
                        count={h.count}
                        empty={h.count === 0}
                        side={h.pos.side}
                        singlePill={h.pos.side === 'both' ? singlePill : undefined}
                        onPick={() => {}}
                        href={href}
                        onBeforeClientNavigate={() => {
                          try {
                            sessionStorage.setItem('cs2-home-return-panel', 'search')
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

        <section className="flex h-full min-h-0 w-full shrink-0 grow-0 basis-full snap-start snap-always flex-col">
            <div className="min-h-0 w-full max-w-full flex-1 overflow-y-auto overscroll-y-contain px-app-screen pt-3 pb-[calc(8.1rem+env(safe-area-inset-bottom,0px))] [-webkit-overflow-scrolling:touch]">
            <div className="grid grid-cols-2 gap-3">
              {mapsWithCounts.map(({ map, grenadeCount }) => (
                <Link key={map.id} href={`/map/${map.id}`}>
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#1a1a1a] transition-transform active:scale-95">
                    <img
                      src={`/minimaps/${map.radar}`}
                      alt={map.display_name}
                      className="h-full w-full object-cover opacity-60"
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

        <section className="flex h-full min-h-0 w-full shrink-0 grow-0 basis-full snap-start snap-always flex-col">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-app-screen pb-[calc(8.1rem+env(safe-area-inset-bottom,0px))] pt-8 text-center">
            <span className="mb-3 text-4xl" aria-hidden>
              ⚡
            </span>
            <h2 className="text-lg font-bold">{t('home.tacticsTab.title')}</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#888]">
              {t('home.tacticsTab.hint')}
            </p>
          </div>
        </section>

        <section className="flex h-full min-h-0 w-full shrink-0 grow-0 basis-full snap-start snap-always flex-col">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-app-screen pb-[calc(8.1rem+env(safe-area-inset-bottom,0px))] pt-8 text-center">
            <span className="mb-3 text-4xl" aria-hidden>
              ✨
            </span>
            <h2 className="text-lg font-bold">{t('home.newsTab.title')}</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#888]">
              {t('home.newsTab.hint')}
            </p>
          </div>
        </section>
      </div>

      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pt-1 sm:px-4"
        style={{
          paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))',
        }}
        aria-label={t('home.nav.ariaLabel')}
      >
        <div
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
