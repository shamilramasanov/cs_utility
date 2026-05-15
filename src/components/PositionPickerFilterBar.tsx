'use client'

import { useT } from '@/i18n'
import type { SideKey } from '@/lib/side'
import PickerNadeFilterRow from './PickerNadeFilterRow'
import MeetSessionToolbar from '@/components/team/MeetSessionToolbar'

export type PickerNadeFilter = 'all' | 'smoke' | 'flash' | 'molotov' | 'he'
export type PickerTeamFilter = SideKey | 'any'

const TEAM_ORDER: Array<{ id: PickerTeamFilter; label: string }> = [
  { id: 'any', label: 'ВСЕ' },
  { id: 'ct', label: 'CT-side' },
  { id: 't', label: 'T-side' },
]

interface Props {
  nadeFilter: PickerNadeFilter
  onNadeChange: (id: PickerNadeFilter) => void
  team: PickerTeamFilter
  onTeamChange: (t: PickerTeamFilter) => void
  /** Сессия тактики: общая верхняя панель вместо T/CT. */
  hideTeamFilter?: boolean
}

export default function PositionPickerFilterBar({
  nadeFilter,
  onNadeChange,
  team,
  onTeamChange,
  hideTeamFilter = false,
}: Props) {
  const t = useT()

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

  if (hideTeamFilter) {
    return (
      <MeetSessionToolbar
        active="lineups"
        context={<PickerNadeFilterRow nadeFilter={nadeFilter} onNadeChange={onNadeChange} />}
      />
    )
  }

  return (
    <div className="relative shrink-0 space-y-2 border-b border-[#1f1f1f] px-app-screen pb-3 pt-1">
      <section>
        <PickerNadeFilterRow nadeFilter={nadeFilter} onNadeChange={onNadeChange} />
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
                className={`flex min-h-0 min-w-0 touch-manipulation items-center justify-center rounded-[0.5rem] px-0.5 py-1 outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#F0B429]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] ${
                  active ? 'text-[#F0B429]' : 'text-white/85 active:text-white'
                }`}
              >
                <span
                  className={`box-border flex min-h-9 w-full max-w-full items-center justify-center rounded-[0.75rem] px-1 py-1 ${
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

