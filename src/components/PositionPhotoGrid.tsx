'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useLocale, useT } from '@/i18n'
import type { Grenade } from '@/types'
import type { MapPosition, PositionCategory } from '@/types/positions'
import { countGrenadesForPosition, pickPositionCardLineupPhoto } from '@/lib/positions'
import { getMap } from '@/lib/grenades'
import { pickLocalizedLabel, positionMatchesSearch } from '@/lib/i18n-helpers'
import { usePositionOverrides } from '@/lib/usePositionOverrides'
import { SearchInputLeadingIcon } from '@/components/SearchInputLeadingIcon'

interface Props {
  positions: MapPosition[]
  grenades: Grenade[]
  positionCatalog: MapPosition[]
  onPick: (positionId: string) => void
  pickHref?: (positionId: string) => string | undefined
  /**
   * Если активен фильтр (тип гранаты), позиции без совпадений нужно скрывать,
   * иначе плашка «Скоро» вводит в заблуждение: у позиции есть раскидки, просто
   * не для текущего типа.
   */
  hideEmpty?: boolean
}

/** Группировка по категории — как в `PositionList`, чтобы UX был консистентным. */
const CATEGORY_ORDER: PositionCategory[] = [
  'spawn',
  'a_site',
  'b_site',
  'mid',
  'rotation',
  'utility',
]

/**
 * Visual position picker (план §5.4): сетка 2×N карточек 16:9 со скриншотами
 * in-game ракурса. Игрок узнаёт «свою» картинку и тапает по ней.
 *
 * Фото карточки: оверрайд модератора → 4-й кадр галереи раскидки (при нехватке — 3/2/1)
 * → `screenshot_url` позиции; иначе placeholder «Без фото».
 */
