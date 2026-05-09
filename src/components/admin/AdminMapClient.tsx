'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type {
  CustomLineup,
  CustomThrowVariant,
  Grenade,
  GrenadeType,
  MapData,
  Side,
} from '@/types'
import type { MapPosition } from '@/types/positions'
import { radarImageObjectPosition, useRadarImageBox } from '@/hooks/useRadarImageBox'
import { GRENADE_COLORS, GRENADE_EMOJIS } from '@/lib/grenades'
import { getAdminSecretFromBrowser } from '@/lib/admin-client'
import { uploadGrenadeMedia } from '@/lib/admin-upload-browser'
import MediaFields from '@/components/admin/MediaFields'
import AdminChangelogLink from '@/components/admin/AdminChangelogLink'
import { bumpLineupsVersionInBrowser } from '@/lib/lineups-sync'
import { customLineupToGrenade } from '@/lib/lineup-conversion'
import { belongsToPosition, getAllPositionsForMap, getPositionById } from '@/lib/positions'
import { sideKeyToSide, type SideKey } from '@/lib/side'
import { useLocale, useT } from '@/i18n'
import { pickLocalizedLabel } from '@/lib/i18n-helpers'
import { usePositionOverrides } from '@/lib/usePositionOverrides'

function adminFetchHeaders(json = false): HeadersInit {
  const sec = getAdminSecretFromBrowser()
  const h: Record<string, string> = {}
  if (json) h['Content-Type'] = 'application/json'
  if (sec) h['x-admin-secret'] = sec
  return h
}

const BTN_TOUCH = 'min-h-[52px] py-3.5 px-4 rounded-xl text-base font-semibold touch-manipulation active:scale-[0.99] transition-transform'
const BTN_SECONDARY = `${BTN_TOUCH} bg-[#2a2a2a] text-white`
const BTN_PRIMARY = `${BTN_TOUCH} bg-[#F0B429] text-black`
const BTN_DANGER = `${BTN_TOUCH} bg-[#3a1515] text-red-200`
const BTN_WARN = `${BTN_TOUCH} bg-[#3d2818] text-orange-200`
const BTN_SUCCESS = `${BTN_TOUCH} bg-[#1a3d2e] text-emerald-200`
const MIN_ZOOM = 1
const MAX_ZOOM = 4
const WHEEL_ZOOM_STEP = 0.09
/** Ниже порога считаем клик по радару; выше — панорама (при зуме не гасится pick микродвижением). */
const MAP_PAN_DRAG_THRESHOLD_PX2 = 10 * 10

function clampZoom(z: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
}


const THROW_SELECT_OPTS: Array<{ id: string; label: string }> = [
  { id: 'normal', label: 'Левая кнопка мышки' },
  { id: 'jump', label: 'Левая кнопка+пробел' },
  { id: 'jumprun', label: 'w+левая кнопка+пробел' },
  { id: 'right', label: 'Правая кнопка мышки' },
  { id: 'left_right', label: 'Левая+правая кнопка' },
  { id: 'd_jumprun', label: 'd+левая кнопка+пробел' },
  // legacy value in existing JSON
  { id: 'run', label: 'Правая кнопка мышки (legacy run)' },
]

function newVariantRow(landX: number, landY: number, copy?: CustomThrowVariant): CustomThrowVariant {
  return {
    id: crypto.randomUUID(),
    label: copy?.label ? `${copy.label} (копия)` : 'Вариант',
    sx: copy?.sx ?? landX,
    sy: copy?.sy ?? landY,
    throw_type: copy?.throw_type ?? 'normal',
    video_url: copy?.video_url ?? '',
    gallery: copy?.gallery ? [...copy.gallery] : [],
    description: copy?.description ?? '',
    method_media_url: copy?.method_media_url ?? '',
    method_hint: copy?.method_hint ?? '',
  }
}

interface Props {
  mapId: string
  map: MapData
  positionCatalog: MapPosition[]
  /** Если задано — новые точки получают `side` автоматически и фильтруются на радаре. */
  forcedSide?: SideKey | null
  /** Если задано — новые точки получают `position_ids: [forcedPositionId]` и фильтруются на радаре. */
  forcedPositionId?: string | null
  /** Если задано — новые точки получают `position_ids: [..., forcedSubspotId]` (под-точка). */
  forcedSubspotId?: string | null
  /** Чипсы контекста (карта/сторона/позиция) — рендерятся в шапке. */
  contextHeader?: React.ReactNode
}

function keyCustom(id: string) {
  return `c:${id}`
}
function keySeed(id: string) {
  return `s:${id}`
}

