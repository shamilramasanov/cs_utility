'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import type { Grenade } from '@/types'
import { GRENADE_COLORS } from '@/lib/grenades'
import { throwOriginStrokeColor, throwOriginStrokeWidth } from '@/lib/map-marker-visual'
import { sideKeyToSide, type SideKey } from '@/lib/side'
import RadarLandMarker from '@/components/map/RadarLandMarker'
import { radarImageObjectPosition, useRadarImageBox } from '@/hooks/useRadarImageBox'

interface Props {
  radarFile: string
  grenades: Grenade[]
  /** Тап по маркеру цели: подсветка и линии к точкам броска, без шита. */
  previewGrenade: Grenade | null
  onPreviewChange: (g: Grenade | null) => void
  /** Выбрана раскидка — открыт BottomSheet / мультимедиа. */
  selectedGrenade: Grenade | null
  onSelect: (g: Grenade | null) => void
  /** Тап по точке броска на карте — открыть мультимедиа с этим вариантом. */
  onThrowVariantSelect: (g: Grenade, variantIndex: number) => void
  /** Позиция радара внутри контейнера (по умолчанию центр). */
  imagePosition?: 'center' | 'top'
  /** Активный вариант броска при selected с throw_variants */
  activeThrowVariantIndex?: number
  /** Маркер «здесь стоит игрок» для выбранной sub-spot'ы. */
  subspotMarker?: { x: number; y: number; label: string } | null
  /** Сообщить родителю текущий масштаб (для блокировки горизонтальных свайпов карусели). */
  onZoomChange?: (zoom: number) => void
  /** Название карты в одной строке с кнопками зума (слева). */
  mapTitle?: string
  /** Текущая сторона экрана: для `both`-раскидок кольцо выглядит как активная сторона. */
  displaySide?: SideKey
}

/** Маркер приёма (куда падает утилита) — чуть компактнее, чем раньше. */
const MARKER_SIZE = 24

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const WHEEL_ZOOM_STEP = 0.09

function clampZoom(z: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
}

function touchDistance(a: React.Touch, b: React.Touch) {
  const dx = a.clientX - b.clientX
  const dy = a.clientY - b.clientY
  return Math.hypot(dx, dy)
}

/** После pinch/pan браузер шлёт click на карту — игнорируем, чтобы не сбрасывать цель. */
const TAP_MOVE_SUPPRESS_PX2 = 12 * 12

