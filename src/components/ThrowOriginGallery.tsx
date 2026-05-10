'use client'

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useT } from '@/i18n'
import type { Grenade } from '@/types'
import { buildThrowOriginItems } from '@/lib/throw-origin-items'
import { radarImageObjectPosition, useRadarImageBox } from '@/hooks/useRadarImageBox'
import { GRENADE_COLORS } from '@/lib/grenades'
import MapCornerNameLabel from './MapCornerNameLabel'
import ThrowOriginModeDock from './ThrowOriginModeDock'
import ThrowOriginPositionCards from './ThrowOriginPositionCards'

interface Props {
  contextLabel: string
  grenades: Grenade[]
  selectedKey: string | null
  onPick: (grenade: Grenade, variantIndex: number) => void
  onClose?: () => void
  radarFile?: string
  mapCornerName?: string
  /**
   * Большую карту рисует родитель (`MapPageClient` центр). Маркеры — через тот же `filtered`.
   * Панель «Откуда бросаем?» только хром + карточки (на мобиле карточки под картой в родителе).
   */
  useExternalRadar?: boolean
  /**
   * Только у экземпляра в `md:hidden`: иначе второй (десктопный) затирает флаг и плашка карты снова под оверлей.
   */
  reportMobileFloatingTitleBar?: boolean
  /** Видна фикс. полоса «Откуда бросаем?» над радаром на мобиле. */
  onExternalMapModeOverlayChange?: (visible: boolean) => void
}

