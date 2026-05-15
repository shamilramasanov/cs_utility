'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useLocale, useT } from '@/i18n'
import type { Grenade } from '@/types'
import type { MapPosition, PositionCategory } from '@/types/positions'
import { countGrenadesForPosition } from '@/lib/positions'
import { getMap } from '@/lib/grenades'
import { pickLocalizedLabel, positionMatchesSearch } from '@/lib/i18n-helpers'
import { SearchInputLeadingIcon } from '@/components/SearchInputLeadingIcon'

interface Props {
  positions: MapPosition[]
  grenades: Grenade[]
  positionCatalog: MapPosition[]
  onPick: (positionId: string) => void
  pickHref?: (positionId: string) => string | undefined
  /** Скрывать позиции без совпадений (актуально, когда задан фильтр гранаты). */
  hideEmpty?: boolean
}

const CATEGORY_ORDER: PositionCategory[] = [
  'spawn',
  'a_site',
  'b_site',
  'mid',
  'rotation',
  'utility',
]

/**
 * Компактный список позиций на шаге picker'а (вкладка «Список»), та же группировка и поиск, что у сетки карточек.
 */
export default function PositionPickerList({
  positions,
  grenades,
  positionCatalog,
  onPick,
  pickHref,
  hideEmpty = false,
}: Props) {
  const t = useT()
  const lang = useLocale()
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
    const m = new Map<PositionCategory, MapPosition[]>()
    for (const p of filtered) {
      const arr = m.get(p.category) ?? []
      arr.push(p)
      m.set(p.category, arr)
    }
    return CATEGORY_ORDER.filter((cat) => m.has(cat)).map((cat) => ({
      cat,
      items: m.get(cat)!,
    }))
  }, [filtered])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pb-3 pt-2">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('position.search')}
            className="h-11 w-full rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] pl-10 pr-3 text-sm placeholder:text-[#555] focus:border-[#444] focus:outline-none"
            inputMode="search"
            autoComplete="off"
            spellCheck={false}
          />
          <SearchInputLeadingIcon />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-[#222] text-[#aaa] transition-transform active:scale-90"
              aria-label={t('common.close')}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain px-4 pb-4 [-webkit-overflow-scrolling:touch]">
        {grouped.length === 0 ? (
          <div className="pt-10 text-center text-sm text-[#666]">{t('common.nothingFound')}</div>
        ) : (
          grouped.map(({ cat, items }) => (
            <section key={cat} className="border-t border-[#242424] pt-4 first:border-t-0 first:pt-0">
              <div className="mb-3 flex items-center gap-3 px-1">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#F0B429] shadow-[0_0_0_3px_rgba(240,180,41,0.14)]"
                  aria-hidden
                />
                <h3 className="shrink-0 text-[13px] font-extrabold uppercase tracking-[0.18em] text-[#f2f2f2]">
                  {t(`position.category.${cat}` as const)}
                </h3>
                <span
                  className="h-px min-w-0 flex-1 bg-gradient-to-r from-[#4a4a4a] via-[#2f2f2f] to-transparent"
                  aria-hidden
                />
              </div>
              <ul
                className="overflow-hidden rounded-2xl border border-[#262626] bg-[#141414]"
                role="list"
              >
                {items.map((pos) => {
                  const count = countGrenadesForPosition(grenades, pos, positionCatalog)
                  const empty = count === 0
                  const label = pickLocalizedLabel(pos, lang)
                  const mapLabel = getMap(pos.map)?.display_name ?? pos.map
                  const href = pickHref?.(pos.id)
                  return (
                    <li key={pos.id} className="border-b border-[#222] last:border-b-0">
                      <ListRow
                        label={label}
                        mapLabel={mapLabel}
                        count={count}
                        empty={empty}
                        href={href}
                        onPick={() => onPick(pos.id)}
                        soonLabel={t('common.soon')}
                      />
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

function ListRow({
  label,
  mapLabel,
  count,
  empty,
  href,
  onPick,
  soonLabel,
}: {
  label: string
  mapLabel: string
  count: number
  empty: boolean
  href?: string
  onPick: () => void
  soonLabel: string
}) {
  const badge = (
    <div
      className="flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-full px-2 text-[11px] font-bold"
      style={{
        background: empty ? 'rgba(255,255,255,0.08)' : '#F0B429',
        color: empty ? '#999' : '#000',
      }}
    >
      {empty ? soonLabel : count}
    </div>
  )

  const main = (
    <>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[#e6e6e6]">{label}</div>
        <div className="truncate text-[10px] text-[#666]">{mapLabel}</div>
      </div>
      {badge}
      <span className="shrink-0 text-[#555]" aria-hidden>
        ›
      </span>
    </>
  )

  const className =
    'flex w-full items-center gap-3 px-3 py-3.5 text-left [-webkit-tap-highlight-color:transparent] transition-opacity active:opacity-[0.92]'

  if (href) {
    return (
      <Link
        href={href}
        scroll={false}
        prefetch
        className={className}
      >
        {main}
      </Link>
    )
  }

  return (
    <button type="button" className={className} onClick={onPick}>
      {main}
    </button>
  )
}
