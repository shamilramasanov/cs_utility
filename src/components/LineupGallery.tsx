'use client'

import Image from 'next/image'
import { useT } from '@/i18n'
import type { Grenade } from '@/types'
import { GRENADE_COLORS, GRENADE_EMOJIS } from '@/lib/grenades'

interface Props {
  /** Заголовок панели — обычно sub-spot label или общая позиция. */
  contextLabel: string
  grenades: Grenade[]
  selectedId: string | null
  onPick: (g: Grenade) => void
  onClose?: () => void
}

/**
 * Левая панель «Куда бросать?» — фото-галерея раскидок с конкретной точки.
 *
 * Превью карточки берём в порядке: gallery_urls[0] → media_url (как poster
 * для видео) → placeholder с цветом по типу гранаты.
 */
export default function LineupGallery({
  contextLabel,
  grenades,
  selectedId,
  onPick,
  onClose,
}: Props) {
  const t = useT()

  return (
    <aside
      className="flex flex-col h-full bg-[#0d0d0d] border-r border-[#1f1f1f]"
      aria-label={t('lineupGallery.title')}
    >
      <div className="shrink-0 px-app-screen pb-3 pt-4 md:px-5 md:pb-4 md:pt-5 lg:px-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] uppercase tracking-wider text-[#888] md:text-xs">{contextLabel}</p>
            <h3 className="mt-0.5 truncate text-lg font-bold leading-tight md:text-xl md:leading-snug lg:text-2xl">
              {t('lineupGallery.title')}
            </h3>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full bg-[#1a1a1a] text-lg leading-none text-[#aaa] transition-transform active:scale-90 [-webkit-tap-highlight-color:transparent]"
              aria-label={t('common.close')}
            >
              ×
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] leading-snug text-[#777] md:mt-1.5 md:text-xs md:leading-relaxed">
          {t('lineupGallery.hint')}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-app-screen pb-6 md:px-5 lg:px-6">
        {grenades.length === 0 ? (
          <p className="px-6 pt-10 text-center text-sm text-[#666]">
            {t('lineupGallery.empty')}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-3">
            {grenades.map((g) => (
              <li key={g.id}>
                <LineupCard
                  grenade={g}
                  active={selectedId === g.id}
                  onClick={() => onPick(g)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

interface CardProps {
  grenade: Grenade
  active: boolean
  onClick: () => void
}

function LineupCard({ grenade, active, onClick }: CardProps) {
  const color = GRENADE_COLORS[grenade.type] ?? '#fff'
  const emoji = GRENADE_EMOJIS[grenade.type] ?? '●'
  const previewSrc =
    (grenade.gallery_urls && grenade.gallery_urls[0]) ||
    grenade.throw_variants?.[0]?.gallery_urls?.[0] ||
    null

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-video w-full rounded-2xl overflow-hidden border bg-[#161616] active:scale-[0.98] transition-transform touch-manipulation text-left"
      style={{
        borderColor: active ? color : '#262626',
        boxShadow: active ? `0 0 0 2px ${color} inset` : undefined,
      }}
      aria-current={active ? 'true' : undefined}
    >
      {previewSrc ? (
        <Image
          src={previewSrc}
          alt={grenade.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 32vw, 280px"
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${color}22 0%, ${color}05 100%)`,
          }}
        >
          <span className="text-4xl" aria-hidden>
            {emoji}
          </span>
        </div>
      )}

      <span
        className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/75 text-base flex items-center justify-center"
        style={{ color }}
        aria-hidden
      >
        {emoji}
      </span>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-2.5 pt-5 pb-2">
        <div className="text-[12px] font-semibold leading-tight line-clamp-2">
          {grenade.title}
        </div>
      </div>
    </button>
  )
}
