'use client'

import type { Meet } from '@/types/meet'
import type { Side } from '@/types'
import { rolesForMeet, rolesForSide } from '@/data/role-presets'
import { isPreviewMember, memberWithRole } from '@/lib/meet'
import { useT, type TranslationKey } from '@/i18n'

interface Props {
  meet: Meet
  mapLabel?: string
  tacticName?: string
  isCaptain: boolean
  copied: boolean
  hasDemoTeam: boolean
  briefingComplete: boolean
  onCopyLink: () => void
  onOpenBriefing?: () => void
  onChangeTactic?: () => void
  onStartPlan: () => void
  onFillDemo?: () => void
  onClearDemo?: () => void
}

export default function MeetLobby({
  meet,
  mapLabel,
  tacticName,
  isCaptain,
  copied,
  hasDemoTeam,
  briefingComplete,
  onCopyLink,
  onOpenBriefing,
  onChangeTactic,
  onStartPlan,
  onFillDemo,
  onClearDemo,
}: Props) {
  const t = useT()
  const roles = meet.side ? rolesForSide(meet.side as Side) : rolesForMeet()
  const canStart = briefingComplete && Boolean(meet.tactic_id)
  const sideLabel = meet.side === 'T' ? 'T' : meet.side === 'CT' ? 'CT' : ''

  return (
    <div className="flex min-h-0 flex-1 flex-col px-app-screen py-3 pb-20">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-bold">
            {briefingComplete ? tacticName : t('team.waitingBriefing')}
          </p>
          {briefingComplete && mapLabel && (
            <p className="text-xs text-[#888]">
              {mapLabel}
              {sideLabel ? ` · ${sideLabel}` : ''}
            </p>
          )}
        </div>
        <p className="shrink-0 font-mono text-lg font-bold tracking-widest">{meet.code}</p>
      </div>

      {isCaptain && !briefingComplete && onOpenBriefing && (
        <button
          type="button"
          onClick={onOpenBriefing}
          className="mb-3 flex h-12 w-full items-center justify-center rounded-xl bg-[#F0B429] text-sm font-bold text-black"
        >
          {t('team.openBriefing')}
        </button>
      )}

      {isCaptain && briefingComplete && onChangeTactic && (
        <button
          type="button"
          onClick={onChangeTactic}
          className="mb-3 h-10 w-full rounded-xl border border-[#333] text-xs font-semibold text-[#F0B429]"
        >
          {t('team.changeTactic')}
        </button>
      )}

      <ul className="mb-3 space-y-1.5">
        {roles.map((meta) => {
          const member = memberWithRole(meet, meta.role)
          const demo = member && isPreviewMember(member.id)
          return (
            <li
              key={meta.role}
              className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#141414] px-2.5 py-2"
              style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
            >
              <span className="text-sm font-semibold" style={{ color: meta.color }}>
                {t(meta.labelKey as TranslationKey)}
              </span>
              <span className="truncate pl-2 text-xs text-[#aaa]">
                {member ? member.nickname + (demo ? ' *' : '') : t('team.roleFree')}
              </span>
            </li>
          )
        })}
      </ul>

      {briefingComplete && onFillDemo && (
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={onFillDemo}
            disabled={hasDemoTeam}
            className="h-10 flex-1 rounded-xl border border-[#333] text-xs font-semibold text-[#ccc] disabled:opacity-40"
          >
            {t('team.fillDemoTeam')}
          </button>
          {onClearDemo && hasDemoTeam && (
            <button
              type="button"
              onClick={onClearDemo}
              className="h-10 shrink-0 rounded-xl border border-[#333] px-3 text-xs text-[#888]"
            >
              ×
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onCopyLink}
        className="mb-2 flex h-12 w-full items-center justify-center rounded-xl border border-[#333] bg-[#141414] text-sm font-bold text-[#F0B429]"
      >
        {copied ? t('team.copied') : t('team.copyLink')}
      </button>

      {briefingComplete && (
        <button
          type="button"
          disabled={!canStart}
          onClick={onStartPlan}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#27AE60] text-sm font-bold text-white disabled:opacity-40"
        >
          {t('team.startPlan')}
        </button>
      )}
    </div>
  )
}
