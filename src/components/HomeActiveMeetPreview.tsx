'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useT } from '@/i18n'
import { getMap } from '@/lib/grenades'
import { isBriefingComplete, isPreviewMember, realMemberCount } from '@/lib/meet'
import { roleMeta } from '@/data/role-presets'
import { getTacticById } from '@/lib/tactics'
import type { Meet, MeetMember } from '@/types/meet'
import type { TeamRole } from '@/types/tactics'

interface Props {
  meet: Meet
  onOpen: () => void
  onClose: () => void
}

function displayMembers(meet: Meet): MeetMember[] {
  return meet.members.filter((m) => !isPreviewMember(m.id)).slice(0, 5)
}

export default function HomeActiveMeetPreview({ meet, onOpen, onClose }: Props) {
  const t = useT()
  const [closePrompt, setClosePrompt] = useState(false)
  const briefingDone = isBriefingComplete(meet)
  const tactic = meet.tactic_id ? getTacticById(meet.tactic_id) : undefined
  const mapMeta = meet.map ? getMap(meet.map) : undefined
  const players = realMemberCount(meet)
  const roster = useMemo(() => displayMembers(meet), [meet])

  const stepCount = useMemo(() => {
    if (!tactic) return 0
    return tactic.role_plans.reduce((n, rp) => n + rp.steps.length, 0)
  }, [tactic])

  const sideLabel =
    meet.side === 'T' ? t('side.t.short') : meet.side === 'CT' ? t('side.ct.short') : null

  const title = briefingDone
    ? tactic?.name ?? t('home.tacticsTab.activeMeetNoTactic')
    : t('team.waitingBriefing')

  const subtitle = briefingDone
    ? [
        meet.side && tactic?.scenario
          ? t(`team.scenario.${tactic.scenario}` as const)
          : null,
        stepCount > 0 ? t('home.tacticsTab.activeMeetSteps', { count: stepCount }) : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : t('team.waitingBriefingHint')

  return (
    <div
      className="group relative w-full max-w-sm overflow-hidden rounded-[1.35rem] border border-[#2a2a2a] bg-[#121212] shadow-[0_18px_48px_rgba(0,0,0,0.45)] transition-[border-color,box-shadow] duration-300 hover:border-[#F0B429]/35 hover:shadow-[0_22px_56px_rgba(240,180,41,0.12)]"
      data-home-global-swipe-ignore
    >
      <button
        type="button"
        aria-label={t('home.tacticsTab.closeMeet')}
        onClick={() => setClosePrompt(true)}
        className="absolute right-2.5 top-2.5 z-20 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/65 text-lg leading-none text-[#ccc] backdrop-blur-sm transition-colors hover:border-[#ff6b6b]/40 hover:bg-[#2a1515] hover:text-[#ff8a8a] active:scale-95 [-webkit-tap-highlight-color:transparent]"
      >
        ×
      </button>

      {closePrompt ? (
        <div
          className="absolute inset-0 z-30 flex flex-col justify-end bg-[#0d0d0d]/92 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-close-meet-title"
        >
          <p id="home-close-meet-title" className="text-sm font-bold text-white">
            {t('home.tacticsTab.closeMeetTitle')}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#999]">
            {t('home.tacticsTab.closeMeetWarning')}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setClosePrompt(false)}
              className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[#333] text-sm font-semibold text-[#ccc] active:scale-[0.98]"
            >
              {t('home.tacticsTab.closeMeetCancel')}
            </button>
            <button
              type="button"
              onClick={() => {
                setClosePrompt(false)
                onClose()
              }}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#c0392b] text-sm font-bold text-white active:scale-[0.98]"
            >
              {t('home.tacticsTab.closeMeetConfirm')}
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onOpen}
        className="relative w-full overflow-hidden text-left outline-none transition-transform active:scale-[0.99] [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F0B429]/55"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#F0B429]/[0.07] via-transparent to-[#3498DB]/[0.06] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />

        <div className="relative h-[7.25rem] overflow-hidden border-b border-[#262626]">
          {mapMeta ? (
            <>
              <Image
                src={`/minimaps/${mapMeta.radar}`}
                alt=""
                fill
                sizes="(max-width: 640px) 90vw, 24rem"
                className="object-cover opacity-55 saturate-[0.85]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/55 to-transparent"
                aria-hidden
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-[#121212]/80 via-transparent to-[#121212]/40"
                aria-hidden
              />
            </>
          ) : (
            <div
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(240,180,41,0.14),transparent_55%),linear-gradient(160deg,#1a1a1a,#0d0d0d)]"
              aria-hidden
            />
          )}

          <div className="relative flex h-full flex-col justify-between p-3.5 pr-12">
            <div className="flex items-start justify-between gap-2">
              <span className="rounded-full border border-[#F0B429]/30 bg-black/55 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#F0B429] backdrop-blur-sm">
                {t('home.tacticsTab.activeMeetBadge')}
              </span>
              {sideLabel ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${
                    meet.side === 'T'
                      ? 'bg-[#c45c26]/90 text-white'
                      : 'bg-[#4a7fc4]/90 text-white'
                  }`}
                >
                  {sideLabel}
                </span>
              ) : null}
            </div>

            <div>
              {mapMeta ? (
                <p className="text-lg font-bold leading-tight text-white drop-shadow-sm">
                  {mapMeta.display_name}
                </p>
              ) : (
                <p className="text-lg font-bold leading-tight text-white/90">{t('team.lobbyTitle')}</p>
              )}
              <p className="mt-0.5 font-mono text-[11px] tracking-wider text-[#aaa]">
                {t('home.tacticsTab.activeMeetCode', { code: meet.code })}
              </p>
            </div>
          </div>
        </div>

        <div className="relative space-y-3 p-4">
          <div>
            <h3 className="text-base font-bold leading-snug text-white">{title}</h3>
            {subtitle ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#888]">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <RosterAvatars members={roster} />
              <span className="truncate text-xs text-[#777]">
                {t('home.tacticsTab.activeMeetPlayers', { count: players })}
              </span>
            </div>
            {briefingDone && tactic?.description ? (
              <span className="hidden max-w-[7rem] truncate text-[10px] text-[#666] sm:block">
                {tactic.description}
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[#262626] pt-3">
            <span className="text-sm font-bold text-[#F0B429]">{t('home.tacticsTab.resumeMeet')}</span>
            <span
              className="flex size-8 items-center justify-center rounded-full bg-[#F0B429]/15 text-[#F0B429] transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          </div>
        </div>
      </button>
    </div>
  )
}

function RosterAvatars({ members }: { members: MeetMember[] }) {
  if (!members.length) {
    return (
      <span className="flex size-8 items-center justify-center rounded-full border border-dashed border-[#333] bg-[#1a1a1a] text-[10px] text-[#555]">
        ?
      </span>
    )
  }

  return (
    <div className="flex -space-x-2">
      {members.map((m) => {
        const initial = (m.nickname.trim()[0] ?? '?').toUpperCase()
        const color = m.role ? roleMeta(m.role as TeamRole).color : '#555'
        return (
          <span
            key={m.id}
            title={m.nickname}
            className="flex size-8 items-center justify-center rounded-full border-2 border-[#121212] text-[11px] font-bold text-white shadow-sm"
            style={{ backgroundColor: color }}
          >
            {initial}
          </span>
        )
      })}
    </div>
  )
}
