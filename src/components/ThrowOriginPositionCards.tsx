'use client'

import Image from 'next/image'
import type { Grenade } from '@/types'
import type { ThrowOriginItem } from '@/lib/throw-origin-items'

interface Props {
  items: ThrowOriginItem[]
  selectedKey: string | null
  onPick: (grenade: Grenade, variantIndex: number) => void
  className?: string
  gridClassName?: string
}

/** Сетка карточек выбора точки броска (общая для сайдбара и полосы под картой). */
export default function ThrowOriginPositionCards({
  items,
  selectedKey,
  onPick,
  className = '',
  gridClassName = '',
}: Props) {
  return (
    <div className={className}>
      <ul
        className={`grid w-full max-w-full grid-cols-2 gap-2 pb-3 md:gap-3 md:pb-2 ${gridClassName}`}
      >
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => onPick(item.grenade, item.variantIndex)}
              className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-[#262626] bg-[#161616] text-left transition-transform active:scale-[0.98] md:rounded-2xl"
              style={{
                boxShadow: selectedKey === item.key ? '0 0 0 2px #F0B429 inset' : undefined,
                borderColor: selectedKey === item.key ? '#F0B429' : '#262626',
              }}
            >
              {item.preview ? (
                <Image
                  src={item.preview}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 46vw, min(720px, 46vw)"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1c1c1c] to-[#0f0f0f] text-2xl">
                  📍
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-2.5 pb-2 pt-5">
                <div className="line-clamp-2 text-[12px] font-semibold leading-tight">{item.title}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
