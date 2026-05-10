'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useT } from '@/i18n'
import type { Grenade, MapData } from '@/types'
import type { MapPosition } from '@/types/positions'
import { sideKeyToSide } from '@/lib/side'
import { mergeGrenadesByDestination } from '@/lib/grenade-destinations'
import BottomSheet from './BottomSheet'
import PositionPhotoGrid from './PositionPhotoGrid'
import PositionPickerFilterBar, { type PickerNadeFilter, type PickerTeamFilter } from './PositionPickerFilterBar'
import PositionPickerList from './PositionPickerList'

export interface PositionNavigationLinks {
  /** Возврат на предыдущий шаг (например, выбор зоны). */
  backHref: string
  pickPosition: (positionId: string) => string
}

const TAB_KEYS = ['map', 'photos', 'list'] as const
type PickerTabKey = (typeof TAB_KEYS)[number]

interface Props {
  map: MapData
  /** Сторона сегмента «T / CT» (для раскидок на радаре при team !== any). */
  pickerTeam: PickerTeamFilter
  onPickerTeamChange: (t: PickerTeamFilter) => void
  /** Зарезервировано под будущий выбор позиции из списка/карточек. */
  positions?: MapPosition[]
  grenades: Grenade[]
  positionCatalog?: MapPosition[]
  onPick: (positionId: string) => void
  onBack: () => void
  navigationLinks?: PositionNavigationLinks
  /** Фильтр гранат — состояние в родителе, чтобы не терять при уходе на экран позиции и назад. */
  nadeFilter: PickerNadeFilter
  onNadeFilterChange: (f: PickerNadeFilter) => void
}

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#121212]" />,
})

const PICKER_NAV_ICON_SRC = [
  '/nav/home-maps.png',
  '/nav/picker-photos.png',
  '/nav/picker-list.png',
] as const

function PickerNavIconImg({ index, active }: { index: 0 | 1 | 2; active: boolean }) {
  const [failed, setFailed] = useState(false)
  const emoji = (['🗺', '🖼', '📋'] as const)[index]
  if (failed) {
    return (
      <span className={`text-[1.38rem] leading-none ${active ? '' : 'opacity-[0.9]'}`} aria-hidden>
        {emoji}
      </span>
    )
  }
  return (
    <img
      src={PICKER_NAV_ICON_SRC[index]}
      alt=""
      width={38}
      height={38}
      loading="eager"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={`block h-[calc(32px*1.2)] w-[calc(32px*1.2)] max-h-[calc(32px*1.2)] max-w-[calc(32px*1.2)] object-contain object-center select-none transition-opacity duration-300 ease-out ${
        active ? 'opacity-100' : 'opacity-[0.9]'
      }`}
    />
  )
}

/**
 * Карта + фильтры; вкладки «Карточки / Список» переключаются, но без старого тяжёлого контента
 * (никакой горизонтальной карусели — только одна активная панель, без мигания соседних карточек).
 */
