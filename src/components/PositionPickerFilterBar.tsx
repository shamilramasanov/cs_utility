'use client'

import { useState } from 'react'
import { useT } from '@/i18n'
import type { SideKey } from '@/lib/side'

export type PickerNadeFilter = 'all' | 'smoke' | 'flash' | 'molotov' | 'he'
export type PickerTeamFilter = SideKey | 'any'

const TEAM_ORDER: Array<{ id: PickerTeamFilter; label: string }> = [
  { id: 'any', label: 'ВСЕ' },
  { id: 'ct', label: 'CT-side' },
  { id: 't', label: 'T-side' },
]

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
      className={`block h-8 w-8 object-contain object-center select-none transition-opacity duration-300 ease-out ${
        active ? 'opacity-100' : 'opacity-[0.9]'
      }`}
    />
  )
}

interface Props {
  nadeFilter: PickerNadeFilter
  onNadeChange: (id: PickerNadeFilter) => void
  team: PickerTeamFilter
  onTeamChange: (t: PickerTeamFilter) => void
}

export default function PositionPickerFilterBar({
  nadeFilter,
  onNadeChange,
  team,
  onTeamChange,
}: Props) {
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

  const teamAriaLabel = (id: PickerTeamFilter) => {
    switch (id) {
      case 'any':
        return t('position.filter.anyTeam')
      case 'ct':
        return `${t('side.ct.short')}-side. ${t('side.ct.full')}. ${t('side.ct.hint')}`
      case 't':
        return `${t('side.t.short')}-side. ${t('side.t.full')}. ${t('side.t.hint')}`
      default:
        return id
    }
  }

  return (
    <div className="relative shrink-0 space-y-2 border-b border-[#1f1f1f] px-app-screen pb-3 pt-1">
      <section>
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
                className={`flex min-h-0 min-w-0 flex-1 touch-manipulation items-stretch justify-center rounded-[0.5rem] py-1 px-0.5 outline-none transition-colors duration-200 ease-out [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#F0B429]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] ${
                  active ? 'text-[#F0B429]' : 'text-white/85 active:text-white'
                }`}
              >
                <span
                  className={`box-border my-auto flex max-w-full min-w-0 justify-center rounded-[0.75rem] transition-[border-color] duration-200 ease-out ${
                    active ? activeShell : 'mx-auto h-10 w-10 max-w-10 shrink-0 border-2 border-transparent'
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                    <PickerNadeGlyph
                      iconSrc={iconSrc}
                      emojiFallback={emojiFallback}
                      active={active}
                    />
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
      </section>

      <section>
        <div
          className="grid grid-cols-3 gap-px rounded-[0.95rem] border border-white/[0.08] bg-black/78 p-0.5 shadow-[0_4px_18px_rgba(0,0,0,0.4)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/65"
          role="tablist"
          aria-label={t('position.filter.teamsTitle')}
        >
          {TEAM_ORDER.map(({ id, label }) => {
            const active = team === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={teamAriaLabel(id)}
                title={label}
                onClick={() => onTeamChange(id)}
                className={`flex min-h-0 min-w-0 touch-manipulation items-center justify-center rounded-[0.5rem] py-1 px-0.5 outline-none transition-colors duration-500 ease-[cubic-bezier(0.25,0.85,0.35,1)] [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#F0B429]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] ${
                  active
                    ? 'text-[#F0B429]'
                    : 'text-white/85 active:text-white'
                }`}
              >
                <span
                  className={`box-border flex min-h-9 w-full max-w-full items-center justify-center rounded-[0.75rem] px-1 py-1 transition-[border-color] duration-300 ease-out ${
                    active ? 'border-2 border-[#F0B429]' : 'border-2 border-transparent'
                  }`}
                >
                  <span
                    className={`text-center text-[11px] font-black leading-none tracking-tight ${
                      active ? 'text-[#F0B429]' : 'text-white/88'
                    }`}
                    aria-hidden
                  >
                    {label}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
