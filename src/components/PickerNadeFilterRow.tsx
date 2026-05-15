'use client'

import { useState } from 'react'
import { useT } from '@/i18n'
import type { PickerNadeFilter } from './PositionPickerFilterBar'

const NADE_ORDER: Array<{
  id: PickerNadeFilter
  iconSrc: string
  emojiFallback: string
}> = [
  { id: 'all', iconSrc: '/grenade-picker/all.png', emojiFallback: '🎯' },
  { id: 'smoke', iconSrc: '/grenade-picker/smoke.png', emojiFallback: '💨' },
  { id: 'flash', iconSrc: '/grenade-picker/flash.png', emojiFallback: '⚡' },
  { id: 'molotov', iconSrc: '/grenade-picker/molotov.png', emojiFallback: '🔥' },
  { id: 'he', iconSrc: '/grenade-picker/he.png', emojiFallback: '💥' },
]

function PickerNadeGlyph({
  iconSrc,
  emojiFallback,
  active,
}: {
  iconSrc: string
  emojiFallback: string
  active: boolean
}) {
  const [imgFailed, setImgFailed] = useState(false)

  if (imgFailed) {
    return (
      <span
        className={`text-xl leading-none ${active ? 'opacity-100' : 'opacity-[0.9]'}`}
        aria-hidden
      >
        {emojiFallback}
      </span>
    )
  }

  return (
    <img
      src={iconSrc}
      alt=""
      width={32}
      height={32}
      loading="eager"
      decoding="async"
      draggable={false}
      onError={() => setImgFailed(true)}
      className={`block h-8 w-8 object-contain object-center select-none ${
        active ? 'opacity-100' : 'opacity-[0.9]'
      }`}
    />
  )
}

interface Props {
  nadeFilter: PickerNadeFilter
  onNadeChange: (id: PickerNadeFilter) => void
}

export default function PickerNadeFilterRow({ nadeFilter, onNadeChange }: Props) {
  const t = useT()

  const nadeAriaLabel = (id: PickerNadeFilter) => {
    switch (id) {
      case 'all':
        return t('position.filter.allNades')
      case 'smoke':
        return t('position.filter.smoke')
      case 'flash':
        return t('position.filter.flash')
      case 'molotov':
        return t('position.filter.molotov')
      case 'he':
        return t('position.filter.he')
      default:
        return id
    }
  }

  const nadeCompactLabel = (id: PickerNadeFilter) => {
    switch (id) {
      case 'all':
        return 'ВСЕ'
      case 'smoke':
        return 'SMOKE'
      case 'flash':
        return 'FLASH'
      case 'molotov':
        return 'MOLOTOV'
      case 'he':
        return 'HE'
    }
  }

  return (
    <div
      className="flex min-w-0 items-stretch gap-px rounded-[0.95rem] border border-white/[0.08] bg-black/78 p-0.5 shadow-[0_4px_18px_rgba(0,0,0,0.4)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/65"
      role="tablist"
      aria-label={t('position.filter.nadesTitle')}
    >
      {NADE_ORDER.map(({ id, iconSrc, emojiFallback }) => {
        const active = nadeFilter === id
        const activeShell =
          'flex flex-col items-center gap-0.5 border-2 border-[#F0B429] px-1 py-1 sm:px-1.5'
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={nadeAriaLabel(id)}
            onClick={() => onNadeChange(id)}
            className={`flex min-h-0 min-w-0 flex-1 touch-manipulation items-stretch justify-center rounded-[0.5rem] px-0.5 py-1 outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#F0B429]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] ${
              active ? 'text-[#F0B429]' : 'text-white/85 active:text-white'
            }`}
          >
            <span
              className={`box-border my-auto flex max-w-full min-w-0 justify-center rounded-[0.75rem] ${
                active ? activeShell : 'mx-auto h-10 w-10 max-w-10 shrink-0 border-2 border-transparent'
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                <PickerNadeGlyph iconSrc={iconSrc} emojiFallback={emojiFallback} active={active} />
              </span>
              {active && (
                <span
                  className="max-w-full whitespace-nowrap text-center text-[9px] font-black uppercase leading-none tracking-wide text-[#F0B429] sm:text-[10px]"
                  aria-hidden
                >
                  {nadeCompactLabel(id)}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
