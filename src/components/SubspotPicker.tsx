'use client'

import Image from 'next/image'
import { useLocale, useT } from '@/i18n'
import type { MapPosition } from '@/types/positions'
import { pickLocalizedLabel } from '@/lib/i18n-helpers'
import { usePositionOverrides } from '@/lib/usePositionOverrides'

interface Props {
  parent: MapPosition
  subspots: MapPosition[]
  /** Сколько раскидок относится к каждой sub-spot'е (id → count). */
  counts: Record<string, number>
  selectedId: string | null
  onPick: (subspotId: string) => void
  onClose: () => void
}

/**
 * Правая панель «Откуда ты появился?» — после выбора корневой позиции
 * (например, T spawn) показываем sub-spot'ы с фото-карточками 16:9.
 *
 * UX по плану §5.4 (e alt): тап → переход в `?spot=<id>` → панель уезжает,
 * слева появляется галерея раскидок с этой точки, на карте — фильтрованные маркеры.
 */
export default function SubspotPicker({
  parent,
  subspots,
  counts,
  selectedId,
  onPick,
  onClose,
}: Props) {
  const t = useT()
  const lang = useLocale()
  const { screenshotFor } = usePositionOverrides()
  const parentLabel = pickLocalizedLabel(parent, lang)
  const visibleSubspots = subspots.filter((s) => (counts[s.id] ?? 0) > 0)

  return (
    <aside
      className="
        flex flex-col h-full bg-[#0d0d0d]
        border-l border-[#1f1f1f]
      "
      aria-label={t('subspot.pickerTitle')}
    >
      <div className="shrink-0 px-app-screen pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] uppercase tracking-wider text-[#888]">{parentLabel}</p>
            <h3 className="mt-0.5 truncate text-lg font-bold leading-tight">{t('subspot.pickerTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full bg-[#1a1a1a] text-lg leading-none text-[#aaa] transition-transform active:scale-90 [-webkit-tap-highlight-color:transparent]"
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-[#777] max-sm:hidden">
          {t('subspot.pickerHint')}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-app-screen pt-1 pb-3">
        {visibleSubspots.length === 0 ? (
          <p className="text-center text-sm text-[#666] pt-10 px-6">
            {t('subspot.emptyHint')}
          </p>
        ) : (
          <ol className="grid grid-cols-2 gap-2">
            {visibleSubspots.map((s, idx) => {
              const label = pickLocalizedLabel(s, lang)
              const count = counts[s.id] ?? 0
              const active = selectedId === s.id
              const photo = screenshotFor(s.id, s.screenshot_url)
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onPick(s.id)}
                    className="group relative aspect-video w-full rounded-2xl overflow-hidden border bg-[#161616] active:scale-[0.98] transition-transform touch-manipulation text-left"
                    style={{
                      borderColor: active ? '#F0B429' : '#262626',
                      boxShadow: active ? '0 0 0 2px #F0B429 inset' : undefined,
                    }}
                    aria-current={active ? 'true' : undefined}
                  >
                    {photo ? (
                      <Image
                        src={photo}
                        alt={label}
                        fill
                        sizes="(max-width: 768px) 50vw, 200px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1c1c1c] to-[#0f0f0f]">
                        <div className="flex flex-col items-center gap-1 text-[#444]">
                          <span className="text-2xl" aria-hidden>📸</span>
                          <span className="text-[9px] uppercase tracking-widest font-semibold">
                            {t('position.noPhoto')}
                          </span>
                        </div>
                      </div>
                    )}

                    <span
                      className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/70 text-white text-[11px] font-bold flex items-center justify-center"
                      aria-hidden
                    >
                      {idx + 1}
                    </span>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-2.5 pt-5 pb-2">
                      <div className="flex items-end justify-between gap-1.5">
                        <span className="text-[12px] font-semibold leading-tight truncate">
                          {label}
                        </span>
                        <span
                          className="shrink-0 px-1.5 h-5 rounded-full text-[10px] font-bold flex items-center"
                          style={{ background: '#F0B429', color: '#000' }}
                        >
                          {count}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </aside>
  )
}