export default function ThrowOriginGallery({
  contextLabel,
  grenades,
  selectedKey,
  onPick,
  onClose,
  radarFile,
  mapCornerName,
  useExternalRadar = false,
  onExternalMapModeOverlayChange,
  reportMobileFloatingTitleBar = false,
}: Props) {
  const t = useT()
  const [pickMode, setPickMode] = useState<'list' | 'map'>('map')
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapImgRef = useRef<HTMLImageElement>(null)
  const [mapImgLoaded, setMapImgLoaded] = useState(false)

  const modeLabels = useMemo(() => [t('throwOrigin.mapMode'), t('throwOrigin.listMode')] as const, [t])
  const items = useMemo(() => buildThrowOriginItems(grenades), [grenades])

  const canUseMapMode = Boolean(radarFile)
  const embeddedMapShown = canUseMapMode && pickMode === 'map' && !useExternalRadar
  const mapBox = useRadarImageBox(mapContainerRef, mapImgRef, mapImgLoaded)

  const externalMobileTitleBarVisible = useExternalRadar

  useLayoutEffect(() => {
    if (!reportMobileFloatingTitleBar || !onExternalMapModeOverlayChange) return
    onExternalMapModeOverlayChange(externalMobileTitleBarVisible)
    return () => onExternalMapModeOverlayChange(false)
  }, [
    reportMobileFloatingTitleBar,
    externalMobileTitleBarVisible,
    onExternalMapModeOverlayChange,
  ])

  const onModeChange = useCallback((mode: 'map' | 'list') => setPickMode(mode), [])

  const headerSection = (
    <div
      className={
        useExternalRadar
          ? 'shrink-0 px-app-screen py-1 md:px-5 md:pb-3 md:pt-3 lg:px-6'
          : 'shrink-0 px-app-screen pb-3 pt-4 md:px-5 md:pb-4 md:pt-5 lg:px-6'
      }
    >
      <div className="flex min-h-0 items-center justify-between gap-2 md:min-h-[2.75rem] md:gap-3">
        <div className="min-w-0 flex-1 pr-1">
          <p className="sr-only">{contextLabel}</p>
          <h3
            className={`truncate font-semibold leading-tight tracking-tight md:font-bold md:leading-snug lg:text-2xl ${
              useExternalRadar
                ? 'text-[13px] text-white/92 max-md:uppercase max-md:tracking-wide md:text-xl md:normal-case md:tracking-normal'
                : 'text-lg md:text-xl'
            }`}
          >
            {t('throwOrigin.title')}
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`flex shrink-0 touch-manipulation items-center justify-center rounded-full bg-[#161616] text-[#888] ring-1 ring-white/[0.06] transition-transform active:scale-90 [-webkit-tap-highlight-color:transparent] ${
              useExternalRadar
                ? 'size-8 text-base leading-none max-md:size-7 max-md:text-sm md:size-9 md:text-lg'
                : 'h-9 w-9 text-lg leading-none'
            }`}
            aria-label={t('common.close')}
          >
            ×
          </button>
        )}
      </div>
      {!useExternalRadar ? (
        <p className="mt-1 max-sm:hidden text-[11px] leading-snug text-[#777] md:mt-1.5 md:text-xs md:leading-relaxed lg:text-[13px]">
          {t('throwOrigin.hint')}
        </p>
      ) : null}
    </div>
  )

  const embeddedRadarBlock =
    radarFile && embeddedMapShown ? (
      <div className="flex h-full min-h-0 flex-col gap-2 px-app-screen pb-28 md:px-5 md:pb-8 lg:px-6">
        <p className="px-1 text-[11px] leading-snug text-[#8d8d8d]">{t('throwOrigin.mapHint')}</p>
        <div
          ref={mapContainerRef}
          className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#111]"
        >
          {mapCornerName ? <MapCornerNameLabel name={mapCornerName} /> : null}
          <img
            ref={mapImgRef}
            src={`/minimaps/${radarFile}`}
            alt=""
            className="h-full w-full object-contain"
            style={{ objectPosition: radarImageObjectPosition('center') }}
            draggable={false}
            onLoad={() => setMapImgLoaded(true)}
            onError={() => setMapImgLoaded(false)}
          />
          {mapImgLoaded && mapBox && (
            <div
              className="absolute z-[5]"
              style={{
                left: mapBox.left,
                top: mapBox.top,
                width: mapBox.width,
                height: mapBox.height,
              }}
            >
              {items.map((item) => {
                if (!item.startPos) return null
                const isSelected = selectedKey === item.key
                const color = GRENADE_COLORS[item.grenade.type] ?? '#4FC3F7'
                return (
                  <button
                    key={`map-${item.key}`}
                    type="button"
                    onClick={() => onPick(item.grenade, item.variantIndex)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform active:scale-90"
                    style={{
                      left: `${item.startPos.x * 100}%`,
                      top: `${item.startPos.y * 100}%`,
                      zIndex: isSelected ? 20 : 10,
                    }}
                    title={item.title}
                    aria-label={item.title}
                  >
                    <span
                      className="block h-3.5 w-3.5 rounded-full border-2"
                      style={{
                        background: isSelected ? color : `${color}33`,
                        borderColor: color,
                        boxShadow: isSelected ? `0 0 10px ${color}88` : '0 0 0 1px #0b0b0b',
                        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    ) : null

  if (!useExternalRadar) {
    return (
      <>
        <aside className="relative flex h-full flex-col overflow-hidden border-r border-[#1f1f1f] bg-[#0d0d0d] pb-[max(4.75rem,env(safe-area-inset-bottom,0px)+3.25rem)] md:pb-0">
          {headerSection}
          <div
            className={`min-h-0 flex-1 overflow-hidden pt-1 md:pt-2 ${embeddedMapShown ? '' : 'overflow-y-auto pb-28 md:overflow-y-auto md:pb-6'}`}
          >
            {items.length === 0 ? (
              <p className="px-app-screen pt-10 text-center text-sm text-[#666]">{t('throwOrigin.empty')}</p>
            ) : embeddedMapShown ? (
              embeddedRadarBlock
            ) : pickMode === 'list' || !canUseMapMode ? (
              <ThrowOriginPositionCards
                items={items}
                selectedKey={selectedKey}
                onPick={onPick}
                className="px-app-screen lg:px-6"
              />
            ) : null}
          </div>
        </aside>
        <ThrowOriginModeDock
          mode={pickMode === 'map' ? 'map' : 'list'}
          onModeChange={onModeChange}
          labels={[...modeLabels]}
          ariaLabel={t('throwOrigin.modeDockAria')}
          embedded={false}
        />
      </>
    )
  }

  /** Внешний радар: десктоп — заголовок + подсказка + карточки; мобила — только шапка (карточки под картой в `MapPageClient`). */
  return (
    <>
      <aside className="hidden h-full overflow-hidden md:flex md:flex-col md:border-r md:border-[#1f1f1f] md:bg-[#0d0d0d]">
        {headerSection}
        <div className="flex min-h-0 flex-1 flex-col px-app-screen pb-2 pt-1 md:px-5 lg:px-6">
          <p className="text-[11px] leading-relaxed text-[#8d8d8d]">{t('throwOrigin.externalMapHint')}</p>
          <div className="min-h-0 flex-1 overflow-y-auto pt-2">
            {items.length === 0 ? (
              <p className="pt-6 text-center text-sm text-[#666]">{t('throwOrigin.empty')}</p>
            ) : (
              <ThrowOriginPositionCards
                items={items}
                selectedKey={selectedKey}
                onPick={onPick}
                /** На ПК панель может быть и узкой (~720px), и во всю ширину окна
                    — увеличиваем плотность сетки на больших ширинах. */
                gridClassName="px-0 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
              />
            )}
          </div>
        </div>
      </aside>

      <div className="pointer-events-none fixed inset-x-0 top-below-site-header z-[28] md:hidden">
        <div className="pointer-events-auto border-b border-white/[0.07] bg-[#0a0a0a]/96 shadow-[0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur-md supports-[backdrop-filter]:bg-[#0a0a0a]/88">
          {headerSection}
        </div>
      </div>
    </>
  )
}