export default function MapView({
  radarFile,
  grenades,
  previewGrenade,
  onPreviewChange,
  selectedGrenade,
  onSelect,
  onThrowVariantSelect,
  imagePosition = 'center',
  activeThrowVariantIndex = 0,
  subspotMarker = null,
  onZoomChange,
  mapTitle,
  displaySide,
}: Props) {
  /** Область радара без тулбара — сюда вписан `img` (`object-fit: contain`), от неё считаем маркеры. */
  const radarLayoutRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const yAlign = imagePosition === 'top' ? 'top' : 'center'
  const box = useRadarImageBox(radarLayoutRef, imgRef, imgLoaded, yAlign)

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const pinchRef = useRef<{
    dist0: number
    z0: number
    pan0: { x: number; y: number }
    focal: { x: number; y: number }
  } | null>(null)
  const panTouchRef = useRef<{ px: number; py: number; panX: number; panY: number } | null>(null)
  /** Следующий click по карте не сбрасывает превью (после multitouch / сдвига пальцем). */
  const suppressMapClearClickRef = useRef(false)
  const zoomRef = useRef(1)

  const invZoom = 1 / zoom

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  useEffect(() => {
    onZoomChange?.(zoom)
  }, [zoom, onZoomChange])

  useEffect(() => {
    if (zoom <= MIN_ZOOM) setPan({ x: 0, y: 0 })
  }, [zoom])

  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [radarFile])

  useEffect(() => {
    const el = radarLayoutRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const dir = e.deltaY < 0 ? 1 : -1
      const rect = el.getBoundingClientRect()
      const F = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      const zPrev = zoomRef.current
      const zNew = clampZoom(zPrev + dir * WHEEL_ZOOM_STEP)
      if (zNew === zPrev) return
      setZoom(zNew)
      setPan((p) => ({
        x: F.x * (1 - zNew / zPrev) + p.x * (zNew / zPrev),
        y: F.y * (1 - zNew / zPrev) + p.y * (zNew / zPrev),
      }))
      zoomRef.current = zNew
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    setImgLoaded(false)
    setImgFailed(false)

    const markLoaded = () => {
      if (img.naturalWidth > 0) {
        setImgLoaded(true)
        setImgFailed(false)
      }
    }

    const markFailed = () => {
      setImgLoaded(false)
      setImgFailed(true)
    }

    if (img.complete) {
      if (img.naturalWidth > 0) markLoaded()
      else markFailed()
      return
    }

    img.addEventListener('load', markLoaded)
    img.addEventListener('error', markFailed)
    return () => {
      img.removeEventListener('load', markLoaded)
      img.removeEventListener('error', markFailed)
    }
  }, [radarFile])

  const handleMapClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (suppressMapClearClickRef.current) {
      suppressMapClearClickRef.current = false
      return
    }
    const t = e.target as Element
    if (t.closest('[data-marker]')) return
    if (t.closest('[data-throw-origin]')) return
    onPreviewChange(null)
    onSelect(null)
  }, [onPreviewChange, onSelect])

  const onTouchStartCapture = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length >= 2) {
        suppressMapClearClickRef.current = true
        const layout = radarLayoutRef.current
        if (!layout) return
        const rect = layout.getBoundingClientRect()
        const t0 = e.touches[0]
        const t1 = e.touches[1]
        const d = Math.max(touchDistance(t0, t1), 1e-3)
        pinchRef.current = {
          dist0: d,
          z0: zoomRef.current,
          pan0: { x: pan.x, y: pan.y },
          focal: {
            x: (t0.clientX + t1.clientX) / 2 - rect.left,
            y: (t0.clientY + t1.clientY) / 2 - rect.top,
          },
        }
        panTouchRef.current = null
      } else if (e.touches.length === 1) {
        suppressMapClearClickRef.current = false
        if (zoomRef.current > MIN_ZOOM) {
          const t = e.touches[0]
          panTouchRef.current = { px: t.clientX, py: t.clientY, panX: pan.x, panY: pan.y }
        }
        pinchRef.current = null
      }
    },
    [pan.x, pan.y],
  )

  const onTouchMoveCapture = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault()
      const pr = pinchRef.current
      const d = touchDistance(e.touches[0], e.touches[1])
      const zNew = clampZoom(pr.z0 * (d / pr.dist0))
      const z0 = pr.z0
      setZoom(zNew)
      setPan({
        x: pr.focal.x * (1 - zNew / z0) + pr.pan0.x * (zNew / z0),
        y: pr.focal.y * (1 - zNew / z0) + pr.pan0.y * (zNew / z0),
      })
      zoomRef.current = zNew
    } else if (e.touches.length === 1 && panTouchRef.current && zoomRef.current > MIN_ZOOM) {
      e.preventDefault()
      const t = e.touches[0]
      const { px, py, panX, panY } = panTouchRef.current
      const dx = t.clientX - px
      const dy = t.clientY - py
      if (dx * dx + dy * dy > TAP_MOVE_SUPPRESS_PX2) {
        suppressMapClearClickRef.current = true
      }
      setPan({ x: panX + dx, y: panY + dy })
    }
  }, [])

  const onTouchEndCapture = useCallback(() => {
    pinchRef.current = null
    panTouchRef.current = null
  }, [])

  const dragRef = useRef<{ pid: number; panX: number; panY: number; cx: number; cy: number } | null>(
    null,
  )

  const onPointerDownMap = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (zoomRef.current <= MIN_ZOOM) return
      if (e.button !== 0) return
      if ((e.target as HTMLElement).closest('[data-marker]')) return
      if ((e.target as HTMLElement).closest('[data-throw-origin]')) return
      e.currentTarget.setPointerCapture(e.pointerId)
      dragRef.current = {
        pid: e.pointerId,
        panX: pan.x,
        panY: pan.y,
        cx: e.clientX,
        cy: e.clientY,
      }
    },
    [pan.x, pan.y],
  )

  const onPointerMoveMap = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d || d.pid !== e.pointerId) return
    setPan({ x: d.panX + (e.clientX - d.cx), y: d.panY + (e.clientY - d.cy) })
  }, [])

  const onPointerUpMap = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pid === e.pointerId) dragRef.current = null
  }, [])

  const mapTransformStyle = useMemo(
    () => ({
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
      /** top-left origin: `pan` + `scale` = экранная точка F сохраняется при зуме (см. формулу pan). */
      transformOrigin: '0 0' as const,
      willChange: 'transform' as const,
    }),
    [pan.x, pan.y, zoom],
  )

  const lineGrenade = selectedGrenade ?? previewGrenade
  const dimNonFocusedMarkers = Boolean(lineGrenade)
  const showResetZoom = zoom > MIN_ZOOM + 0.001

  const zoomBy = useCallback((delta: number) => {
    const el = radarLayoutRef.current
    const rect = el?.getBoundingClientRect()
    const zPrev = zoomRef.current
    const zNew = clampZoom(zPrev + delta)
    if (zNew === zPrev) return
    const F = rect ? { x: rect.width / 2, y: rect.height / 2 } : { x: 0, y: 0 }
    setZoom(zNew)
    setPan((p) => ({
      x: F.x * (1 - zNew / zPrev) + p.x * (zNew / zPrev),
      y: F.y * (1 - zNew / zPrev) + p.y * (zNew / zPrev),
    }))
    zoomRef.current = zNew
  }, [])

  const resetZoom = useCallback(() => {
    setZoom(MIN_ZOOM)
    setPan({ x: 0, y: 0 })
    zoomRef.current = MIN_ZOOM
  }, [])

  return (
    <div
      className="map-container flex h-full min-h-0 w-full select-none touch-none flex-col"
      onClick={handleMapClick}
      onTouchStartCapture={onTouchStartCapture}
      onTouchMoveCapture={onTouchMoveCapture}
      onTouchEndCapture={onTouchEndCapture}
      onTouchCancelCapture={onTouchEndCapture}
    >
      <div
        className={`pointer-events-auto flex min-h-[3rem] shrink-0 items-center gap-2 border-b border-[#2a2a2a] bg-[#0d0d0d]/96 px-app-screen py-1 max-md:py-1 ${
          mapTitle ? 'justify-between' : 'justify-end'
        }`}
        role="toolbar"
        aria-label="Масштаб миникарты"
        onClick={(e) => e.stopPropagation()}
      >
        {mapTitle ? (
          <p
            className="flex h-9 min-w-0 max-w-[min(55%,14rem)] shrink items-center truncate rounded-md bg-black/55 px-2 text-[10px] font-black uppercase leading-none tracking-wider text-white/95 shadow-[0_2px_12px_rgba(0,0,0,0.45)] backdrop-blur-md sm:max-w-[min(65%,18rem)] sm:px-2.5 sm:text-[11px]"
            title={mapTitle}
          >
            {mapTitle}
          </p>
        ) : null}
        <div className="flex shrink-0 items-center gap-2">
          {showResetZoom ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                resetZoom()
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="h-9 shrink-0 rounded-full border border-[#F0B429]/55 bg-[#161616] px-3 text-[11px] font-semibold leading-none text-[#F0B429]"
              aria-label="Сбросить зум карты"
            >
              Сброс
            </button>
          ) : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                zoomBy(WHEEL_ZOOM_STEP * 3)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#333] bg-[#161616] text-base font-bold leading-none text-[#F0B429]"
              aria-label="Увеличить карту"
            >
              +
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                zoomBy(-WHEEL_ZOOM_STEP * 3)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#333] bg-[#161616] text-base font-bold leading-none text-[#F0B429]"
              aria-label="Уменьшить карту"
            >
              -
            </button>
          </div>
        </div>
      </div>

      <div
        className={`relative min-h-0 flex-1 overflow-hidden md:min-h-[min(48vh,600px)] ${
          imagePosition === 'top' ? 'pt-1 max-md:pt-1.5' : 'pt-1 max-md:pt-2'
        }`}
      >
        <div
          ref={radarLayoutRef}
          className="relative h-full w-full"
          style={mapTransformStyle}
          onPointerDown={onPointerDownMap}
          onPointerMove={onPointerMoveMap}
          onPointerUp={onPointerUpMap}
          onPointerCancel={onPointerUpMap}
        >
        <img
          ref={imgRef}
          src={`/minimaps/${radarFile}`}
          alt="Map radar"
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectPosition: radarImageObjectPosition(yAlign) }}
          draggable={false}
        />

        {imgLoaded && box && box.width > 0 && (
          <div
            className="pointer-events-none absolute z-[5]"
            style={{
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
            }}
          >
            {subspotMarker && (
              <div
                className="pointer-events-none absolute z-[6]"
                style={{
                  left: `${subspotMarker.x * 100}%`,
                  top: `${subspotMarker.y * 100}%`,
                  transform: `translate(-50%, -50%) scale(${invZoom})`,
                }}
                aria-hidden
              >
                <span className="absolute inset-0 -m-3 animate-ping rounded-full border-2 border-[#F0B429] opacity-60" />
                <span className="relative block h-4 w-4 rounded-full bg-[#F0B429] shadow-[0_0_12px_rgba(240,180,41,0.8)] ring-2 ring-black" />
                <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-[#F0B429]/40 bg-black/85 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#F0B429]">
                  {subspotMarker.label}
                </span>
              </div>
            )}
            {grenades.map((g) => {
              const pos = g.land_pos ?? g.start_pos
              const isHighlighted =
                previewGrenade?.id === g.id || selectedGrenade?.id === g.id
              const color = GRENADE_COLORS[g.type] ?? '#fff'
              const markerSide = g.side === 'both' && displaySide ? sideKeyToSide(displaySide) : g.side
              return (
                <div
                  key={g.id}
                  className="pointer-events-none absolute"
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                    transform: `translate(-50%, -50%) scale(${invZoom})`,
                    zIndex: isHighlighted ? 30 : 10,
                  }}
                >
                  <RadarLandMarker
                    type={g.type}
                    side={markerSide}
                    variant="public"
                    selected={isHighlighted}
                    muted={dimNonFocusedMarkers && !isHighlighted}
                    color={color}
                    sizePx={MARKER_SIZE}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(null)
                      onPreviewChange(previewGrenade?.id === g.id ? null : g)
                    }}
                  />
                </div>
              )
            })}

            {lineGrenade?.land_pos &&
              (() => {
                const land = lineGrenade.land_pos
                const col = GRENADE_COLORS[lineGrenade.type]
                const s = invZoom
                const vars = lineGrenade.throw_variants?.filter((v) => v.start_pos) ?? []
                const origins =
                  vars.length > 0
                    ? vars.map((v, i) => ({ i, pos: v.start_pos! }))
                    : lineGrenade.start_pos
                      ? [{ i: 0, pos: lineGrenade.start_pos }]
                      : []
                if (origins.length === 0 || !land) return null
                const viSel =
                  selectedGrenade?.id === lineGrenade.id
                    ? Math.min(
                        Math.max(0, activeThrowVariantIndex),
                        origins.length - 1,
                      )
                    : -1
                const lineSide =
                  lineGrenade.side === 'both' && displaySide
                    ? sideKeyToSide(displaySide)
                    : lineGrenade.side
                const strokeTeam = throwOriginStrokeColor(lineSide)
                const sw = throwOriginStrokeWidth(lineSide, s)
                const gt = lineGrenade.type

                return (
                  <svg
                    className="absolute inset-0 h-full w-full overflow-visible"
                    style={{ zIndex: 20, pointerEvents: 'auto' }}
                  >
                    {origins.map(({ i, pos }) => (
                      <line
                        key={`tr-line-${lineGrenade.id}-${i}`}
                        x1={`${pos.x * 100}%`}
                        y1={`${pos.y * 100}%`}
                        x2={`${land.x * 100}%`}
                        y2={`${land.y * 100}%`}
                        stroke={col}
                        strokeWidth={(viSel === i ? 2.4 : 2) * s}
                        strokeDasharray={`${4 * s} ${4 * s}`}
                        opacity={
                          viSel >= 0 ? (viSel === i ? 0.92 : 0.38) : 0.72
                        }
                        style={{ pointerEvents: 'none' }}
                      />
                    ))}
                    {origins.map(({ i, pos }) => {
                      const baseR = (viSel === i ? 8.5 : 6.5) * s
                      const rMul =
                        gt === 'smoke' ? 1.08 : gt === 'flash' ? 0.82 : gt === 'molotov' ? 1.02 : 0.94
                      const r = baseR * rMul
                      return (
                        <circle
                          key={`tr-or-${lineGrenade.id}-${i}`}
                          data-throw-origin="true"
                          cx={`${pos.x * 100}%`}
                          cy={`${pos.y * 100}%`}
                          r={r}
                          fill={col}
                          stroke={strokeTeam}
                          strokeWidth={sw}
                          opacity={0.92}
                          className="[-webkit-tap-highlight-color:transparent]"
                          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onThrowVariantSelect(lineGrenade, i)
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                        />
                      )
                    })}
                  </svg>
                )
              })()}
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
                Отсутствует файл <code className="text-[#ddd]">/public/minimaps/{radarFile}</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

