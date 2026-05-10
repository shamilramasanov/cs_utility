'use client'

import {
  Suspense,
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { useRouter, useSearchParams, usePathname, type ReadonlyURLSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { getMap } from '@/lib/grenades'
import type { Grenade } from '@/types'
import type { MapPosition } from '@/types/positions'
import BottomSheet from './BottomSheet'
import MapCornerNameLabel from './MapCornerNameLabel'
import FilterBar from './FilterBar'
import { useLocale, useT } from '@/i18n'
import LineupGallery from './LineupGallery'
import { isSideMatch, parseSideKey, type SideKey } from '@/lib/side'
import {
  getAllPositionsForMap,
  getPositionById,
  getPositionsByMapAndSide,
  filterGrenadesByPosition,
  getSubspotsForPosition,
  countGrenadesForPosition,
} from '@/lib/positions'
import { pickLocalizedLabel } from '@/lib/i18n-helpers'
import MapPageLoadingFallback from '@/app/map/[mapId]/MapPageLoadingFallback'
import { mergeGrenadesByDestination } from '@/lib/grenade-destinations'
import { getDefaultZonesForPositions, getZoneIdForPositionOnSide } from '@/lib/position-zones'
import type { PositionZone } from '@/types/positions'
import { usePositionOverrides } from '@/lib/usePositionOverrides'
import type { PickerNadeFilter, PickerTeamFilter } from './PositionPickerFilterBar'
import {
  type MapPageInitialQuery,
  toURLSearchParamsFromMapQuery,
} from '@/lib/map-page-initial-query'
import { buildThrowOriginItems } from '@/lib/throw-origin-items'
import ThrowOriginPositionCards from './ThrowOriginPositionCards'

const mapViewFallback = <div className="h-full w-full bg-[#121212]" aria-hidden />
const panelFallback = <div className="h-full w-full bg-[#0d0d0d]" aria-hidden />

const positionSelectorFallback = (
  <div className="relative flex h-full min-h-0 w-full flex-1 flex-col bg-[#0d0d0d]">
    <div className="px-app-screen pb-1 pt-2">
      <div className="h-[3.25rem] rounded-2xl bg-[#161616]" aria-hidden />
    </div>
    <div className="flex min-h-0 min-w-0 flex-1 flex-col px-app-screen pt-0">
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#262626] bg-[#121212]" aria-hidden />
    </div>
  </div>
)

/**
 * Чанки с `dynamic({ ssr: false })` на сервере рендерят только `loading`,
 * а при гидрации сразу подставляют реальный компонент — React видит расхождение.
 * До `useEffect` держим тот же статичный плейсхолдер на сервере и на первом клиентском проходе.
 */
function AfterMount({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
  }, [])
  if (!ready) return <>{fallback}</>
  return <>{children}</>
}

const MapView = dynamic(() => import('./MapView'), {
  loading: () => mapViewFallback,
})

const SubspotPicker = dynamic(() => import('./SubspotPicker'), {
  loading: () => panelFallback,
})

const ThrowOriginGallery = dynamic(() => import('./ThrowOriginGallery'), {
  loading: () => panelFallback,
})

const PositionSelector = dynamic(() => import('./PositionSelector'), {
  loading: () => positionSelectorFallback,
})

/** См. `HomeContent` / `PositionPhotoCard`: переход с карточки глобального поиска. */
const HOME_SEARCH_RETURN_PANEL_KEY = 'cs2-home-return-panel'
const HOME_SEARCH_RETURN_VALUE = 'search'

const GRENADE_TYPES: Array<{ id: string; label: string; emoji: string }> = [
  { id: 'all', label: 'Все', emoji: '🎯' },
  { id: 'smoke', label: 'Smoke', emoji: '💨' },
  { id: 'flash', label: 'Flash', emoji: '⚡' },
  { id: 'molotov', label: 'Molotov', emoji: '🔥' },
  { id: 'he', label: 'HE', emoji: '💥' },
]

function parsePickerNadeParam(raw: string | null): PickerNadeFilter {
  if (raw === 'smoke' || raw === 'flash' || raw === 'molotov' || raw === 'he') return raw
  return 'all'
}

const pickerTeamStorageKey = (mapId: string) => `cs2gren:pickerTeam:${mapId}`

function readStoredPickerTeam(mapId: string): PickerTeamFilter | null {
  if (typeof window === 'undefined') return null
  try {
    const v = sessionStorage.getItem(pickerTeamStorageKey(mapId))
    if (v === 'any' || v === 'ct' || v === 't') return v
  } catch {
    /* quota / private mode */
  }
  return null
}

function writeStoredPickerTeam(mapId: string, team: PickerTeamFilter) {
  try {
    sessionStorage.setItem(pickerTeamStorageKey(mapId), team)
  } catch {
    /* ignore */
  }
}

/** Одинаковые пары ключ/значение в query — при гидрации используем `URLSearchParams` из RSC-снимка, без «другого» экземпляра из роутера. */
function urlSearchParamsShallowEqual(
  a: URLSearchParams,
  b: ReadonlyURLSearchParams | URLSearchParams,
): boolean {
  const ak = [...new Set(a.keys())]
  const bk = [...new Set(b.keys())]
  if (ak.length !== bk.length) return false
  const setB = new Set(bk)
  for (const k of ak) {
    if (!setB.has(k) || a.get(k) !== b.get(k)) return false
  }
  return true
}

interface Props {
  mapId: string
  initialGrenades: Grenade[]
  /** Слитый каталог (бандл + `position-catalog-extensions.json`). */
  positionCatalog: MapPosition[]
  /** Снимок query с серверного `page` — до `useEffect` строим тот же `URLSearchParams`, что и на SSR. */
  initialQuery: MapPageInitialQuery
}

function MapPageClientInner({ mapId, initialGrenades, positionCatalog, initialQuery }: Props) {
  const t = useT()
  const lang = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const routerSearchParams = useSearchParams()
  /** После монтирования берём живой хук; до — ту же строку query, что отдал RSC. */
  const [searchParamsFromRouter, setSearchParamsFromRouter] = useState(false)
  useEffect(() => {
    setSearchParamsFromRouter(true)
  }, [])
  const searchParams = useMemo(() => {
    const fromInitial = toURLSearchParamsFromMapQuery(initialQuery)
    if (!searchParamsFromRouter || !routerSearchParams) return fromInitial
    if (urlSearchParamsShallowEqual(fromInitial, routerSearchParams)) return fromInitial
    return routerSearchParams
  }, [initialQuery, routerSearchParams, searchParamsFromRouter])

  const map = getMap(mapId)!
  const posIdFromUrl = searchParams.get('pos')
  const spotIdFromUrl = searchParams.get('spot')
  const zoneIdFromUrl = searchParams.get('zone')
  const selectedPos = useMemo(
    () => (posIdFromUrl ? getPositionById(posIdFromUrl, positionCatalog) : undefined),
    [posIdFromUrl, positionCatalog],
  )
  /**
   * Локальные «зеркала» query-параметров `side` и `pnade`. Меняем их через
   * `setState` + `window.history.replaceState`, минуя Next-роутер: страница
   * `/map/[mapId]` помечена `force-dynamic`, и каждый `router.push/replace`
   * заставлял сервер заново тащить грантаты + каталог + перерендеривать всё
   * дерево, отчего фильтры лагали по 1–2 секунды.
   *
   * `useSearchParams()` остаётся источником правды при «настоящей» навигации
   * (тапы по позиции, back/forward, переходы извне) — синхронизируем
   * локальные state в effect ниже.
   */
  const [sideRaw, setSideRaw] = useState<string | null>(() => searchParams.get('side'))
  const [pnadeRaw, setPnadeRaw] = useState<string | null>(() => searchParams.get('pnade'))

  useEffect(() => {
    const s = searchParams.get('side')
    setSideRaw((prev) => (prev === s ? prev : s))
  }, [searchParams])

  useEffect(() => {
    const p = searchParams.get('pnade')
    setPnadeRaw((prev) => (prev === p ? prev : p))
  }, [searchParams])

  const sideKey: SideKey = useMemo(() => {
    const raw = sideRaw
    if (selectedPos) {
      const u = parseSideKey(raw)
      if (u) return u
      return selectedPos.side === 'CT' ? 'ct' : 't'
    }
    if (raw === 'any') return 't'
    return parseSideKey(raw) ?? 't'
  }, [selectedPos, sideRaw])

  const pickerTeam: SideKey | 'any' = useMemo(() => {
    if (selectedPos) return sideKey
    if (sideRaw === 'any') return 'any'
    if (sideRaw === 'ct' || sideRaw === 't') return sideRaw
    // Дефолт на экране выбора позиции: показываем обе стороны.
    return 'any'
  }, [selectedPos, sideKey, sideRaw])
  const subspots = useMemo(
    () => (selectedPos ? getSubspotsForPosition(selectedPos.id, positionCatalog) : []),
    [selectedPos, positionCatalog],
  )
  /** На телефоне навигация через `<a href>` надёжнее, чем `onClick`. */
  const selectedSubspot = useMemo(
    () => (spotIdFromUrl ? getPositionById(spotIdFromUrl, positionCatalog) : undefined),
    [spotIdFromUrl, positionCatalog],
  )

  const positionsForPickerBase = useMemo(() => {
    if (pickerTeam === 'any') {
      const ta = getPositionsByMapAndSide(mapId, 't', positionCatalog)
      const cta = getPositionsByMapAndSide(mapId, 'ct', positionCatalog)
      const m = new Map<string, MapPosition>()
      for (const p of [...ta, ...cta]) m.set(p.id, p)
      return [...m.values()]
    }
    return getPositionsByMapAndSide(mapId, pickerTeam, positionCatalog)
  }, [mapId, pickerTeam, positionCatalog])

  /** Для эффекта зон: не тащить `positionsForPickerBase` в deps (новый [] каждый рендер → лишние fetch). */
  const positionsForPickerBaseRef = useRef(positionsForPickerBase)
  useLayoutEffect(() => {
    positionsForPickerBaseRef.current = positionsForPickerBase
  }, [positionsForPickerBase])
  const zonesFetchSeqRef = useRef(0)

  const [activeFilter, setActiveFilter] = useState<string>('all')
  const pickerNadeFilter = useMemo(
    () => parsePickerNadeParam(pnadeRaw),
    [pnadeRaw],
  )
  /** Запоминаем T / CT / все на экране выбора позиции, чтобы вернуть после `onPositionReset`. */
  const pickerSideSnapshotRef = useRef<PickerTeamFilter>('any')
  const pickerSideSnapshotReady = useRef(false)
  /** Пользователь снял подсветку цели на карте — не навешивать auto-preview снова до смены позиции/фильтра. */
  const userDismissedThrowOriginPreviewRef = useRef(false)
  const [selectedGrenade, setSelectedGrenade] = useState<Grenade | null>(null)
  /** Тап по цели на карте: линии к точкам броска без шита. */
  const [mapPreviewGrenade, setMapPreviewGrenade] = useState<Grenade | null>(null)
  const [activeThrowVariantIndex, setActiveThrowVariantIndex] = useState(0)
  const [activeLayer, setActiveLayer] = useState(0)
  const mapLineupHeaderAnchorRef = useRef<HTMLDivElement>(null)
  /** Нижний край шапки шага карты — верх BottomSheet с раскидкой не заходит выше. */
  const [mapLineupSheetTopPx, setMapLineupSheetTopPx] = useState(0)
  /** Не ветвить «фото цели / карта» до монтирования — SSR и гидрация могут дать разный `shouldShowTargetPreview`/`targetPreviewSrc`. */
  const [centerColumnReady, setCenterColumnReady] = useState(false)
  /** На мобиле фикс. шапка «Откуда бросаем?» перекрывает угол карты — сдвигаем плашку названия карты. */
  const [throwOriginFloatingBarVisible, setThrowOriginFloatingBarVisible] = useState(false)
  /** Тот же fallback, что в useEffect — иначе SSR отдаёт пустой массив и ветку «loading», а после гидрации сразу карточки. */
  const [zones, setZones] = useState<PositionZone[]>(() =>
    getDefaultZonesForPositions(getPositionsByMapAndSide(mapId, 't', positionCatalog)),
  )
  const { screenshotFor, overrides } = usePositionOverrides()

  const currentLayer = map.layers[activeLayer]
  const allMapPositions = useMemo(
    () => getAllPositionsForMap(mapId, positionCatalog),
    [mapId, positionCatalog],
  )

  const selectedZoneForPicker = useMemo(
    () => (zoneIdFromUrl ? zones.find((z) => z.id === zoneIdFromUrl) : undefined),
    [zones, zoneIdFromUrl],
  )

  const zonePickerPositions = useMemo(() => {
    if (selectedZoneForPicker) {
      const visibleIds = selectedZoneForPicker.position_ids.filter(
        (id) => !(selectedZoneForPicker.disabled_position_ids ?? []).includes(id),
      )
      const set = new Set(visibleIds)
      const inZone = allMapPositions.filter((p) => set.has(p.id))
      // Фолбэк: если зона в URL устарела/невалидна для текущей стороны, не оставляем экран пустым.
      if (inZone.length === 0) return positionsForPickerBase
      return inZone
    }
    return positionsForPickerBase
  }, [selectedZoneForPicker, allMapPositions, positionsForPickerBase])

  const onThrowOriginFloatingBarChange = useCallback((visible: boolean) => {
    setThrowOriginFloatingBarVisible(visible)
  }, [])

  const resolveZoneForPick = useCallback(
    (positionId: string) => {
      const pos = getPositionById(positionId, positionCatalog)
      const sk: SideKey = pos?.side === 'CT' ? 'ct' : pos?.side === 'T' ? 't' : sideKey
      for (const z of zones) {
        if (z.position_ids.includes(positionId)) return z.id
      }
      return getZoneIdForPositionOnSide(mapId, positionId, sk, positionCatalog)
    },
    [zones, mapId, sideKey, positionCatalog],
  )

  /** Пока в URL есть `pos`, не трогаем снимок: иначе `pickerTeam` = сторона позиции и затирает «ВСЕ». */
  useLayoutEffect(() => {
    if (!posIdFromUrl) {
      pickerSideSnapshotRef.current = pickerTeam
      pickerSideSnapshotReady.current = true
      writeStoredPickerTeam(mapId, pickerTeam)
    }
  }, [posIdFromUrl, pickerTeam, mapId])

  useEffect(() => {
    userDismissedThrowOriginPreviewRef.current = false
  }, [posIdFromUrl, spotIdFromUrl, activeFilter])

  useEffect(() => {
    setCenterColumnReady(true)
  }, [])

  useEffect(() => {
    const positions = positionsForPickerBaseRef.current
    const fallback = getDefaultZonesForPositions(positions)
    setZones(fallback)
    const seq = ++zonesFetchSeqRef.current
    const ctrl = new AbortController()
    const apiSide: SideKey = pickerTeam === 'any' ? 't' : pickerTeam
    fetch(`/api/position-zones?map=${mapId}&side=${apiSide}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (seq !== zonesFetchSeqRef.current) return
        if (json && Array.isArray(json.zones) && json.zones.length > 0) {
          setZones(json.zones)
        }
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [mapId, pickerTeam])

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

  useEffect(() => {
    setActiveThrowVariantIndex(0)
  }, [selectedGrenade?.id])

  // Когда меняется позиция / sub-spot — закрываем открытую раскидку и превью карты
  useEffect(() => {
    setSelectedGrenade(null)
    setMapPreviewGrenade(null)
  }, [posIdFromUrl, sideKey, spotIdFromUrl])

  /**
   * Читаем актуальный query из `window.location.search` — мы можем обновлять
   * URL «тихо» через `history.replaceState` (для side/pnade/tab), и в этих
   * случаях `useSearchParams()` отстаёт. Для построения новых URL нужен
   * самый свежий снимок.
   */
  const readCurrentSearchParams = useCallback((): URLSearchParams => {
    if (typeof window === 'undefined') {
      return new URLSearchParams(Array.from(searchParams.entries()))
    }
    return new URLSearchParams(window.location.search)
  }, [searchParams])

  // ─── Навигация (push для истории) ──────────────────────────────────────────
  const navigate = useCallback(
    (mutate: (sp: URLSearchParams) => void, mode: 'push' | 'replace' = 'push') => {
      const sp = readCurrentSearchParams()
      mutate(sp)
      const qs = sp.toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      if (mode === 'push') router.push(url, { scroll: false })
      else router.replace(url, { scroll: false })
    },
    [pathname, router, readCurrentSearchParams],
  )

  /** Тихий апдейт query-параметра без триггера Next-роутера. */
  const writeSearchParamSilently = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      if (typeof window === 'undefined') return
      const url = new URL(window.location.href)
      mutate(url.searchParams)
      const next = `${url.pathname}${url.search}${url.hash}`
      const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (next === cur) return
      window.history.replaceState(window.history.state, '', next)
    },
    [],
  )

  const setPickerNadeFilter = useCallback(
    (f: PickerNadeFilter) => {
      setPnadeRaw(f === 'all' ? null : f)
      writeSearchParamSilently((sp) => {
        if (f === 'all') sp.delete('pnade')
        else sp.set('pnade', f)
      })
    },
    [writeSearchParamSilently],
  )

  const setPickerTeam = useCallback(
    (team: PickerTeamFilter) => {
      setSideRaw(team)
      writeSearchParamSilently((sp) => {
        sp.set('side', team)
        // Для consistency с прежним поведением (на picker-экране `pos`/`spot`
        // не должны тащиться через смену стороны).
        sp.delete('pos')
        sp.delete('spot')
      })
    },
    [writeSearchParamSilently],
  )

  const onPositionPick = useCallback(
    (positionId: string) =>
      navigate((sp) => {
        sp.set('pos', positionId)
        sp.delete('spot')
      }),
    [navigate],
  )

  const onSubspotPick = useCallback(
    (subspotId: string) => navigate((sp) => sp.set('spot', subspotId)),
    [navigate],
  )

  const onPositionReset = useCallback(() => {
    try {
      if (sessionStorage.getItem(HOME_SEARCH_RETURN_PANEL_KEY) === HOME_SEARCH_RETURN_VALUE) {
        router.push('/')
        return
      }
    } catch {
      /* private mode */
    }
    navigate((sp) => {
      sp.delete('pos')
      sp.delete('spot')
      const s =
        readStoredPickerTeam(mapId) ??
        (pickerSideSnapshotReady.current ? pickerSideSnapshotRef.current : null)
      if (s === 'any') sp.set('side', 'any')
      else if (s === 'ct' || s === 't') sp.set('side', s)
    })
  }, [navigate, mapId, router])

  const onSubspotReset = useCallback(
    () => navigate((sp) => sp.delete('spot')),
    [navigate],
  )

  /** «Умная» кнопка ←: spot → pos → side → главная. */
  const onSmartBack = useCallback(() => {
    if (selectedGrenade) {
      const g = selectedGrenade
      setSelectedGrenade(null)
      if (g) setMapPreviewGrenade(g)
      return
    }
    if (mapPreviewGrenade) {
      setMapPreviewGrenade(null)
      return
    }
    if (spotIdFromUrl) {
      onSubspotReset()
      return
    }
    if (posIdFromUrl) {
      onPositionReset()
      return
    }
    if (zoneIdFromUrl) {
      navigate((sp) => sp.delete('zone'))
      return
    }
    router.push('/')
  }, [
    selectedGrenade,
    mapPreviewGrenade,
    spotIdFromUrl,
    posIdFromUrl,
    onSubspotReset,
    onPositionReset,
    router,
    zoneIdFromUrl,
    navigate,
  ])

  // ─── Фильтрация ────────────────────────────────────────────────────────────
  const onLayer = useMemo(
    () => initialGrenades.filter((g) => !g.layer_file || g.layer_file === currentLayer.file),
    [initialGrenades, currentLayer.file],
  )

  const bySide = useMemo(() => {
    return onLayer.filter((g) => isSideMatch(g.side, sideKey))
  }, [onLayer, sideKey])

  /**
   * Раскидки T / CT на текущем слое — нужны для определения «куда вести» при
   * клике на позицию `side='both'` и для всего, что считает раскидки на «сторону».
   * Раньше это считалось inline в `pickPositionHref` для каждой позиции на каждом
   * рендере; теперь — один раз через memo.
   */
  const onLayerByT = useMemo(
    () => onLayer.filter((g) => isSideMatch(g.side, 't')),
    [onLayer],
  )
  const onLayerByCT = useMemo(
    () => onLayer.filter((g) => isSideMatch(g.side, 'ct')),
    [onLayer],
  )

  /** На экране выбора позиции подставляем раскидки обеих сторон при team=any. */
  const grenadesForPositionPicker = useMemo(() => {
    if (selectedPos) return bySide
    if (pickerTeam === 'any') return onLayer
    return onLayer.filter((g) => isSideMatch(g.side, pickerTeam))
  }, [selectedPos, pickerTeam, onLayer, bySide])

  const byPosition = useMemo(() => {
    if (!selectedPos) return bySide
    return filterGrenadesByPosition(bySide, selectedPos, positionCatalog)
  }, [bySide, selectedPos, positionCatalog])

  const bySpot = useMemo(() => {
    if (!selectedSubspot) return byPosition
    return filterGrenadesByPosition(byPosition, selectedSubspot, positionCatalog)
  }, [byPosition, selectedSubspot, positionCatalog])

  const destinationGrenades = useMemo(
    () => mergeGrenadesByDestination(bySpot),
    [bySpot],
  )

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return destinationGrenades
    return destinationGrenades.filter((g) => g.type === activeFilter)
  }, [destinationGrenades, activeFilter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: destinationGrenades.length }
    destinationGrenades.forEach((g) => {
      c[g.type] = (c[g.type] || 0) + 1
    })
    return c
  }, [destinationGrenades])

  const throwOriginItems = useMemo(
    () => buildThrowOriginItems(destinationGrenades),
    [destinationGrenades],
  )

  /** Сколько раскидок относится к каждой sub-spot'е (для бейджа в правой панели). */
  const subspotCounts = useMemo(() => {
    const m: Record<string, number> = {}
    const byPositionDestinations = mergeGrenadesByDestination(byPosition)
    for (const s of subspots) m[s.id] = countGrenadesForPosition(byPositionDestinations, s, positionCatalog)
    return m
  }, [subspots, byPosition, positionCatalog])
  const visibleSubspots = useMemo(
    () => subspots.filter((s) => (subspotCounts[s.id] ?? 0) > 0),
    [subspots, subspotCounts],
  )
  const hasVisibleSubspots = visibleSubspots.length > 0

  // Эти хуки должны вызываться до любых ранних return.
  const showSubspotPicker = hasVisibleSubspots && !selectedSubspot
  const showLineupGallery = Boolean(selectedSubspot) || (!hasVisibleSubspots && !selectedGrenade)
  const previewTarget = selectedSubspot ?? selectedPos
  const targetPreviewSrc = previewTarget
    ? screenshotFor(previewTarget.id, previewTarget.screenshot_url)
    : undefined
  // Карта центра показывает цель и точки как на экране зоны; превью фото только когда уже выбран бросок
  const shouldShowTargetPreview =
    Boolean(selectedPos) &&
    (showSubspotPicker ||
      Boolean(selectedSubspot) ||
      (!hasVisibleSubspots && Boolean(selectedGrenade)))
  const targetPreviewFocusY = useMemo(() => {
    if (!previewTarget) return 50
    const o = overrides[previewTarget.id]
    const fine = o?.screenshot_focus_y
    if (typeof fine === 'number' && Number.isFinite(fine)) {
      return Math.max(0, Math.min(100, fine))
    }
    const legacy = o?.screenshot_position ?? 'center'
    if (legacy === 'top') return 0
    if (legacy === 'bottom') return 100
    return 50
  }, [overrides, previewTarget])
  const targetPreviewFocusX = useMemo(() => {
    if (!previewTarget) return 50
    const fine = overrides[previewTarget.id]?.screenshot_focus_x
    if (typeof fine === 'number' && Number.isFinite(fine)) {
      return Math.max(0, Math.min(100, fine))
    }
    return 50
  }, [overrides, previewTarget])
  const targetPreviewZoom = useMemo(() => {
    if (!previewTarget) return 1
    const zoom = overrides[previewTarget.id]?.screenshot_zoom
    if (typeof zoom === 'number' && Number.isFinite(zoom)) {
      return Math.max(0.6, Math.min(2.5, zoom))
    }
    return 1
  }, [overrides, previewTarget])
  const targetTranslateX = useMemo(
    () => (50 - targetPreviewFocusX) * 0.6,
    [targetPreviewFocusX],
  )
  const targetTranslateY = useMemo(
    () => (50 - targetPreviewFocusY) * 0.9,
    [targetPreviewFocusY],
  )
  const selectedOriginKey = selectedGrenade ? `${selectedGrenade.id}:${activeThrowVariantIndex}` : null

  const openMapLineupSheet = Boolean(selectedPos && selectedGrenade)

  const updateMapLineupSheetTop = useCallback(() => {
    const el = mapLineupHeaderAnchorRef.current
    if (!el) return
    setMapLineupSheetTopPx(el.getBoundingClientRect().bottom)
  }, [])

  useLayoutEffect(() => {
    if (!openMapLineupSheet) return
    updateMapLineupSheetTop()
  }, [
    openMapLineupSheet,
    updateMapLineupSheetTop,
    selectedPos?.id,
    selectedSubspot?.id,
    sideKey,
    currentLayer.file,
    map.layers.length,
    lang,
  ])

  useEffect(() => {
    if (!openMapLineupSheet) return
    updateMapLineupSheetTop()
    const el = mapLineupHeaderAnchorRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(updateMapLineupSheetTop)
    ro.observe(el)
    window.addEventListener('resize', updateMapLineupSheetTop)
    window.addEventListener('orientationchange', updateMapLineupSheetTop)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateMapLineupSheetTop)
      window.removeEventListener('orientationchange', updateMapLineupSheetTop)
    }
  }, [openMapLineupSheet, updateMapLineupSheetTop])

  /** Только после `useEffect`: иначе ветки «фото цели / нет фото / карта» могут различаться между SSR и первым клиентским проходом (гидрация). Не использовать `typeof window` — на части сборок при рендере клиентского дерева SSR `window` уже есть. */
  const showCenterPlaceholder = !centerColumnReady

  const inThrowOriginMapStep =
    Boolean(selectedPos) &&
    !hasVisibleSubspots &&
    showLineupGallery &&
    !selectedGrenade &&
    !shouldShowTargetPreview &&
    centerColumnReady

  const onCentralMapPreviewChange = useCallback(
    (g: Grenade | null) => {
      if (g === null && inThrowOriginMapStep) {
        userDismissedThrowOriginPreviewRef.current = true
      }
      setMapPreviewGrenade(g)
    },
    [inThrowOriginMapStep],
  )

  useEffect(() => {
    if (!inThrowOriginMapStep || userDismissedThrowOriginPreviewRef.current) return
    if (filtered.length === 0) return
    const first = filtered[0]
    setMapPreviewGrenade((prev) => {
      if (prev && filtered.some((x) => x.id === prev.id)) return prev
      return first
    })
  }, [inThrowOriginMapStep, filtered])

  // Нет позиции → сразу выбор позиции (фильтр по зоне — query `zone`, без отдельного экрана).
  if (!selectedPos) {
    const backQs = (() => {
      const sp = new URLSearchParams()
      if (sideRaw) sp.set('side', sideRaw)
      if (pnadeRaw) sp.set('pnade', pnadeRaw)
      return sp.toString()
    })()
    const backHref = zoneIdFromUrl ? (backQs ? `${pathname}?${backQs}` : pathname) : '/'
    const pickPositionHref = (positionId: string) => {
      const pos = getPositionById(positionId, positionCatalog)
      let sk: SideKey = sideKey
      if (pos?.side === 'CT') sk = 'ct'
      else if (pos?.side === 'T') sk = 't'
      else if (pos?.side === 'both') {
        if (pickerTeam === 'ct' || pickerTeam === 't') {
          sk = pickerTeam
        } else {
          // Для `both` в режиме "все" выбираем сторону, где реально есть точки,
          // иначе можно попасть на пустой экран при наличии маркера на карте.
          const tCount = countGrenadesForPosition(onLayerByT, pos, positionCatalog)
          const ctCount = countGrenadesForPosition(onLayerByCT, pos, positionCatalog)
          sk = ctCount > tCount ? 'ct' : 't'
        }
      }
      const sp = new URLSearchParams()
      sp.set('side', sk)
      const zoneId = selectedZoneForPicker?.id ?? resolveZoneForPick(positionId)
      sp.set('zone', zoneId)
      sp.set('pos', positionId)
      // Локальное `pnadeRaw` свежее, чем `useSearchParams()` (мы пишем туда `replaceState`).
      if (pnadeRaw && parsePickerNadeParam(pnadeRaw) !== 'all') sp.set('pnade', pnadeRaw)
      // С вкладок «Карточки» / «Список» сохраняем `tab`, чтобы после закрытия позиции вернуться туда, а не на «Карту».
      // Свежее значение читаем из `window.location.search` — `PositionSelector` тоже пишет туда `replaceState`.
      const tab =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('tab')
          : searchParams.get('tab')
      if (tab === 'photos' || tab === 'list') {
        sp.set('tab', tab)
      }
      return `${pathname}?${sp}`
    }

    return (
      <div
        className="relative z-[95] flex h-full min-h-0 w-full max-w-full flex-1 flex-col overflow-x-clip overflow-y-hidden bg-[#0d0d0d]"
        suppressHydrationWarning
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {zones.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8">
              <p className="text-center text-sm text-[#888]">{t('common.loading')}</p>
            </div>
          ) : (
            <AfterMount fallback={positionSelectorFallback}>
              <PositionSelector
                map={map}
                pickerTeam={pickerTeam}
                onPickerTeamChange={setPickerTeam}
                nadeFilter={pickerNadeFilter}
                onNadeFilterChange={setPickerNadeFilter}
                positions={zonePickerPositions}
                grenades={grenadesForPositionPicker}
                positionCatalog={positionCatalog}
                onPick={onPositionPick}
                onBack={onSmartBack}
                navigationLinks={{
                  backHref,
                  pickPosition: pickPositionHref,
                }}
              />
            </AfterMount>
          )}
        </div>
      </div>
    )
  }

  // Шаг 3 — раскидки выбранной позиции (с под-точками или без)
  const posLabel = pickLocalizedLabel(selectedPos, lang)
  const subspotLabel = selectedSubspot ? pickLocalizedLabel(selectedSubspot, lang) : null
  const open = Boolean(selectedGrenade)

  const showThrowOriginMobileRail =
    showLineupGallery && !open && !selectedSubspot
  /** Компактная моб. вёрстка (max-h карты + полоса карточек) только после монтирования — иначе возможен mismatch SSR/гидрации. */
  const throwOriginMobileHydrationSafe =
    showThrowOriginMobileRail && centerColumnReady

  /**
   * UX по плану §5.4 alt:
   *  • есть subspots, ?spot не задан → правая панель с фото-карточками точек;
   *  • выбрана конкретная subspot → левая панель с галереей раскидок;
   *  • нет subspots вообще → на md+ показываем галерею слева сразу,
   *    на mobile — старый flow с BottomSheet.
   */
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-x-hidden overscroll-none bg-[#0d0d0d]" suppressHydrationWarning>
      {/* Только переключатель слоя; название карты — угловая плашка на блоке радара. */}
      <div
        ref={mapLineupHeaderAnchorRef}
        className={`relative z-20 flex shrink-0 items-center justify-end gap-2 pointer-events-none px-app-screen ${
          map.layers.length > 1 ? 'min-h-[2.75rem] pb-3 pt-3' : 'min-h-0 py-0'
        }`}
        suppressHydrationWarning
      >
        {map.layers.length > 1 ? (
          <button
            type="button"
            onClick={() => setActiveLayer((l) => (l + 1) % map.layers.length)}
            className="pointer-events-auto h-9 shrink-0 rounded-full bg-[#1a1a1a] px-3 text-xs font-medium text-[#F0B429] transition-transform active:scale-90"
          >
            {currentLayer.label} {t('map.layerToggle')}
          </button>
        ) : null}
      </div>

      {/* Основная зона: на md+ — карта в центре + панель сбоку,
          на мобильном — стек: панель сверху (или карта целиком). */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {/* Левая панель: «Откуда бросаем?» / LineupGallery.
            На ПК в режиме `inThrowOriginMapStep` (нет subspots, ещё не выбрана раскидка)
            — растягиваем на всю ширину, центральный блок с радаром скрываем
            (временно: радар на десктопе тут не виден, а карточки полезнее в полную ширину). */}
        {showLineupGallery && !open && (
          <div
            className={
              inThrowOriginMapStep
                ? 'order-2 md:order-1 md:flex md:min-w-0 md:flex-1 md:flex-col'
                : 'order-2 md:order-1 md:min-w-[400px] md:w-[min(46vw,720px)] md:max-w-[720px] md:shrink-0 md:border-r-0 md:flex md:flex-col'
            }
          >
            <div className="hidden md:flex flex-1 min-h-0">
              {selectedSubspot ? (
                <LineupGallery
                  contextLabel={subspotLabel ?? posLabel}
                  grenades={destinationGrenades}
                  selectedId={selectedGrenade?.id ?? null}
                  onPick={(g) => {
                    setMapPreviewGrenade(null)
                    setSelectedGrenade(g)
                  }}
                  onClose={selectedSubspot ? onSubspotReset : undefined}
                />
              ) : (
                <AfterMount fallback={panelFallback}>
                  <ThrowOriginGallery
                    contextLabel={posLabel}
                    grenades={destinationGrenades}
                    selectedKey={selectedOriginKey}
                    radarFile={currentLayer.file}
                    mapCornerName={map.display_name}
                    useExternalRadar
                    onPick={(g, idx) => {
                      setMapPreviewGrenade(null)
                      setSelectedGrenade(g)
                      setActiveThrowVariantIndex(idx)
                    }}
                    onClose={onPositionReset}
                  />
                </AfterMount>
              )}
            </div>
          </div>
        )}

        {/* Центральная зона: карта или фото цели; на мобиле под картой — карточки «откуда бросаем».
            z-20: фикс. шапка ThrowOriginGallery (z-41) в соседней колонке не перекрывает тулбар карты (+/−, название).
            На ПК в `inThrowOriginMapStep` колонку прячем — её место занимают карточки слева. */}
        <div
          className={`relative z-20 order-1 md:order-2 flex min-h-0 flex-1 flex-col overflow-hidden transition-all duration-300 ${
            inThrowOriginMapStep ? 'md:hidden' : ''
          }`}
          suppressHydrationWarning
        >
          <div
            className={
              throwOriginMobileHydrationSafe
                ? // Мобильный rail: высота зоны карты (остальное — карточки «откуда»); dvh/rem подняты, чтобы карта была крупнее.
                  `relative min-h-0 overflow-hidden max-md:h-[min(70dvh,34rem)] max-md:max-h-[min(70dvh,34rem)] max-md:shrink-0 max-md:flex-none md:flex-1${
                    throwOriginFloatingBarVisible
                      ? ' max-md:pt-[2.65rem]'
                      : ''
                  }`
                : 'relative min-h-0 flex-1 overflow-hidden'
            }
          >
            {showCenterPlaceholder ? (
              <div className="relative h-full min-h-0 w-full">
                <MapCornerNameLabel
                  name={map.display_name}
                  lowerOnMdForFloatingBar={throwOriginFloatingBarVisible}
                />
                {mapViewFallback}
              </div>
            ) : shouldShowTargetPreview ? (
              targetPreviewSrc ? (
                <div className="relative h-full w-full bg-[#111]">
                  <MapCornerNameLabel
                    name={map.display_name}
                    lowerOnMdForFloatingBar={throwOriginFloatingBarVisible}
                  />
                  <Image
                    src={targetPreviewSrc}
                    alt={posLabel}
                    fill
                    sizes="100vw"
                    className="object-contain bg-[#111]"
                    style={{
                      objectPosition: '50% 50%',
                      transform: `translate(${targetTranslateX}%, ${targetTranslateY}%) scale(${targetPreviewZoom})`,
                      transformOrigin: 'center center',
                    }}
                    priority={false}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-4 pt-16">
                    <p className="text-[10px] uppercase tracking-widest text-[#bfbfbf]">Цель</p>
                    <h3 className="mt-1 text-xl font-bold">{posLabel}</h3>
                    <p className="mt-1 text-xs text-[#d0d0d0]">
                      Ниже выбери, откуда выполняем бросок.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#111]">
                  <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] px-5 py-4 text-center">
                    <p className="text-sm font-semibold">Фото цели не добавлено</p>
                    <p className="mt-1 text-xs text-[#888]">
                      Добавь фото точки в админке, и здесь будет понятный превью-блок.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="relative flex h-full min-h-0 w-full flex-col max-md:px-app-screen max-md:pb-1">
                <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden max-md:rounded-[0.95rem] max-md:border max-md:border-white/[0.08] max-md:bg-black/78 max-md:shadow-[0_4px_18px_rgba(0,0,0,0.4)] max-md:backdrop-blur-xl max-md:supports-[backdrop-filter]:bg-black/65 md:rounded-none md:border-0 md:bg-transparent md:shadow-none md:backdrop-blur-none">
                  <AfterMount fallback={mapViewFallback}>
                    <MapView
                      mapTitle={map.display_name}
                      radarFile={currentLayer.file}
                      grenades={filtered}
                      previewGrenade={mapPreviewGrenade}
                      onPreviewChange={onCentralMapPreviewChange}
                      selectedGrenade={selectedGrenade}
                      onSelect={setSelectedGrenade}
                      onThrowVariantSelect={(g, idx) => {
                        setMapPreviewGrenade(null)
                        setSelectedGrenade(g)
                        setActiveThrowVariantIndex(idx)
                      }}
                      imagePosition={
                        open || showSubspotPicker
                          ? 'top'
                          : throwOriginMobileHydrationSafe || showLineupGallery
                            ? 'top'
                            : 'center'
                      }
                      activeThrowVariantIndex={activeThrowVariantIndex}
                      subspotMarker={
                        selectedSubspot && selectedSubspot.point
                          ? {
                              x: selectedSubspot.point.x,
                              y: selectedSubspot.point.y,
                              label: subspotLabel ?? selectedSubspot.label,
                            }
                          : null
                      }
                    />
                  </AfterMount>
                </div>
              </div>
            )}
            {open && !shouldShowTargetPreview && (
              <div className="pointer-events-none absolute inset-0 bg-black/18" />
            )}
            {filtered.length === 0 && !open && (
              <div className="absolute inset-x-0 top-1/3 mx-6 rounded-2xl border border-[#262626] bg-[#1a1a1a]/95 p-5 text-center pointer-events-none">
                <div className="mb-1 text-2xl" aria-hidden>
                  📭
                </div>
                <p className="text-sm text-[#aaa]">{t('position.empty')}</p>
              </div>
            )}
          </div>
          {throwOriginMobileHydrationSafe ? (
            throwOriginItems.length === 0 ? (
              <p className="md:hidden shrink-0 border-t border-[#262626] bg-[#141414]/95 px-app-screen py-4 text-center text-sm text-[#666]">
                {t('throwOrigin.empty')}
              </p>
            ) : (
              <ThrowOriginPositionCards
                items={throwOriginItems}
                selectedKey={selectedOriginKey}
                onPick={(g, idx) => {
                  setMapPreviewGrenade(null)
                  setSelectedGrenade(g)
                  setActiveThrowVariantIndex(idx)
                }}
                className="md:hidden flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain border-t border-[#262626] bg-[#141414]/95 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] pt-1"
                gridClassName="px-app-screen pb-2 pt-0"
              />
            )
          ) : null}
        </div>

        {/* Правая панель: subspot picker (видна когда у позиции есть sub-spot'ы
            и spot ещё не выбран). На mobile — занимает всю высоту под картой;
            на md+ — фиксированная ширина. */}
        {showSubspotPicker && !open && (
          <>
            <div className="order-3 hidden md:flex md:w-[340px] md:shrink-0 md:flex-initial md:min-h-0 md:flex">
              <AfterMount fallback={panelFallback}>
                <SubspotPicker
                  parent={selectedPos}
                  subspots={visibleSubspots}
                  counts={subspotCounts}
                  selectedId={spotIdFromUrl}
                  onPick={onSubspotPick}
                  onClose={onPositionReset}
                />
              </AfterMount>
            </div>
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 md:hidden">
              <div className="pointer-events-auto h-[calc(90dvh-env(safe-area-inset-bottom,0px))] max-h-[93dvh] overflow-hidden rounded-t-2xl border-t border-x border-[#2b2b2b] bg-[#141414]/92 backdrop-blur-md shadow-2xl">
                <AfterMount fallback={panelFallback}>
                  <SubspotPicker
                    parent={selectedPos}
                    subspots={visibleSubspots}
                    counts={subspotCounts}
                    selectedId={spotIdFromUrl}
                    onPick={onSubspotPick}
                    onClose={onPositionReset}
                  />
                </AfterMount>
              </div>
            </div>
          </>
        )}

        {/* Mobile-only: LineupGallery — шит; «Откуда бросаем?» — свой layout (оверлей к карте). */}
        {showLineupGallery && !open && (
          <>
            {selectedSubspot ? (
              <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 md:hidden">
                <div className="pointer-events-auto h-[calc(90dvh-env(safe-area-inset-bottom,0px))] max-h-[93dvh] overflow-hidden rounded-t-2xl border-t border-x border-[#2b2b2b] bg-[#141414]/92 backdrop-blur-md shadow-2xl">
                  <LineupGallery
                    contextLabel={subspotLabel ?? posLabel}
                    grenades={destinationGrenades}
                    selectedId={selectedGrenade?.id ?? null}
                    onPick={(g) => {
                      setMapPreviewGrenade(null)
                      setSelectedGrenade(g)
                    }}
                    onClose={selectedSubspot ? onSubspotReset : undefined}
                  />
                </div>
              </div>
            ) : (
              <div className="md:hidden">
                <AfterMount fallback={panelFallback}>
                  <ThrowOriginGallery
                    contextLabel={posLabel}
                    grenades={destinationGrenades}
                    selectedKey={selectedOriginKey}
                    radarFile={currentLayer.file}
                    mapCornerName={map.display_name}
                    useExternalRadar
                    onExternalMapModeOverlayChange={onThrowOriginFloatingBarChange}
                    reportMobileFloatingTitleBar
                    onPick={(g, idx) => {
                      setMapPreviewGrenade(null)
                      setSelectedGrenade(g)
                      setActiveThrowVariantIndex(idx)
                    }}
                    onClose={onPositionReset}
                  />
                </AfterMount>
              </div>
            )}
          </>
        )}
      </div>

      {!open && !showSubspotPicker && !showLineupGallery && (
        <FilterBar
          types={GRENADE_TYPES}
          active={activeFilter}
          counts={counts}
          onChange={setActiveFilter}
          dock="bottom"
        />
      )}

      {selectedGrenade && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 pb-0 md:pb-[max(env(safe-area-inset-bottom),0.5rem)] md:px-2"
          style={{ top: Math.max(mapLineupSheetTopPx, 56) }}
        >
          <div className="pointer-events-auto ml-auto mr-auto h-full min-h-0 w-full max-w-[980px] overflow-hidden rounded-t-2xl md:rounded-2xl border border-[#2b2b2b] bg-[#141414]/92 backdrop-blur-md shadow-2xl">
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

export default function MapPageClient(props: Props) {
  return (
    <Suspense fallback={<MapPageLoadingFallback />}>
      <MapPageClientInner {...props} />
    </Suspense>
  )
}