export default function AdminMapClient({
  mapId,
  map,
  positionCatalog,
  forcedSide = null,
  forcedPositionId = null,
  forcedSubspotId = null,
  contextHeader,
}: Props) {
  const t = useT()
  const lang = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const [activeLayer, setActiveLayer] = useState(0)
  const currentLayer = map.layers[activeLayer]
  const box = useRadarImageBox(containerRef, imgRef, imgLoaded)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const [allLineups, setAllLineups] = useState<CustomLineup[]>([])
  const [hiddenSeedIds, setHiddenSeedIds] = useState<string[]>([])
  const [seeds, setSeeds] = useState<Grenade[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveMsg, setSaveMsg] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  /** Следующий клик по карте поставит новую точку; иначе пустое место только снимает выбор */
  const [addMode, setAddMode] = useState(false)
  /** Добавление двумя кликами: приём → старт (создаёт точку в режиме нескольких бросков) */
  const [preferTwoClickAdd, setPreferTwoClickAdd] = useState(true)
  /** id кастомной точки, ждущей второй клик (откуда бросок) */
  const [addSecondStepId, setAddSecondStepId] = useState<string | null>(null)
  /** Редактирование: следующий клик по радару задаёт приём или старт варианта */
  const [radarPick, setRadarPick] = useState<
    null | { kind: 'land' } | { kind: 'start'; variantId: string } | { kind: 'single' }
  >(null)

  const [seedForm, setSeedForm] = useState({
    title: '',
    type: 'smoke' as GrenadeType,
    description: '',
    video_url: '',
    gallery: '',
  })

  /** Как на публичной карте (`MapView`): cache, смена `src`, iOS/WebKit без повторного `load`. */
  useLayoutEffect(() => {
    const img = imgRef.current
    if (!img) return

    let cancelled = false
    setImgLoaded(false)
    setImgFailed(false)

    const markLoaded = () => {
      if (cancelled || img.naturalWidth <= 0) return
      setImgLoaded(true)
      setImgFailed(false)
    }

    const markFailed = () => {
      if (cancelled) return
      setImgLoaded(false)
      setImgFailed(true)
    }

    img.addEventListener('load', markLoaded)
    img.addEventListener('error', markFailed)

    if (img.complete) {
      if (img.naturalWidth > 0) markLoaded()
      else markFailed()
    }

    const rafId = requestAnimationFrame(() => {
      if (cancelled) return
      if (img.complete && img.naturalWidth > 0) markLoaded()
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      img.removeEventListener('load', markLoaded)
      img.removeEventListener('error', markFailed)
    }
  }, [currentLayer.file])

  const forcedSideValue = useMemo<Exclude<Side, 'both'> | null>(
    () => (forcedSide ? sideKeyToSide(forcedSide) : null),
    [forcedSide],
  )
  const forcedPosition = useMemo(
    () => (forcedPositionId ? getPositionById(forcedPositionId, positionCatalog) : undefined),
    [forcedPositionId, positionCatalog],
  )
  const {
    screenshotFor,
    refresh: refreshPositionOverrides,
    overrides: positionOverrides,
  } = usePositionOverrides()
  const forcedSubspot = useMemo(
    () => (forcedSubspotId ? getPositionById(forcedSubspotId, positionCatalog) : undefined),
    [forcedSubspotId, positionCatalog],
  )

  const matchesContext = useCallback(
    (g: Grenade): boolean => {
      if (forcedSideValue && g.side !== 'both' && g.side !== forcedSideValue) return false
      if (forcedPosition && !belongsToPosition(g, forcedPosition, positionCatalog)) return false
      if (forcedSubspot && !belongsToPosition(g, forcedSubspot, positionCatalog)) return false
      return true
    },
    [forcedSideValue, forcedPosition, forcedSubspot, positionCatalog],
  )

  const visibleCustom = useMemo(
    () =>
      allLineups
        .filter((l) => l.map === mapId && l.layer_file === currentLayer.file)
        .filter((l) => matchesContext(customLineupToGrenade(l))),
    [allLineups, mapId, currentLayer.file, matchesContext]
  )

  const visibleSeeds = useMemo(
    () =>
      seeds
        .filter(
          (g) =>
            !hiddenSeedIds.includes(g.id) &&
            (!g.layer_file || g.layer_file === currentLayer.file)
        )
        .filter(matchesContext),
    [seeds, hiddenSeedIds, currentLayer.file, matchesContext]
  )

  const allPositionsForMap = useMemo(() => getAllPositionsForMap(mapId, positionCatalog), [mapId, positionCatalog])
  const forcedPositionPhoto = forcedPosition
    ? screenshotFor(forcedPosition.id, forcedPosition.screenshot_url)
    : undefined
  const forcedPositionPhotoPosition = forcedPosition
    ? positionOverrides[forcedPosition.id]?.screenshot_position ?? 'center'
    : 'center'
  const forcedPositionPhotoFocusX = forcedPosition
    ? positionOverrides[forcedPosition.id]?.screenshot_focus_x
    : undefined
  const forcedPositionPhotoFocusY = forcedPosition
    ? positionOverrides[forcedPosition.id]?.screenshot_focus_y
    : undefined
  const forcedPositionPhotoZoom = forcedPosition
    ? positionOverrides[forcedPosition.id]?.screenshot_zoom
    : undefined

  /** Применяет авто-теги контекста (side, position_ids) к новой точке. */
  const applyContextDefaults = useCallback(
    (lineup: CustomLineup): CustomLineup => {
      const next = { ...lineup }
      if (forcedSideValue && !next.side) next.side = forcedSideValue
      const tags = new Set(next.position_ids ?? [])
      if (forcedPositionId) tags.add(forcedPositionId)
      if (forcedSubspotId) tags.add(forcedSubspotId)
      if (tags.size > 0) next.position_ids = Array.from(tags)
      return next
    },
    [forcedSideValue, forcedPositionId, forcedSubspotId],
  )

  const selectedCustom = useMemo(() => {
    if (!selectedKey?.startsWith('c:')) return null
    const id = selectedKey.slice(2)
    return allLineups.find((l) => l.id === id) ?? null
  }, [selectedKey, allLineups])

  const selectedSeed = useMemo(() => {
    if (!selectedKey?.startsWith('s:')) return null
    const id = selectedKey.slice(2)
    return seeds.find((g) => g.id === id) ?? null
  }, [selectedKey, seeds])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [lineupsRes, seedRes] = await Promise.all([
        fetch('/api/admin/lineups', { headers: adminFetchHeaders() }),
        fetch(`/api/admin/seed/${mapId}`, { headers: adminFetchHeaders() }),
      ])
      const errs: string[] = []

      if (lineupsRes.ok) {
        const lf = (await lineupsRes.json()) as {
          lineups?: CustomLineup[]
          hidden_seed_ids?: string[]
        }
        setAllLineups(lf.lineups ?? [])
        setHiddenSeedIds(lf.hidden_seed_ids ?? [])
      } else {
        setAllLineups([])
        setHiddenSeedIds([])
        let m = `Lineups: ${lineupsRes.status}`
        try {
          const j = (await lineupsRes.json()) as { error?: string }
          if (j?.error) m = j.error
        } catch {
          /* ignore */
        }
        errs.push(m)
      }

      if (seedRes.ok) {
        const sg = (await seedRes.json()) as { grenades?: Grenade[] }
        setSeeds(sg.grenades ?? [])
      } else {
        setSeeds([])
        let m = `База карты: ${seedRes.status}`
        try {
          const j = (await seedRes.json()) as { error?: string }
          if (j?.error) m = j.error
        } catch {
          /* ignore */
        }
        errs.push(m)
      }

      if (errs.length) {
        const hint401 =
          lineupsRes.status === 401 || seedRes.status === 401
            ? ' Если в .env задан ADMIN_SECRET, введи ключ в поле вверху админки (после ввода страница обновится).'
            : ''
        setLoadError(`${errs.join(' · ')}${hint401}`)
      }
    } catch {
      setAllLineups([])
      setHiddenSeedIds([])
      setSeeds([])
      setLoadError('Ошибка сети при загрузке данных')
    } finally {
      setLoading(false)
    }
  }, [mapId])

  useEffect(() => {
    load()
  }, [load])

  const addSecondStepRef = useRef<string | null>(null)
  addSecondStepRef.current = addSecondStepId

  const exitAddModeFully = useCallback(() => {
    const sid = addSecondStepRef.current
    if (sid) setAllLineups((prev) => prev.filter((l) => l.id !== sid))
    setAddSecondStepId(null)
    setAddMode(false)
  }, [])

  useEffect(() => {
    if (!selectedSeed) return
    setSeedForm({
      title: selectedSeed.title,
      type: selectedSeed.type,
      description:
        selectedSeed.description === 'unused' ? '' : selectedSeed.description,
      video_url: selectedSeed.media_url ?? '',
      gallery: (selectedSeed.gallery_urls ?? []).join('\n'),
    })
  }, [selectedSeed])

  useEffect(() => {
    setRadarPick(null)
  }, [selectedKey])

  const saveToServer = async (lineups: CustomLineup[], hidden: string[]) => {
    setSaveMsg('Сохранение…')
    try {
      const r = await fetch('/api/admin/lineups', {
        method: 'POST',
        headers: adminFetchHeaders(true),
        body: JSON.stringify({ lineups, hidden_seed_ids: hidden }),
      })
      if (!r.ok) {
        let detail = ''
        try {
          const j = (await r.json()) as { error?: string }
          if (typeof j?.error === 'string') detail = j.error
        } catch {
          /* ignore */
        }
        const msg =
          r.status === 401
            ? `Не сохранено: нужен ключ${detail ? ` — ${detail}` : ''}. Введи ADMIN_SECRET в поле вверху страницы.`
            : `Ошибка сохранения${detail ? `: ${detail}` : ''} (${r.status})`
        setSaveMsg(msg)
        await load()
        return false
      }
      bumpLineupsVersionInBrowser()
      setSaveMsg('Сохранено')
      setTimeout(() => setSaveMsg(''), 2000)
      return true
    } catch {
      setSaveMsg('Ошибка сети при сохранении')
      await load()
      return false
    }
  }

  const updateSelectedCustom = (patch: Partial<CustomLineup>) => {
    if (!selectedCustom) return
    setAllLineups((prev) =>
      prev.map((l) => (l.id === selectedCustom.id ? { ...l, ...patch } : l))
    )
  }

  const deleteSelectedCustom = async () => {
    if (!selectedCustom) return
    const next = allLineups.filter((l) => l.id !== selectedCustom.id)
    setAllLineups(next)
    setSelectedKey(null)
    await saveToServer(next, hiddenSeedIds)
  }

  const hideSelectedSeed = async () => {
    if (!selectedSeed) return
    const nextH = [...hiddenSeedIds, selectedSeed.id]
    setHiddenSeedIds(nextH)
    setSelectedKey(null)
    await saveToServer(allLineups, nextH)
  }

  const promoteSeedToCustom = async () => {
    if (!selectedSeed) return
    const posLand = selectedSeed.land_pos ?? selectedSeed.start_pos
    const seedVars = selectedSeed.throw_variants?.filter(Boolean) ?? []
    const land = selectedSeed.land_pos
    if (seedVars.length > 0 && land) {
      const nu: CustomLineup = applyContextDefaults({
        id: crypto.randomUUID(),
        map: mapId,
        layer_file: currentLayer.file,
        x: land.x,
        y: land.y,
        type: seedForm.type,
        side: selectedSeed.side !== 'both' ? selectedSeed.side : undefined,
        title: seedForm.title.trim() || selectedSeed.title,
        description: seedForm.description,
        video_url: '',
        gallery: [],
        position_ids: selectedSeed.position_ids ? [...selectedSeed.position_ids] : undefined,
        throw_variants: seedVars.map((v) => ({
          id: crypto.randomUUID(),
          label: v.label,
          sx: v.start_pos.x,
          sy: v.start_pos.y,
          throw_type: v.throw_type,
          video_url: v.media_url ?? '',
          gallery: [...(v.gallery_urls ?? [])],
          description: v.description ?? '',
        })),
      })
      const nextLineups = [...allLineups, nu]
      const nextHidden = [...hiddenSeedIds, selectedSeed.id]
      setAllLineups(nextLineups)
      setHiddenSeedIds(nextHidden)
      setSelectedKey(keyCustom(nu.id))
      await saveToServer(nextLineups, nextHidden)
      return
    }
    // Даже если в базе был один бросок, переносим в multi-variant формат:
    // одна точка приёма + варианты стартовых позиций.
    const nu: CustomLineup = applyContextDefaults({
      id: crypto.randomUUID(),
      map: mapId,
      layer_file: currentLayer.file,
      x: posLand.x,
      y: posLand.y,
      type: seedForm.type,
      side: selectedSeed.side !== 'both' ? selectedSeed.side : undefined,
      title: seedForm.title.trim() || selectedSeed.title,
      description: seedForm.description,
      video_url: '',
      gallery: [],
      position_ids: selectedSeed.position_ids ? [...selectedSeed.position_ids] : undefined,
      throw_variants: [
        {
          id: crypto.randomUUID(),
          label: 'Вариант 1',
          sx: selectedSeed.start_pos.x,
          sy: selectedSeed.start_pos.y,
          throw_type: selectedSeed.throw_type ?? 'normal',
          video_url: seedForm.video_url.trim(),
          gallery: seedForm.gallery
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          description: '',
        },
      ],
    })
    const nextLineups = [...allLineups, nu]
    const nextHidden = [...hiddenSeedIds, selectedSeed.id]
    setAllLineups(nextLineups)
    setHiddenSeedIds(nextHidden)
    setSelectedKey(keyCustom(nu.id))
    await saveToServer(nextLineups, nextHidden)
  }

  const lastTouchRef = useRef(0)
  const zoomRef = useRef(1)
  const suppressOverlayPickClickRef = useRef(false)

  const dragRef = useRef<{
    pid: number
    panX: number
    panY: number
    sx: number
    sy: number
    panning: boolean
  } | null>(null)

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  useEffect(() => {
    if (zoom <= MIN_ZOOM) setPan({ x: 0, y: 0 })
  }, [zoom])

  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    zoomRef.current = 1
  }, [currentLayer.file])


  const zoomBy = useCallback((delta: number) => {
    const el = containerRef.current
    const rect = el?.getBoundingClientRect()
    const zPrev = zoomRef.current
    const zNew = clampZoom(zPrev + delta)
    if (zNew === zPrev) return
    const F = rect
      ? { x: rect.width / 2, y: rect.height / 2 }
      : { x: 0, y: 0 }
    setZoom(zNew)
    setPan((p) => ({
      x: F.x * (1 - zNew / zPrev) + p.x * (zNew / zPrev),
      y: F.y * (1 - zNew / zPrev) + p.y * (zNew / zPrev),
    }))
    zoomRef.current = zNew
  }, [])

  const resetZoom = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    zoomRef.current = 1
  }, [])

  const processOverlayPick = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      if (!box || box.width <= 0) return
      const x = (clientX - rect.left) / rect.width
      const y = (clientY - rect.top) / rect.height
      const nx = Math.min(1, Math.max(0, x))
      const ny = Math.min(1, Math.max(0, y))

      if (radarPick && selectedCustom) {
        if (radarPick.kind === 'single') {
          setAllLineups((prev) =>
            prev.map((l) => (l.id === selectedCustom.id ? { ...l, x: nx, y: ny } : l))
          )
        } else if (radarPick.kind === 'land') {
          setAllLineups((prev) =>
            prev.map((l) => (l.id === selectedCustom.id ? { ...l, x: nx, y: ny } : l))
          )
        } else {
          const vid = radarPick.variantId
          setAllLineups((prev) =>
            prev.map((l) => {
              if (l.id !== selectedCustom.id) return l
              const vars = l.throw_variants?.map((w) =>
                w.id === vid ? { ...w, sx: nx, sy: ny } : w
              )
              return vars ? { ...l, throw_variants: vars } : l
            })
          )
        }
        setRadarPick(null)
        return
      }

      if (addSecondStepId) {
        setAllLineups((prev) =>
          prev.map((l) => {
            if (l.id !== addSecondStepId) return l
            const vars = l.throw_variants
            if (!vars?.length) return l
            return { ...l, throw_variants: vars.map((w, i) => (i === 0 ? { ...w, sx: nx, sy: ny } : w)) }
          })
        )
        setAddSecondStepId(null)
        setAddMode(false)
        return
      }

      if (!addMode) {
        setSelectedKey(null)
        return
      }

      if (preferTwoClickAdd) {
        const id = crypto.randomUUID()
        const vId = crypto.randomUUID()
        const nu: CustomLineup = applyContextDefaults({
          id,
          map: mapId,
          layer_file: currentLayer.file,
          x: nx,
          y: ny,
          type: 'smoke',
          title: 'Новая точка',
          description: '',
          video_url: '',
          gallery: [],
          throw_variants: [{ id: vId, label: 'Вариант 1', sx: nx, sy: ny, throw_type: 'normal', video_url: '', gallery: [], description: '' }],
        })
        setAllLineups((prev) => [...prev, nu])
        setSelectedKey(keyCustom(id))
        setAddSecondStepId(id)
        return
      }

      const nu: CustomLineup = applyContextDefaults({
        id: crypto.randomUUID(),
        map: mapId,
        layer_file: currentLayer.file,
        x: nx,
        y: ny,
        type: 'smoke',
        title: 'Новая точка',
        description: '',
        video_url: '',
        gallery: [],
      })
      setAllLineups((prev) => [...prev, nu])
      setSelectedKey(keyCustom(nu.id))
      setAddMode(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [box, radarPick, selectedCustom, addSecondStepId, addMode, preferTwoClickAdd, mapId, currentLayer.file, applyContextDefaults]
  )

  const onOverlayPointer = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressOverlayPickClickRef.current) {
      suppressOverlayPickClickRef.current = false
      return
    }
    // In pick / add modes, allow clicks anywhere on the overlay (even on markers)
    const isPickMode = !!(radarPick || addSecondStepId)
    if (!isPickMode && (e.target as HTMLElement).dataset.marker) return
    if (!box || box.width <= 0) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    // Ignore this click if it was already handled by onTouchEnd (dedup)
    if (Date.now() - lastTouchRef.current < 500) return
    processOverlayPick(e.clientX, e.clientY, rect)
  }

  const onOverlayTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.touches.length) return
    const isPickMode = !!(radarPick || addSecondStepId)
    if (!isPickMode && (e.target as HTMLElement).dataset.marker) return
    if (!box || box.width <= 0) return
    e.preventDefault()
    lastTouchRef.current = Date.now()
    const touch = e.touches[0]
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    processOverlayPick(touch.clientX, touch.clientY, rect)
  }

  const onOverlayTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (zoomRef.current > MIN_ZOOM) e.preventDefault()
  }

  const onOverlayTouchEnd = () => {}

  const onPointerDownMap = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (zoomRef.current <= MIN_ZOOM) return
      if (e.button !== 0) return
      if ((e.target as HTMLElement).closest('[data-marker]')) return
      suppressOverlayPickClickRef.current = false
      e.currentTarget.setPointerCapture(e.pointerId)
      dragRef.current = {
        pid: e.pointerId,
        panX: pan.x,
        panY: pan.y,
        sx: e.clientX,
        sy: e.clientY,
        panning: false,
      }
    },
    [pan.x, pan.y],
  )

  const onPointerMoveMap = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d || d.pid !== e.pointerId) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (!d.panning) {
      if (dx * dx + dy * dy <= MAP_PAN_DRAG_THRESHOLD_PX2) return
      d.panning = true
      suppressOverlayPickClickRef.current = true
    }
    setPan({ x: d.panX + dx, y: d.panY + dy })
  }, [])

  const onPointerUpMap = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pid !== e.pointerId) return
    const moved = dragRef.current.panning
    dragRef.current = null
    if (moved) {
      window.setTimeout(() => {
        suppressOverlayPickClickRef.current = false
      }, 0)
    }
  }, [])

  const mapTransformStyle = useMemo(
    () => ({
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
      transformOrigin: '0 0' as const,
      willChange: 'transform' as const,
    }),
    [pan.x, pan.y, zoom],
  )


  const totalCustom = useMemo(
    () => allLineups.filter((l) => l.map === mapId && l.layer_file === currentLayer.file).length,
    [allLineups, mapId, currentLayer.file],
  )
  const totalSeedsLayer = useMemo(
    () =>
      seeds.filter(
        (g) =>
          !hiddenSeedIds.includes(g.id) &&
          (!g.layer_file || g.layer_file === currentLayer.file),
      ).length,
    [seeds, hiddenSeedIds, currentLayer.file],
  )
  const hiddenByContext =
    totalCustom + totalSeedsLayer - (visibleCustom.length + visibleSeeds.length)

  /**
   * Когда модератор «накидывает» точку — чужие маркеры мешают и провоцируют
   * случайные тапы. Скрываем их по правилам:
   *  • второй клик 2-click add → видна только новая точка (она ждёт start),
   *  • перетаскивание (radarPick) → видна только выбранная точка,
   *  • просто addMode → не видно ни одной (чтобы не промахнуться).
   */
  const isAddingNewPoint = addMode && !addSecondStepId
  const renderedCustom = useMemo(() => {
    if (addSecondStepId) {
      return visibleCustom.filter((l) => l.id === addSecondStepId)
    }
    if (radarPick && selectedCustom) {
      return visibleCustom.filter((l) => l.id === selectedCustom.id)
    }
    if (isAddingNewPoint) return []
    return visibleCustom
  }, [visibleCustom, addSecondStepId, radarPick, selectedCustom, isAddingNewPoint])
  const renderedSeeds = useMemo(() => {
    if (radarPick || addSecondStepId || isAddingNewPoint) return []
    return visibleSeeds
  }, [visibleSeeds, radarPick, addSecondStepId, isAddingNewPoint])
  const hiddenInActionMode =
    visibleCustom.length + visibleSeeds.length - (renderedCustom.length + renderedSeeds.length)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0d0d0d] text-white">
      <header className="sticky top-0 z-[42] shrink-0 border-b border-[#2a2a2a] bg-[#0d0d0d]/95 px-app-screen pb-2.5 pt-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-[#0d0d0d]/88">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link
            href="/admin"
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#1a1a1a] px-3 text-sm font-semibold text-white transition-transform active:scale-95 [-webkit-tap-highlight-color:transparent]"
          >
            ← Карты
          </Link>

          <div className="min-w-0 flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-base font-bold">{map.display_name}</span>
            <span className="font-mono text-[11px] text-[#666]">{mapId}</span>
            {contextHeader}
          </div>

          <span className="shrink-0 text-[11px] text-[#888]">
            {visibleCustom.length + visibleSeeds.length} на слое
            {hiddenByContext > 0 && (
              <span className="text-[#666]"> · −{hiddenByContext} фильтром</span>
            )}
          </span>

          {map.layers.length > 1 ? (
            <button
              type="button"
              onClick={() => {
                setActiveLayer((i) => (i + 1) % map.layers.length)
                setSelectedKey(null)
                setRadarPick(null)
                exitAddModeFully()
              }}
              className="h-9 shrink-0 rounded-full bg-[#F0B429]/18 px-3 text-[11px] font-semibold text-[#F0B429]"
            >
              Слой: {currentLayer.label}
            </button>
          ) : null}

          <Link
            href={`/map/${mapId}`}
            className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#333] bg-[#1a1a1a] px-3 text-[11px] font-semibold text-[#eaeaea]"
          >
            Как игроку
          </Link>
          <Link
            href={`/admin/catalog/${mapId}`}
            className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#F0B429]/40 bg-[#F0B429]/08 px-3 text-[11px] font-semibold text-[#F0B429]"
          >
            Каталог
          </Link>
          <AdminChangelogLink variant="button" />
        </div>
      </header>

      {loadError && (
        <div className="mx-app-screen mt-2 shrink-0 rounded-xl border border-red-500/40 bg-red-950/35 px-3 py-2 text-sm text-red-100">
          <p className="font-medium">Не удалось загрузить данные для карты</p>
          <p className="mt-1 text-xs text-red-200/90">{loadError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-2 rounded-lg border border-red-400/50 bg-red-900/40 px-3 py-1.5 text-xs font-semibold text-red-100 active:scale-[0.99]"
          >
            Повторить запрос
          </button>
        </div>
      )}

      {(forcedSide || forcedPositionId) && (
        <p className="text-[11px] text-emerald-300/80 bg-emerald-500/[0.06] px-3 py-1.5 shrink-0 border-b border-emerald-500/10">
          🟢 {t('admin.autoTagged')}: {forcedPositionId ? t('admin.contextHint') : t('admin.contextHintAny')}
        </p>
      )}

      <p className="text-[11px] text-[#888] px-app-screen py-1.5 shrink-0 leading-snug">
        Маркер — редактировать. «Добавить точку»: один клик (простая) или два — приём затем точка старта. Пустое поле без
        режима добавления — снять выбор. Сохранить — когда закончил правку.
      </p>
      {(addMode || radarPick) && hiddenInActionMode > 0 && (
        <p className="text-[11px] text-cyan-300/80 bg-cyan-500/[0.06] px-3 py-1.5 shrink-0 border-b border-cyan-500/10">
          👁️ Чужие маркеры скрыты ({hiddenInActionMode}), чтобы не клекнул случайно. Появятся, когда выйдешь из режима.
        </p>
      )}

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row gap-2 p-2">
        <div
          ref={containerRef}
          className="relative flex-[1.75] min-h-[72vh] md:min-h-0 md:h-full bg-black/40 rounded-xl overflow-hidden map-container"
        >
          <div
            className="absolute inset-0"
            style={mapTransformStyle}
            onPointerDown={onPointerDownMap}
            onPointerMove={onPointerMoveMap}
            onPointerUp={onPointerUpMap}
            onPointerCancel={onPointerUpMap}
          >
            <img
              key={currentLayer.file}
              ref={imgRef}
              src={`/minimaps/${currentLayer.file}`}
              alt=""
              loading="eager"
              fetchPriority="high"
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ objectPosition: radarImageObjectPosition('center') }}
              draggable={false}
            />
            {imgLoaded && box && box.width > 0 && (
              <div
                role="presentation"
                className={`absolute z-[5] ${
                  addMode || radarPick || addSecondStepId
                    ? `cursor-crosshair ring-2 ring-inset ${
                        radarPick ? 'ring-cyan-400/55' : 'ring-[#F0B429]/50'
                      }`
                    : 'cursor-default'
                }`}
                style={{
                  left: box.left,
                  top: box.top,
                  width: box.width,
                  height: box.height,
                  touchAction: 'none',
                }}
                onClick={onOverlayPointer}
                onTouchStart={onOverlayTouchStart}
                onTouchMove={onOverlayTouchMove}
                onTouchEnd={onOverlayTouchEnd}
                onTouchCancel={onOverlayTouchEnd}
              >
                {/* SVG: lines + start dots for selected point */}
                {(() => {
                  const lSel = selectedCustom
                  if (!lSel?.throw_variants?.length) return null
                  const col = GRENADE_COLORS[lSel.type] ?? '#fff'
                  const activeVarId = radarPick?.kind === 'start' ? radarPick.variantId : null
                  return (
                    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" style={{ zIndex: 20 }}>
                      {lSel.throw_variants.map((v) => (
                        <line
                          key={`line-${v.id}`}
                          x1={`${v.sx * 100}%`}
                          y1={`${v.sy * 100}%`}
                          x2={`${lSel.x * 100}%`}
                          y2={`${lSel.y * 100}%`}
                          stroke={col}
                          strokeWidth={activeVarId === v.id ? 2 : 1.5}
                          strokeDasharray="4 3"
                          opacity={activeVarId === v.id ? 0.9 : 0.5}
                        />
                      ))}
                      {lSel.throw_variants.map((v) => (
                        <circle
                          key={`dot-${v.id}`}
                          cx={`${v.sx * 100}%`}
                          cy={`${v.sy * 100}%`}
                          r={activeVarId === v.id ? 8 : 6}
                          fill={col}
                          stroke="#000"
                          strokeWidth="1"
                          opacity={activeVarId === v.id ? 1 : 0.7}
                        />
                      ))}
                    </svg>
                  )
                })()}
                {/* Landing markers (my points) */}
                {renderedCustom.map((l) => {
                  const color = GRENADE_COLORS[l.type] ?? '#fff'
                  const sel = selectedKey === keyCustom(l.id)
                  return (
                    <button
                      key={keyCustom(l.id)}
                      type="button"
                      data-marker="true"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedKey(keyCustom(l.id))
                      }}
                      title="Моя"
                      className="absolute w-8 h-8 rounded-full flex items-center justify-center text-sm pointer-events-auto border-2 transition-transform active:scale-95 ring-2 ring-[#F0B429]/40"
                      style={{
                        left: `${l.x * 100}%`,
                        top: `${l.y * 100}%`,
                        borderColor: color,
                        background: sel ? color : `${color}55`,
                        zIndex: sel ? 25 : 12,
                        transform: `translate(-50%, -50%) scale(${sel ? 1.12 : 1})`,
                      }}
                    >
                      {GRENADE_EMOJIS[l.type] ?? '●'}
                    </button>
                  )
                })}
                {renderedSeeds.map((g) => {
                  const pos = g.land_pos ?? g.start_pos
                  const color = GRENADE_COLORS[g.type] ?? '#888'
                  const sel = selectedKey === keySeed(g.id)
                  return (
                    <button
                      key={keySeed(g.id)}
                      type="button"
                      data-marker="true"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedKey(keySeed(g.id))
                      }}
                      title="База"
                      className="absolute w-7 h-7 rounded-full flex items-center justify-center text-xs pointer-events-auto border-2 border-dashed transition-transform active:scale-95"
                      style={{
                        left: `${pos.x * 100}%`,
                        top: `${pos.y * 100}%`,
                        borderColor: color,
                        background: sel ? `${color}aa` : `${color}33`,
                        zIndex: sel ? 24 : 11,
                        transform: `translate(-50%, -50%) scale(${sel ? 1.12 : 1})`,
                      }}
                    >
                      {GRENADE_EMOJIS[g.type] ?? '●'}
                    </button>
                  )
                })}
                {/* Pulse ring: показывает куда кликнуть в режиме radarPick / addSecondStep */}
                {(radarPick || addSecondStepId) && (
                  <div
                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                    style={{ zIndex: 30 }}
                  >
                    <div className="text-[11px] text-center text-white/70 bg-black/60 rounded-xl px-3 py-2 max-w-[80%]">
                      {addSecondStepId
                        ? '👆 Нажми, откуда бросать'
                        : radarPick?.kind === 'land'
                          ? '🎯 Нажми, куда падает граната'
                          : radarPick?.kind === 'single'
                            ? '📍 Нажми, куда ставить точку'
                            : '🏃 Нажми, откуда бросать этот вариант'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {!imgLoaded && !imgFailed && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#F0B429] border-t-transparent" />
            </div>
          )}
          {imgFailed && (
            <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
              <div className="max-w-md rounded-2xl border border-[#2a2a2a] bg-[#141414] p-4 text-center">
                <p className="text-sm font-semibold text-[#f0b429]">Не удалось загрузить миникарту</p>
                <p className="mt-1 text-xs text-[#aaa]">
                  Проверь файл <code className="text-[#ddd]">/public/minimaps/{currentLayer.file}</code>
                </p>
              </div>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-[#888]">
              Загрузка…
            </div>
          )}
          <div className="absolute right-2 top-2 z-40 flex min-w-fit flex-col items-stretch gap-1">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => zoomBy(WHEEL_ZOOM_STEP * 3)}
                className="h-8 w-8 shrink-0 rounded-full border border-[#333] bg-[#111]/90 text-sm font-bold text-[#F0B429]"
                aria-label="Увеличить карту"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => zoomBy(-WHEEL_ZOOM_STEP * 3)}
                className="h-8 w-8 shrink-0 rounded-full border border-[#333] bg-[#111]/90 text-sm font-bold text-[#F0B429]"
                aria-label="Уменьшить карту"
              >
                -
              </button>
            </div>
            {zoom > MIN_ZOOM + 0.001 && (
              <button
                type="button"
                onClick={resetZoom}
                className="h-8 w-full rounded-full border border-[#F0B429]/55 bg-[#111]/90 px-2 text-[11px] font-semibold text-[#F0B429]"
                aria-label="Сбросить зум карты"
              >
                Сброс
              </button>
            )}
          </div>
        </div>

        <aside className="shrink-0 w-full md:w-[340px] md:min-h-0 md:max-h-full flex flex-col gap-2 bg-[#141414] rounded-xl p-3 min-h-0 max-h-[92vh] md:max-h-full">
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 shrink-0">
            <button
              type="button"
              className={`flex-1 min-w-0 sm:min-w-[140px] ${
                addMode ? `${BTN_PRIMARY} ring-2 ring-white/30` : BTN_SECONDARY
              }`}
              onClick={() => (addMode ? exitAddModeFully() : setAddMode(true))}
            >
              {addMode ? 'Отменить добавление' : '+ Добавить точку'}
            </button>
            <button
              type="button"
              className={`flex-1 min-w-0 sm:min-w-[140px] ${BTN_PRIMARY}`}
              onClick={() => saveToServer(allLineups, hiddenSeedIds)}
            >
              Сохранить на сервер
            </button>
          </div>
          {saveMsg && <p className="text-xs text-center text-[#F0B429] shrink-0">{saveMsg}</p>}
          {radarPick && (
            <p className="text-xs text-center text-cyan-300/90 shrink-0 px-1">
              {radarPick.kind === 'land'
                ? 'Кликни радар: куда падает граната (приём)'
                : radarPick.kind === 'single'
                  ? 'Кликни радар: позиция точки'
                  : 'Кликни радар: откуда бросать (этот вариант)'}
            </p>
          )}
          {addMode && !addSecondStepId && (
            <label className="flex items-center justify-center gap-2 text-[11px] text-[#aaa] shrink-0 cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                className="w-4 h-4 rounded"
                checked={preferTwoClickAdd}
                onChange={(e) => setPreferTwoClickAdd(e.target.checked)}
              />
              Два клика: приём → откуда кидать
            </label>
          )}
          {addMode && addSecondStepId && (
            <p className="text-xs text-center text-[#F0B429] shrink-0 font-medium">
              Шаг 2 из 2: кликни, <strong>откуда</strong> бросать
            </p>
          )}
          {addMode && !addSecondStepId && preferTwoClickAdd && (
            <p className="text-xs text-center text-[#F0B429] shrink-0">
              Шаг 1 из 2: кликни, <strong>куда падает</strong> граната
            </p>
          )}
          {addMode && !addSecondStepId && !preferTwoClickAdd && (
            <p className="text-xs text-center text-[#F0B429] shrink-0">Один клик — позиция точки на радаре</p>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto text-sm">
            {forcedPosition && (
              <div className="pb-2">
                <TargetPositionPhotoCard
                  positionId={forcedPosition.id}
                  label={pickLocalizedLabel(forcedPosition, lang)}
                  photoUrl={forcedPositionPhoto}
                  photoPosition={forcedPositionPhotoPosition}
                  photoFocusX={forcedPositionPhotoFocusX}
                  photoFocusY={forcedPositionPhotoFocusY}
                  photoZoom={forcedPositionPhotoZoom}
                  onUploaded={refreshPositionOverrides}
                />
              </div>
            )}
            {!selectedKey && (
              <p className="text-[#888] pt-2">
                Выбери маркер на карте или включи «Добавить точку».
              </p>
            )}

            {selectedCustom && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-[#F0B429] font-medium">Редактирование · моя точка</p>
                <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded"
                    checked={Boolean(selectedCustom.throw_variants?.length)}
                    onChange={(e) => {
                      if (!selectedCustom) return
                      if (e.target.checked) {
                        updateSelectedCustom({
                          throw_variants: [
                            {
                              id: crypto.randomUUID(),
                              label: 'Вариант 1',
                              sx: selectedCustom.x,
                              sy: selectedCustom.y,
                              throw_type: 'normal',
                              video_url: selectedCustom.video_url,
                              gallery: [...selectedCustom.gallery],
                              description: '',
                            },
                          ],
                          video_url: '',
                          gallery: [],
                        })
                      } else {
                        const v0 = selectedCustom.throw_variants?.[0]
                        if (!v0) {
                          updateSelectedCustom({ throw_variants: undefined })
                          return
                        }
                        updateSelectedCustom({
                          throw_variants: undefined,
                          x: v0.sx,
                          y: v0.sy,
                          video_url: v0.video_url ?? '',
                          gallery: [...(v0.gallery ?? [])],
                        })
                      }
                    }}
                  />
                  <span className="text-sm text-[#ccc]">Несколько бросков в одну точку приёма</span>
                </label>
                {selectedCustom.throw_variants?.length ? (
                  <p className="text-[11px] text-[#666] leading-snug">
                    Координаты <strong className="text-[#888]">Приём X/Y</strong> — куда падает граната (маркер).
                    У каждого варианта — позиция броска и своё видео/фото.
                  </p>
                ) : (
                  <p className="text-[11px] text-[#666]">
                    Одна точка на карте: место броска. Включи режим выше для нескольких стартов в одну раскидку.
                  </p>
                )}
                <label className="block">
                  <span className="text-[#888] text-xs">Название</span>
                  <input
                    className="mt-1 w-full min-h-[48px] rounded-xl bg-[#222] border border-[#333] px-3 py-3 text-base"
                    value={selectedCustom.title}
                    onChange={(e) => updateSelectedCustom({ title: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-[#888] text-xs">Тип</span>
                  <select
                    className="mt-1 w-full min-h-[48px] rounded-xl bg-[#222] border border-[#333] px-3 py-3 text-base"
                    value={selectedCustom.type}
                    onChange={(e) =>
                      updateSelectedCustom({ type: e.target.value as GrenadeType })
                    }
                  >
                    <option value="smoke">Smoke</option>
                    <option value="flash">Flash</option>
                    <option value="molotov">Molotov</option>
                    <option value="he">HE</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[#888] text-xs">{t('admin.sideField')}</span>
                  <select
                    className="mt-1 w-full min-h-[48px] rounded-xl bg-[#222] border border-[#333] px-3 py-3 text-base"
                    value={selectedCustom.side ?? ''}
                    onChange={(e) =>
                      updateSelectedCustom({
                        side: (e.target.value || undefined) as Side | undefined,
                      })
                    }
                  >
                    <option value="">— не задано —</option>
                    <option value="T">T</option>
                    <option value="CT">CT</option>
                    <option value="both">T + CT</option>
                  </select>
                  {forcedSideValue && (
                    <span className="text-[10px] text-emerald-400/80 mt-1 block">
                      {t('admin.sideAuto')}
                    </span>
                  )}
                </label>
                <PositionsField
                  positions={allPositionsForMap}
                  side={selectedCustom.side}
                  value={selectedCustom.position_ids ?? []}
                  onChange={(next) =>
                    updateSelectedCustom({
                      position_ids: next.length ? next : undefined,
                    })
                  }
                  forcedPositionId={forcedPositionId}
                  lang={lang}
                  t={t}
                />
                <label className="block">
                  <span className="text-[#888] text-xs">Общее описание (для всех вариантов)</span>
                  <textarea
                    className="mt-1 w-full rounded-xl bg-[#222] border border-[#333] px-3 py-3 min-h-[88px] text-base"
                    value={selectedCustom.description}
                    onChange={(e) => updateSelectedCustom({ description: e.target.value })}
                  />
                </label>
                {selectedCustom.throw_variants?.length ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="text-[#888] text-xs">Приём X</span>
                        <input
                          type="number"
                          step="0.0001"
                          min={0}
                          max={1}
                          className="mt-1 w-full rounded-xl bg-[#222] border border-[#333] px-2 py-2 text-sm"
                          value={selectedCustom.x}
                          onChange={(e) =>
                            updateSelectedCustom({ x: Number(e.target.value) || 0 })
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="text-[#888] text-xs">Приём Y</span>
                        <input
                          type="number"
                          step="0.0001"
                          min={0}
                          max={1}
                          className="mt-1 w-full rounded-xl bg-[#222] border border-[#333] px-2 py-2 text-sm"
                          value={selectedCustom.y}
                          onChange={(e) =>
                            updateSelectedCustom({ y: Number(e.target.value) || 0 })
                          }
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className={`w-full ${BTN_SECONDARY} text-sm min-h-[44px]`}
                      onClick={() => {
                        exitAddModeFully()
                        setRadarPick({ kind: 'land' })
                      }}
                    >
                      Указать приём кликом по радару
                    </button>
                    <div className="space-y-3 border border-[#333] rounded-xl p-2 bg-[#1a1a1a]">
                      {selectedCustom.throw_variants.map((tv, idx) => (
                        <div
                          key={tv.id}
                          className="border-b border-[#2a2a2a] last:border-0 pb-3 last:pb-0 space-y-2"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-xs font-medium text-[#F0B429]">
                              Бросок {idx + 1}
                            </span>
                            {selectedCustom.throw_variants!.length > 1 && (
                              <button
                                type="button"
                                className="text-xs text-red-400 px-2 py-1"
                                onClick={() => {
                                  const next = selectedCustom.throw_variants!.filter((w) => w.id !== tv.id)
                                  updateSelectedCustom({
                                    throw_variants: next.length ? next : undefined,
                                  })
                                }}
                              >
                                Удалить
                              </button>
                            )}
                          </div>
                          <label className="block">
                            <span className="text-[#888] text-xs">Подпись в шите</span>
                            <input
                              className="mt-1 w-full rounded-lg bg-[#222] border border-[#333] px-2 py-2 text-sm"
                              value={tv.label ?? ''}
                              onChange={(e) => {
                                const next = selectedCustom.throw_variants!.map((w) =>
                                  w.id === tv.id ? { ...w, label: e.target.value } : w
                                )
                                updateSelectedCustom({ throw_variants: next })
                              }}
                            />
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                              <span className="text-[#888] text-xs">Старт X</span>
                              <input
                                type="number"
                                step="0.0001"
                                min={0}
                                max={1}
                                className="mt-1 w-full rounded-lg bg-[#222] border border-[#333] px-2 py-2 text-sm"
                                value={tv.sx}
                                onChange={(e) => {
                                  const sx = Number(e.target.value) || 0
                                  const next = selectedCustom.throw_variants!.map((w) =>
                                    w.id === tv.id ? { ...w, sx } : w
                                  )
                                  updateSelectedCustom({ throw_variants: next })
                                }}
                              />
                            </label>
                            <label className="block">
                              <span className="text-[#888] text-xs">Старт Y</span>
                              <input
                                type="number"
                                step="0.0001"
                                min={0}
                                max={1}
                                className="mt-1 w-full rounded-lg bg-[#222] border border-[#333] px-2 py-2 text-sm"
                                value={tv.sy}
                                onChange={(e) => {
                                  const sy = Number(e.target.value) || 0
                                  const next = selectedCustom.throw_variants!.map((w) =>
                                    w.id === tv.id ? { ...w, sy } : w
                                  )
                                  updateSelectedCustom({ throw_variants: next })
                                }}
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            className={`w-full ${BTN_SECONDARY} text-sm min-h-[44px]`}
                            onClick={() => {
                              exitAddModeFully()
                              setRadarPick({ kind: 'start', variantId: tv.id })
                            }}
                          >
                            Указать старт кликом по радару
                          </button>
                          <label className="block">
                            <span className="text-[#888] text-xs">Тип броска</span>
                            <select
                              className="mt-1 w-full rounded-lg bg-[#222] border border-[#333] px-2 py-2 text-sm"
                              value={tv.throw_type ?? 'normal'}
                              onChange={(e) => {
                                const next = selectedCustom.throw_variants!.map((w) =>
                                  w.id === tv.id ? { ...w, throw_type: e.target.value } : w
                                )
                                updateSelectedCustom({ throw_variants: next })
                              }}
                            >
                              {THROW_SELECT_OPTS.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[#888] text-xs">Описание варианта</span>
                            <textarea
                              className="mt-1 w-full rounded-lg bg-[#222] border border-[#333] px-2 py-2 min-h-[56px] text-sm"
                              value={tv.description ?? ''}
                              onChange={(e) => {
                                const next = selectedCustom.throw_variants!.map((w) =>
                                  w.id === tv.id ? { ...w, description: e.target.value } : w
                                )
                                updateSelectedCustom({ throw_variants: next })
                              }}
                            />
                          </label>
                          <label className="block">
                            <span className="text-[#888] text-xs">Медиа подсказки метода (gif/фото URL)</span>
                            <input
                              type="url"
                              className="mt-1 w-full rounded-lg bg-[#222] border border-[#333] px-2 py-2 text-sm"
                              value={tv.method_media_url ?? ''}
                              placeholder="https://.../throw-method.gif"
                              onChange={(e) => {
                                const next = selectedCustom.throw_variants!.map((w) =>
                                  w.id === tv.id ? { ...w, method_media_url: e.target.value } : w
                                )
                                updateSelectedCustom({ throw_variants: next })
                              }}
                            />
                          </label>
                          <label className="block">
                            <span className="text-[#888] text-xs">Текст подсказки метода броска</span>
                            <textarea
                              className="mt-1 w-full rounded-lg bg-[#222] border border-[#333] px-2 py-2 min-h-[56px] text-sm"
                              value={tv.method_hint ?? ''}
                              placeholder="Зажми D, затем одновременно левая кнопка и пробел..."
                              onChange={(e) => {
                                const next = selectedCustom.throw_variants!.map((w) =>
                                  w.id === tv.id ? { ...w, method_hint: e.target.value } : w
                                )
                                updateSelectedCustom({ throw_variants: next })
                              }}
                            />
                          </label>
                          <MediaFields
                            videoUrl={tv.video_url ?? ''}
                            onVideoUrlChange={(v) => {
                              const next = selectedCustom.throw_variants!.map((w) =>
                                w.id === tv.id ? { ...w, video_url: v } : w
                              )
                              updateSelectedCustom({ throw_variants: next })
                            }}
                            galleryText={(tv.gallery ?? []).join('\n')}
                            onGalleryTextChange={(txt) => {
                              const next = selectedCustom.throw_variants!.map((w) =>
                                w.id === tv.id
                                  ? {
                                      ...w,
                                      gallery: txt
                                        .split('\n')
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                    }
                                  : w
                              )
                              updateSelectedCustom({ throw_variants: next })
                            }}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        className={`w-full ${BTN_SECONDARY}`}
                        onClick={() => {
                          const last = selectedCustom.throw_variants!.slice(-1)[0]
                          updateSelectedCustom({
                            throw_variants: [
                              ...selectedCustom.throw_variants!,
                              newVariantRow(selectedCustom.x, selectedCustom.y, last),
                            ],
                          })
                        }}
                      >
                        + Ещё вариант броска
                      </button>
                      <button
                        type="button"
                        className={`w-full ${BTN_SECONDARY}`}
                        onClick={() => {
                          const newVar = newVariantRow(selectedCustom.x, selectedCustom.y)
                          updateSelectedCustom({
                            throw_variants: [...selectedCustom.throw_variants!, newVar],
                          })
                          exitAddModeFully()
                          setRadarPick({ kind: 'start', variantId: newVar.id })
                        }}
                      >
                        + Вариант кликом по радару
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`w-full ${BTN_SECONDARY} text-sm min-h-[44px]`}
                      onClick={() => {
                        exitAddModeFully()
                        setRadarPick({ kind: 'single' })
                      }}
                    >
                      Указать точку кликом по радару
                    </button>
                    <MediaFields
                      videoUrl={selectedCustom.video_url}
                      onVideoUrlChange={(v) => updateSelectedCustom({ video_url: v })}
                      galleryText={selectedCustom.gallery.join('\n')}
                      onGalleryTextChange={(txt) =>
                        updateSelectedCustom({
                          gallery: txt
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </>
                )}
                <p className="text-[10px] text-[#666]">
                  {selectedCustom.throw_variants?.length
                    ? `Приём: ${selectedCustom.x.toFixed(4)}, ${selectedCustom.y.toFixed(4)}`
                    : `Точка: ${selectedCustom.x.toFixed(4)}, ${selectedCustom.y.toFixed(4)}`}
                </p>
                <button type="button" onClick={deleteSelectedCustom} className={`w-full ${BTN_DANGER}`}>
                  Удалить точку
                </button>
              </div>
            )}

            {selectedSeed && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-[#aaa] font-medium">База (grenades.json)</p>
                <p className="text-[11px] text-[#666]">
                  Правка полей не меняет <code className="text-[#888]">grenades.json</code>. «Сохранить как
                  мою» — создаёт твою точку и убирает базовую с радара. «Удалить» — только скрывает базовую
                  точку у тебя (файл на диске не трогаем).
                </p>
                <label className="block">
                  <span className="text-[#888] text-xs">Название</span>
                  <input
                    className="mt-1 w-full min-h-[48px] rounded-xl bg-[#222] border border-[#333] px-3 py-3 text-base"
                    value={seedForm.title}
                    onChange={(e) => setSeedForm((s) => ({ ...s, title: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-[#888] text-xs">Тип</span>
                  <select
                    className="mt-1 w-full min-h-[48px] rounded-xl bg-[#222] border border-[#333] px-3 py-3 text-base"
                    value={seedForm.type}
                    onChange={(e) =>
                      setSeedForm((s) => ({ ...s, type: e.target.value as GrenadeType }))
                    }
                  >
                    <option value="smoke">Smoke</option>
                    <option value="flash">Flash</option>
                    <option value="molotov">Molotov</option>
                    <option value="he">HE</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[#888] text-xs">Описание</span>
                  <textarea
                    className="mt-1 w-full rounded-xl bg-[#222] border border-[#333] px-3 py-3 min-h-[88px] text-base"
                    value={seedForm.description}
                    onChange={(e) =>
                      setSeedForm((s) => ({ ...s, description: e.target.value }))
                    }
                  />
                </label>
                <MediaFields
                  videoUrl={seedForm.video_url}
                  onVideoUrlChange={(v) => setSeedForm((s) => ({ ...s, video_url: v }))}
                  galleryText={seedForm.gallery}
                  onGalleryTextChange={(txt) => setSeedForm((s) => ({ ...s, gallery: txt }))}
                />
                <div className="flex flex-col gap-3">
                  <button type="button" onClick={promoteSeedToCustom} className={`w-full ${BTN_SUCCESS}`}>
                    Сохранить как мою точку
                  </button>
                  <button type="button" onClick={hideSelectedSeed} className={`w-full ${BTN_WARN}`}>
                    Удалить
                    <span className="block text-xs font-normal opacity-90 mt-0.5">
                      убрать базовую точку с карты
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

interface TargetPositionPhotoCardProps {
  positionId: string
  label: string
  photoUrl?: string
  photoPosition?: 'top' | 'center' | 'bottom'
  photoFocusX?: number
  photoFocusY?: number
  photoZoom?: number
  onUploaded: () => void
}

function TargetPositionPhotoCard({
  positionId,
  label,
  photoUrl,
  photoPosition = 'center',
  photoFocusX,
  photoFocusY,
  photoZoom,
  onUploaded,
}: TargetPositionPhotoCardProps) {
  const t = useT()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const initialFocusY =
    typeof photoFocusY === 'number'
      ? Math.max(0, Math.min(100, photoFocusY))
      : photoPosition === 'top'
        ? 0
        : photoPosition === 'bottom'
          ? 100
          : 50
  const [focusY, setFocusY] = useState(initialFocusY)
  const initialFocusX =
    typeof photoFocusX === 'number'
      ? Math.max(0, Math.min(100, photoFocusX))
      : 50
  const [focusX, setFocusX] = useState(initialFocusX)
  const initialZoom =
    typeof photoZoom === 'number'
      ? Math.max(0.6, Math.min(2.5, photoZoom))
      : 1
  const [zoom, setZoom] = useState(initialZoom)
  const previewTranslateX = (50 - focusX) * 0.6
  const previewTranslateY = (50 - focusY) * 0.9

  useEffect(() => {
    setFocusY(initialFocusY)
    setFocusX(initialFocusX)
    setZoom(initialZoom)
  }, [initialFocusY, initialFocusX, initialZoom])

  const onFile = useCallback(
    async (file: File) => {
      setBusy(true)
      setErr('')
      try {
        const sec = getAdminSecretFromBrowser()
        const screenshotUrl = await uploadGrenadeMedia(file)
        const patch = await fetch('/api/admin/position-overrides', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(sec ? { 'x-admin-secret': sec } : {}),
          },
          body: JSON.stringify({
            id: positionId,
            patch: {
              screenshot_url: screenshotUrl,
              // Новый файл = сбрасываем старое кадрирование, чтобы не получить
              // случайный кроп от предыдущей картинки.
              screenshot_position: 'center',
              screenshot_focus_x: 50,
              screenshot_focus_y: 50,
              screenshot_zoom: 1,
            },
          }),
        })
        if (!patch.ok) throw new Error('patch failed')
        onUploaded()
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Ошибка')
      } finally {
        setBusy(false)
      }
    },
    [onUploaded, positionId],
  )

  const setPosition = useCallback(
    async (next: 'top' | 'center' | 'bottom') => {
      setBusy(true)
      setErr('')
      try {
        const sec = getAdminSecretFromBrowser()
        const r = await fetch('/api/admin/position-overrides', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(sec ? { 'x-admin-secret': sec } : {}),
          },
          body: JSON.stringify({ id: positionId, patch: { screenshot_position: next } }),
        })
        if (!r.ok) throw new Error('save position failed')
        onUploaded()
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Ошибка')
      } finally {
        setBusy(false)
      }
    },
    [onUploaded, positionId],
  )

  const saveMobilePreview = useCallback(async () => {
    setBusy(true)
    setErr('')
    try {
      const sec = getAdminSecretFromBrowser()
      const r = await fetch('/api/admin/position-overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sec ? { 'x-admin-secret': sec } : {}),
        },
        body: JSON.stringify({
          id: positionId,
          patch: {
            screenshot_focus_x: Math.max(0, Math.min(100, focusX)),
            screenshot_focus_y: Math.max(0, Math.min(100, focusY)),
            screenshot_zoom: Math.max(0.6, Math.min(2.5, zoom)),
          },
        }),
      })
      if (!r.ok) throw new Error('save focus failed')
      onUploaded()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }, [focusX, focusY, zoom, onUploaded, positionId])

  return (
    <div className="shrink-0 rounded-xl border border-[#2a2a2a] bg-[#121212] p-2">
      <p className="mb-1 text-[11px] text-[#aaa]">Фото цели: {label}</p>
      <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#161616]">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={label}
            fill
            sizes="320px"
            className="object-cover"
            style={{ objectPosition: `50% ${focusY}%` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[#666]">
            Нет фото
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onFile(file)
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        className="h-9 w-full rounded-lg border border-[#333] bg-[#1f1f1f] text-xs font-semibold text-[#ddd] disabled:opacity-50"
      >
        {busy ? '⏳ Загрузка…' : photoUrl ? `🔁 ${t('admin.replacePhoto')}` : `📷 ${t('admin.uploadPhoto')}`}
      </button>
      {photoUrl && (
        <div className="mt-2 space-y-2">
          <div className="mx-auto w-[170px] rounded-[22px] border border-[#333] bg-black p-2">
            <div className="overflow-hidden rounded-[16px] bg-[#0f0f0f]">
              <div className="relative h-[120px] w-full">
                <Image
                  src={photoUrl}
                  alt={label}
                  fill
                  sizes="170px"
                  className="object-cover"
                  style={{
                    objectPosition: '50% 50%',
                    transform: `translate(${previewTranslateX}%, ${previewTranslateY}%) scale(${zoom})`,
                    transformOrigin: 'center center',
                  }}
                />
              </div>
              <div className="h-[120px] border-t border-[#1f1f1f] bg-[#101010] px-2 py-1.5">
                <p className="text-[10px] text-[#777]">Mobile preview</p>
                <p className="truncate text-[11px] text-[#bbb]">{label}</p>
              </div>
            </div>
          </div>
          <div className="px-1">
            <div className="mb-1 flex items-center justify-between text-[10px] text-[#888]">
              <span>Положение по горизонтали</span>
              <span>{Math.round(focusX)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={focusX}
              onChange={(e) => setFocusX(Number(e.target.value))}
              className="mb-2 w-full"
              disabled={busy}
            />
            <div className="mb-1 flex items-center justify-between text-[10px] text-[#888]">
              <span>Положение по вертикали</span>
              <span>{Math.round(focusY)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={focusY}
              onChange={(e) => setFocusY(Number(e.target.value))}
              className="w-full"
              disabled={busy}
            />
            <div className="mb-1 mt-2 flex items-center justify-between text-[10px] text-[#888]">
              <span>Масштаб</span>
              <span>{zoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.6}
              max={2.5}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
              disabled={busy}
            />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => setPosition('top')}
              className="h-8 rounded-lg border border-[#333] bg-[#1a1a1a] text-[11px] text-[#aaa]"
            >
              Быстро: Верх
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPosition('bottom')}
              className="h-8 rounded-lg border border-[#333] bg-[#1a1a1a] text-[11px] text-[#aaa]"
            >
              Быстро: Низ
            </button>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={saveMobilePreview}
            className="h-8 w-full rounded-lg border border-[#F0B429] bg-[#F0B429]/15 text-[11px] font-semibold text-[#F0B429] disabled:opacity-50"
          >
            Сохранить отображение на мобильном
          </button>
        </div>
      )}
      {err && <p className="mt-1 text-[10px] text-red-300">{err}</p>}
    </div>
  )
}

interface PositionsFieldProps {
  positions: ReturnType<typeof getAllPositionsForMap>
  side: Side | undefined
  value: string[]
  onChange: (next: string[]) => void
  forcedPositionId: string | null
  lang: ReturnType<typeof useLocale>
  t: ReturnType<typeof useT>
}

/**
 * Мульти-выбор `position_ids` для точки. Сначала показываются позиции,
 * совпадающие со стороной точки. Можно показать «все» по чекбоксу.
 */
function PositionsField({
  positions,
  side,
  value,
  onChange,
  forcedPositionId,
  lang,
  t,
}: PositionsFieldProps) {
  const [showAll, setShowAll] = useState(false)
  const selectedSet = useMemo(() => new Set(value), [value])
  const filtered = useMemo(() => {
    // Важно: если позиция уже выбрана (в т.ч. авто-тег из контекста),
    // показываем её всегда, даже если side фильтр её обычно скрывает.
    if (showAll || !side || side === 'both') return positions
    return positions.filter(
      (p) => selectedSet.has(p.id) || p.side === 'both' || p.side === side,
    )
  }, [positions, side, showAll, selectedSet])

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id))
    else onChange([...value, id])
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[#888] text-xs">{t('admin.positionsField')}</span>
        <label className="flex items-center gap-1.5 text-[10px] text-[#aaa] cursor-pointer">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          Показать все
        </label>
      </div>
      <p className="text-[10px] text-[#666] mt-0.5 mb-1.5 leading-snug">
        {t('admin.positionsHint')}
      </p>
      {forcedPositionId && value.includes(forcedPositionId) && (
        <p className="text-[10px] text-emerald-400/80 mb-1.5">
          {t('admin.autoTagged')} ✓
        </p>
      )}
      <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] max-h-44 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-[#666] text-xs p-3 text-center">{t('admin.noPositions')}</p>
        ) : (
          filtered.map((p) => {
            const checked = value.includes(p.id)
            const label = pickLocalizedLabel(p, lang)
            return (
              <label
                key={p.id}
                className={`flex items-center gap-2 px-3 py-2 border-b border-[#222] last:border-0 cursor-pointer touch-manipulation ${
                  checked ? 'bg-[#F0B429]/[0.08]' : ''
                }`}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded shrink-0"
                  checked={checked}
                  onChange={() => toggle(p.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-tight truncate">{label}</div>
                  <div className="text-[10px] text-[#666] truncate">
                    {p.side.toUpperCase()} · {p.category}
                  </div>
                </div>
              </label>
            )
          })
        )}
      </div>
      {value.length > 0 && (
        <p className="text-[10px] text-[#888] mt-1">Выбрано: {value.length}</p>
      )}
    </div>
  )
}