export default function PositionSelector({
  map,
  pickerTeam,
  onPickerTeamChange,
  positions,
  grenades,
  positionCatalog,
  onPick,
  navigationLinks,
  nadeFilter,
  onNadeFilterChange,
}: Props) {
  const t = useT()
  const searchParams = useSearchParams()

  /**
   * Локальный state, чтобы переключение было мгновенным.
   * Раньше это шло через `router.replace(?tab=...)`, что на `force-dynamic`
   * странице карты заставляло сервер заново тащить данные и перерендеривать всё
   * дерево — вкладка переключалась с задержкой в секунды.
   * Параметр `?tab=` всё равно нужен (чтобы возврат с экрана позиции восстановил
   * правильную вкладку), поэтому синхронизируем его «тихо» через `history.replaceState`.
   */
  const [panelIndex, setPanelIndexState] = useState<number>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'photos') return 1
    if (tab === 'list') return 2
    return 0
  })

  /** Browser back/forward или внешняя навигация на тот же URL → подхватываем `?tab=`. */
  useEffect(() => {
    const tab = searchParams.get('tab')
    const next = tab === 'photos' ? 1 : tab === 'list' ? 2 : 0
    setPanelIndexState((prev) => (prev === next ? prev : next))
  }, [searchParams])

  const setPanelIndex = useCallback((idx: number) => {
    const i = Math.max(0, Math.min(2, idx))
    setPanelIndexState((prev) => (prev === i ? prev : i))
    if (typeof window === 'undefined') return
    const key = TAB_KEYS[i] satisfies PickerTabKey
    const url = new URL(window.location.href)
    if (key === 'map') url.searchParams.delete('tab')
    else url.searchParams.set('tab', key)
    const nextHref = `${url.pathname}${url.search}${url.hash}`
    if (nextHref === `${window.location.pathname}${window.location.search}${window.location.hash}`) return
    window.history.replaceState(window.history.state, '', nextHref)
  }, [])

  const pickerNavLabels = useMemo(
    () => [t('position.tab.map'), t('position.tab.photos'), t('position.tab.list')],
    [t],
  )

  const catalog = positionCatalog ?? []
  const rootPositions = useMemo(
    () => (positions ?? []).filter((p) => !p.parent_id),
    [positions],
  )
  const pickHrefRaw = navigationLinks?.pickPosition

  /**
   * `pickHref` строится в родителе на основании `useSearchParams()`. Поскольку мы
   * меняем `?tab=` через `history.replaceState` (минуя роутер), родитель про
   * текущий `tab` не знает. Подменяем `tab` в готовой ссылке локальным значением,
   * чтобы возврат с экрана позиции вернул именно ту вкладку, на которой был user.
   */
  const pickHref = useCallback(
    (positionId: string): string | undefined => {
      if (!pickHrefRaw) return undefined
      const base = pickHrefRaw(positionId)
      if (!base) return base
      const qIdx = base.indexOf('?')
      const path = qIdx === -1 ? base : base.slice(0, qIdx)
      const sp = new URLSearchParams(qIdx === -1 ? '' : base.slice(qIdx + 1))
      const key = TAB_KEYS[panelIndex]
      if (key === 'map') sp.delete('tab')
      else sp.set('tab', key)
      const qs = sp.toString()
      return qs ? `${path}?${qs}` : path
    },
    [pickHrefRaw, panelIndex],
  )

  const panelIndexRef = useRef(panelIndex)
  useLayoutEffect(() => {
    panelIndexRef.current = panelIndex
  }, [panelIndex])

  const navSwipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const ignoreNavTabClicksRef = useRef(false)
  /** Синхронно с MapView: при зуме > 1 свайп по карте не переключает вкладки (пан/пинч). */
  const mapPickerZoomRef = useRef(1)

  const applyNavSwipe = useCallback(
    (clientX: number, clientY: number) => {
      const start = navSwipeStartRef.current
      navSwipeStartRef.current = null
      if (!start) return
      const dx = clientX - start.x
      const dy = clientY - start.y
      const ax = Math.abs(dx)
      const ay = Math.abs(dy)
      if (ax < 36) return
      if (ax < ay * 1.08) return
      const i = panelIndexRef.current
      const next = dx < 0 ? i + 1 : i - 1
      if (next < 0 || next > 2 || next === i) return
      ignoreNavTabClicksRef.current = true
      window.setTimeout(() => {
        ignoreNavTabClicksRef.current = false
      }, 400)
      setPanelIndex(next)
    },
    [setPanelIndex],
  )

  useEffect(() => {
    const swipeExcluded = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false
      if (target.closest('[data-picker-global-swipe-ignore]')) return true
      if (target.closest('.map-container')) {
        return mapPickerZoomRef.current > 1.001
      }
      return false
    }
    const onPointerDownCapture = (e: PointerEvent) => {
      if (!e.isPrimary) return
      if (swipeExcluded(e.target)) {
        navSwipeStartRef.current = null
        return
      }
      navSwipeStartRef.current = { x: e.clientX, y: e.clientY }
    }
    const onPointerUpCapture = (e: PointerEvent) => {
      if (!e.isPrimary) return
      applyNavSwipe(e.clientX, e.clientY)
    }
    const onPointerCancelCapture = () => {
      navSwipeStartRef.current = null
    }
    window.addEventListener('pointerdown', onPointerDownCapture, true)
    window.addEventListener('pointerup', onPointerUpCapture, true)
    window.addEventListener('pointercancel', onPointerCancelCapture, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDownCapture, true)
      window.removeEventListener('pointerup', onPointerUpCapture, true)
      window.removeEventListener('pointercancel', onPointerCancelCapture, true)
    }
  }, [applyNavSwipe])

  const pickerFiltersAnchorRef = useRef<HTMLDivElement>(null)
  const [lineupOverlayTopPx, setLineupOverlayTopPx] = useState(0)

  const [activeLayer, setActiveLayer] = useState(0)
  const currentLayer = map.layers[activeLayer]
  const [selectedGrenade, setSelectedGrenade] = useState<Grenade | null>(null)
  const [mapPreviewGrenade, setMapPreviewGrenade] = useState<Grenade | null>(null)
  const [activeThrowVariantIndex, setActiveThrowVariantIndex] = useState(0)

  useEffect(() => {
    if (panelIndex !== 0) {
      setSelectedGrenade(null)
      setMapPreviewGrenade(null)
    }
  }, [panelIndex])

  const mapGrenades = useMemo(() => {
    let g = grenades.filter((x) => !x.layer_file || x.layer_file === currentLayer.file)
    if (pickerTeam !== 'any') {
      const letter = sideKeyToSide(pickerTeam)
      g = g.filter((x) => x.side === letter || x.side === 'both')
    }
    if (nadeFilter !== 'all') {
      g = g.filter((x) => x.type === nadeFilter)
    }
    return mergeGrenadesByDestination(g)
  }, [grenades, currentLayer.file, pickerTeam, nadeFilter])

  /** Смена T/CT/все или типа гранаты — сбрасываем выбор, если он больше не в списке (иначе «висят» маркеры чужой стороны). */
  useEffect(() => {
    setSelectedGrenade((prev) => (prev && mapGrenades.some((x) => x.id === prev.id) ? prev : null))
    setMapPreviewGrenade((prev) => (prev && mapGrenades.some((x) => x.id === prev.id) ? prev : null))
  }, [mapGrenades])

  useEffect(() => {
    setMapPreviewGrenade((g) => {
      if (!g) return null
      if (g.layer_file && g.layer_file !== currentLayer.file) return null
      return g
    })
  }, [currentLayer.file])

  useEffect(() => {
    setSelectedGrenade((g) => {
      if (!g) return null
      if (g.layer_file && g.layer_file !== currentLayer.file) return null
      return g
    })
  }, [currentLayer.file])

  const updateLineupOverlayTop = useCallback(() => {
    const el = pickerFiltersAnchorRef.current
    if (!el) return
    setLineupOverlayTopPx(el.getBoundingClientRect().bottom)
  }, [])

  useLayoutEffect(() => {
    if (!selectedGrenade) return
    updateLineupOverlayTop()
  }, [selectedGrenade, currentLayer.file, map.layers.length, panelIndex, updateLineupOverlayTop])

  useEffect(() => {
    if (!selectedGrenade) return
    updateLineupOverlayTop()
    const el = pickerFiltersAnchorRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(updateLineupOverlayTop)
    ro.observe(el)
    window.addEventListener('resize', updateLineupOverlayTop)
    window.addEventListener('orientationchange', updateLineupOverlayTop)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateLineupOverlayTop)
      window.removeEventListener('orientationchange', updateLineupOverlayTop)
    }
  }, [selectedGrenade, updateLineupOverlayTop])

  /** Стабильные callbacks — иначе `MapView` (и любая будущая `React.memo`) перерисуется на каждый ререндер. */
  const handleMapZoomChange = useCallback((z: number) => {
    mapPickerZoomRef.current = z
  }, [])

  const handleMapThrowVariantSelect = useCallback((g: Grenade, idx: number) => {
    setMapPreviewGrenade(null)
    setSelectedGrenade(g)
    setActiveThrowVariantIndex(idx)
  }, [])

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-[#0d0d0d]">
      <div ref={pickerFiltersAnchorRef} className="shrink-0">
        <PositionPickerFilterBar
          nadeFilter={nadeFilter}
          onNadeChange={onNadeFilterChange}
          team={pickerTeam}
          onTeamChange={onPickerTeamChange}
        />

        {panelIndex === 0 && map.layers.length > 1 && (
          <div className="relative flex justify-end px-app-screen pb-2">
            <button
              type="button"
              onClick={() => setActiveLayer((l) => (l + 1) % map.layers.length)}
              className="h-9 rounded-full bg-[#1a1a1a] px-3 text-xs font-medium text-[#F0B429] transition-transform active:scale-95"
            >
              {currentLayer.label} · {t('map.layerToggle')}
            </button>
          </div>
        )}
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative flex min-h-0 flex-1 flex-col px-app-screen pt-1 pb-[max(5.5rem,env(safe-area-inset-bottom,0px)+4.5rem)]">
          {panelIndex === 0 && (
            <div
              className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#262626] bg-[#121212]"
              role="region"
              aria-label={map.display_name}
            >
              <MapView
                mapTitle={map.display_name}
                onZoomChange={handleMapZoomChange}
                radarFile={currentLayer.file}
                grenades={mapGrenades}
                previewGrenade={mapPreviewGrenade}
                onPreviewChange={setMapPreviewGrenade}
                selectedGrenade={selectedGrenade}
                onSelect={setSelectedGrenade}
                onThrowVariantSelect={handleMapThrowVariantSelect}
                imagePosition={selectedGrenade ? 'top' : 'center'}
                activeThrowVariantIndex={activeThrowVariantIndex}
              />
              {selectedGrenade && <div className="pointer-events-none absolute inset-0 bg-black/18" />}
            </div>
          )}

          {panelIndex === 1 && (
            <div
              className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#262626] bg-[#121212]"
              role="region"
              aria-label={t('position.tab.photos')}
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <PositionPhotoGrid
                  positions={rootPositions}
                  grenades={mapGrenades}
                  positionCatalog={catalog}
                  onPick={onPick}
                  pickHref={pickHref}
                  hideEmpty={nadeFilter !== 'all'}
                />
              </div>
            </div>
          )}

          {panelIndex === 2 && (
            <div
              className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#262626] bg-[#121212]"
              role="region"
              aria-label={t('position.tab.list')}
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <PositionPickerList
                  positions={rootPositions}
                  grenades={mapGrenades}
                  positionCatalog={catalog}
                  onPick={onPick}
                  pickHref={pickHref}
                  hideEmpty={nadeFilter !== 'all'}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pt-1 sm:px-4"
        style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))' }}
        aria-label={t('position.pickerNav.ariaLabel')}
      >
        <div
          className="pointer-events-auto mx-auto inline-flex min-h-[3.25rem] max-w-[min(calc(100vw-2.25rem),24rem)] shrink-0 touch-pan-x items-center gap-1 rounded-[1.14rem] border border-white/[0.08] bg-black/78 px-1.5 py-1 shadow-[0_10px_34px_rgba(0,0,0,0.52)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/65"
          role="tablist"
        >
          {pickerNavLabels.map((label, i) => {
            const active = i === panelIndex
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={label}
                title={label}
                onClick={() => {
                  if (ignoreNavTabClicksRef.current) return
                  setPanelIndex(i)
                }}
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
                    <PickerNavIconImg index={i as 0 | 1 | 2} active={active} />
                  </span>
                  {active && (
                    <span
                      className="whitespace-nowrap text-left text-[12px] font-black uppercase leading-none tracking-wide"
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

      {selectedGrenade && panelIndex === 0 && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[200]"
          style={{
            top: Math.max(lineupOverlayTopPx, 56),
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div
            className="pointer-events-auto mx-auto h-full min-h-0 max-w-[980px] overflow-hidden rounded-t-2xl border-t border-x border-[#2b2b2b] bg-[#141414]/92 backdrop-blur-md shadow-2xl"
            data-picker-global-swipe-ignore
          >
            <BottomSheet
              grenade={selectedGrenade}
              onClose={() => {
                const g = selectedGrenade
                setSelectedGrenade(null)
                if (g) setMapPreviewGrenade(g)
              }}
              panel
              activeThrowVariantIndex={activeThrowVariantIndex}
              onThrowVariantIndexChange={setActiveThrowVariantIndex}
            />
          </div>
        </div>
      )}
    </div>
  )
}