export default function PositionPhotoGrid({
  positions,
  grenades,
  positionCatalog,
  onPick,
  pickHref,
  hideEmpty = false,
}: Props) {
  const t = useT()
  const lang = useLocale()
  const { screenshotFor } = usePositionOverrides()
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () =>
      positions.filter((p) => {
        if (!positionMatchesSearch(p, query, [t(`position.category.${p.category}` as const)])) {
          return false
        }
        if (hideEmpty && countGrenadesForPosition(grenades, p, positionCatalog) === 0) {
          return false
        }
        return true
      }),
    [positions, query, t, hideEmpty, grenades, positionCatalog],
  )

  const grouped = useMemo(() => {
    const map = new Map<PositionCategory, MapPosition[]>()
    for (const p of filtered) {
      const arr = map.get(p.category) ?? []
      arr.push(p)
      map.set(p.category, arr)
    }
    return CATEGORY_ORDER
      .filter((cat) => map.has(cat))
      .map((cat) => ({ cat, items: map.get(cat)! }))
  }, [filtered])

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 pt-2 pb-3 shrink-0">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('position.search')}
            className="w-full h-11 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] pl-10 pr-3 text-sm placeholder:text-[#555] focus:outline-none focus:border-[#444]"
            inputMode="search"
            autoComplete="off"
            spellCheck={false}
          />
          <SearchInputLeadingIcon />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#222] text-[#aaa] active:scale-90 transition-transform"
              aria-label={t('common.close')}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 pb-0 space-y-5 [-webkit-overflow-scrolling:touch]">
        {grouped.length === 0 ? (
          <div className="text-center text-[#666] text-sm pt-10">
            {t('common.nothingFound')}
          </div>
        ) : (
          grouped.map(({ cat, items }) => (
            <section key={cat}>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#777] mb-2 px-1">
                {t(`position.category.${cat}` as const)}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {items.map((pos, idxInCat) => {
                  const count = countGrenadesForPosition(grenades, pos, positionCatalog)
                  const empty = count === 0
                  const label = pickLocalizedLabel(pos, lang)
                  const lineupPhoto = pickPositionCardLineupPhoto(grenades, pos, positionCatalog)
                  const photo =
                    screenshotFor(pos.id, undefined) ?? lineupPhoto ?? pos.screenshot_url
                  const mapLabel = getMap(pos.map)?.display_name ?? pos.map
                  /** Первые карточки — приоритет для LCP / быстрого показа сетки. */
                  const imagePriority = idxInCat < 4 && grouped[0]?.cat === cat
                  return (
                    <PositionPhotoCard
                      key={pos.id}
                      pos={pos}
                      mapLabel={mapLabel}
                      photo={photo}
                      imagePriority={imagePriority}
                      label={label}
                      count={count}
                      empty={empty}
                      side={pos.side}
                      onPick={onPick}
                      href={pickHref?.(pos.id)}
                      noPhotoLabel={t('position.noPhoto')}
                      soonLabel={t('common.soon')}
                    />
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

const SIDE_T_BG = '#F0B42922'
const SIDE_T_FG = '#F0B429'
const SIDE_CT_BG = '#3B82F622'
const SIDE_CT_FG = '#3B82F6'

function SidePills({
  side,
  single,
}: {
  side: MapPosition['side']
  single?: 'T' | 'CT'
}) {
  if (single) {
    const isT = single === 'T'
    return (
      <span
        className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[8px] font-bold leading-none"
        style={{
          background: isT ? SIDE_T_BG : SIDE_CT_BG,
          color: isT ? SIDE_T_FG : SIDE_CT_FG,
        }}
      >
        {isT ? 'T-side' : 'CT-side'}
      </span>
    )
  }
  if (side === 'both') {
    return (
      <>
        <span
          className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[8px] font-bold leading-none"
          style={{ background: SIDE_T_BG, color: SIDE_T_FG }}
        >
          T-side
        </span>
        <span
          className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[8px] font-bold leading-none"
          style={{ background: SIDE_CT_BG, color: SIDE_CT_FG }}
        >
          CT-side
        </span>
      </>
    )
  }
  const isT = side === 'T'
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[8px] font-bold leading-none"
      style={{
        background: isT ? SIDE_T_BG : SIDE_CT_BG,
        color: isT ? SIDE_T_FG : SIDE_CT_FG,
      }}
    >
      {isT ? 'T-side' : 'CT-side'}
    </span>
  )
}

interface CardProps {
  pos: MapPosition
  mapLabel: string
  photo?: string
  /** Первые видимые карточки — быстрее подгрузка превью (`next/image` priority). */
  imagePriority?: boolean
  label: string
  count: number
  empty: boolean
  side: MapPosition['side']
  /** Для глобального поиска: одна плашка стороны (при pos.side === both). */
  singlePill?: 'T' | 'CT'
  onPick: (id: string) => void
  href?: string
  /** Перед клиентским переходом — например, пометить «вернуться в поиск». */
  onBeforeClientNavigate?: () => void
  noPhotoLabel: string
  soonLabel: string
}

export function PositionPhotoCard({
  pos,
  mapLabel,
  photo,
  imagePriority = false,
  label,
  count,
  empty,
  side,
  singlePill,
  onPick,
  href,
  onBeforeClientNavigate,
  noPhotoLabel,
  soonLabel,
}: CardProps) {
  /** Не дублируем EN под RU, если оба варианта уже заданы в `label_i18n`. */
  const i18nVals = pos.label_i18n
    ? (Object.values(pos.label_i18n).filter(Boolean) as string[])
    : []
  const bothNamesFromI18n =
    i18nVals.length > 0 && i18nVals.includes(label) && i18nVals.includes(pos.label)
  const showAlt = label !== pos.label && !bothNamesFromI18n

  const className =
    'group relative isolate block aspect-video w-full max-w-full touch-manipulation rounded-2xl border border-[#262626] bg-[#161616] text-left overflow-hidden [-webkit-tap-highlight-color:transparent] cursor-pointer transition-opacity active:opacity-[0.93]'
  const emptyMuted = empty ? 'opacity-[0.92]' : ''

  const deco = (
    <>
      {photo ? (
        <Image
          src={photo}
          alt={label}
          fill
          priority={imagePriority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="pointer-events-none select-none object-cover"
          draggable={false}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
          <div className="flex flex-col items-center gap-1.5 text-[#444]">
            <span className="text-3xl" aria-hidden>
              📸
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest">
              {noPhotoLabel}
            </span>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3 pb-2.5 pt-8">
        <div className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wide text-[#c8c8c8]">
          {mapLabel}
        </div>
        <div className="mb-1.5 flex flex-wrap items-center gap-1">
          <SidePills side={side} single={singlePill} />
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight">{label}</div>
            {showAlt && <div className="truncate text-[10px] text-[#bbb]">{pos.label}</div>}
          </div>
          <div
            className="flex h-6 shrink-0 items-center rounded-full px-2 text-[11px] font-bold"
            style={{
              background: empty ? 'rgba(255,255,255,0.08)' : '#F0B429',
              color: empty ? '#999' : '#000',
            }}
          >
            {empty ? soonLabel : count}
          </div>
        </div>
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        scroll={false}
        prefetch
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
          onBeforeClientNavigate?.()
        }}
        className={`${className} ${emptyMuted}`}
      >
        {deco}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onPick(pos.id)}
      className={`${className} ${emptyMuted}`}
    >
      {deco}
    </button>
  )
}
