'use client'

import { useMemo, useState, type MouseEvent } from 'react'
import { useLocale, useT } from '@/i18n'
import type { Grenade } from '@/types'
import type { MapPosition, PositionCategory } from '@/types/positions'
import { countGrenadesForPosition } from '@/lib/positions'
import { getMap } from '@/lib/grenades'
import { pickLocalizedLabel, positionMatchesSearch } from '@/lib/i18n-helpers'

interface Props {
  positions: MapPosition[]
  grenades: Grenade[]
  positionCatalog: MapPosition[]
  onPick: (positionId: string) => void
  pickHref?: (positionId: string) => string
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
}: Props) {
  const t = useT()
  const lang = useLocale()
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () =>
      positions.filter((p) =>
        positionMatchesSearch(p, query, [t(`position.category.${p.category}` as const)]),
      ),
    [positions, query, t],
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" aria-hidden>
            🔍
          </span>
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

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain px-4 pb-4 [-webkit-overflow-scrolling:touch]">
        {grouped.length === 0 ? (
          <div className="pt-10 text-center text-sm text-[#666]">{t('common.nothingFound')}</div>
        ) : (
          grouped.map(({ cat, items }) => (
            <section key={cat}>
              <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-[#777]">
                {t(`position.category.${cat}` as const)}
              </h3>
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
  const navigateNative = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    window.location.assign(href!)
  }

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
      <a href={href} className={className} onClick={navigateNative}>
        {main}
      </a>
    )
  }

  return (
    <button type="button" className={className} onClick={onPick}>
      {main}
    </button>
  )
}
