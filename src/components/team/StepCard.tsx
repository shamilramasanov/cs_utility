'use client'

import { useCallback, useRef } from 'react'
import type { TacticStep } from '@/types/tactics'
import { formatStepTime } from '@/lib/tactics'
import { useT, type TranslationKey } from '@/i18n'

interface Props {
  step: TacticStep
  roleColor: string
  active?: boolean
  done?: boolean
  dimmed?: boolean
  onOpenLineup?: () => void
  onToggleDone?: () => void
}

const KIND_KEY: Record<TacticStep['kind'], TranslationKey> = {
  spawn: 'team.stepKind.spawn',
  move: 'team.stepKind.move',
  hold: 'team.stepKind.hold',
  throw: 'team.stepKind.throw',
  peek: 'team.stepKind.peek',
  exec: 'team.stepKind.exec',
  rotate: 'team.stepKind.rotate',
  note: 'team.stepKind.note',
}

export default function StepCard({
  step,
  roleColor,
  active = false,
  done = false,
  dimmed = false,
  onOpenLineup,
  onToggleDone,
}: Props) {
  const t = useT()
  const longPressTimer = useRef<number | null>(null)

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current != null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const timeLabel = formatStepTime(step.time)

  return (
    <article
      className={`relative rounded-2xl border px-3 py-3 transition-opacity duration-150 ${
        dimmed ? 'opacity-40' : ''
      } ${done ? 'opacity-50' : ''}`}
      style={{
        borderColor: active ? roleColor : '#2a2a2a',
        background: active ? `${roleColor}14` : '#141414',
        boxShadow: active ? `inset 3px 0 0 ${roleColor}` : undefined,
      }}
      onPointerDown={() => {
        if (!onToggleDone) return
        clearLongPress()
        longPressTimer.current = window.setTimeout(() => {
          onToggleDone()
          if (navigator.vibrate) navigator.vibrate(12)
        }, 450)
      }}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
    >
      <StepCardHeader
        roleColor={roleColor}
        timeLabel={timeLabel}
        kindLabel={t(KIND_KEY[step.kind])}
        active={active}
      />
      <p
        className={`mt-2 text-base font-medium leading-snug text-[#e8e8e8] ${
          done ? 'line-through' : ''
        }`}
      >
        {step.text}
      </p>
      {step.position_id && (
        <span
          className="mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
          style={{ background: `${roleColor}33`, color: roleColor }}
        >
          {step.position_id.replace(/_/g, ' ')}
        </span>
      )}
      {step.grenade_id && onOpenLineup && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenLineup()
          }}
          className="mt-3 flex h-14 w-full items-center justify-center rounded-xl text-[15px] font-bold text-black transition-transform active:scale-[0.98]"
          style={{ background: roleColor }}
        >
          {t('team.lineupBtn')}
        </button>
      )}
    </article>
  )
}

function StepCardHeader({
  roleColor,
  timeLabel,
  kindLabel,
  active,
}: {
  roleColor: string
  timeLabel: string
  kindLabel: string
  active: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {active && (
        <span
          className="inline-block size-2 shrink-0 animate-pulse rounded-full"
          style={{ background: roleColor }}
          aria-hidden
        />
      )}
      {timeLabel ? <span className="font-mono text-[13px] text-[#666]">{timeLabel}</span> : null}
      <span className="text-sm font-semibold" style={{ color: roleColor }}>
        {kindLabel}
      </span>
    </div>
  )
}
