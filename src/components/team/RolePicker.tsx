'use client'

import type { Meet } from '@/types/meet'
import type { TeamRole } from '@/types/tactics'
import type { Side } from '@/types'
import { rolesForMeet, rolesForSide, roleMeta, type RoleMeta } from '@/data/role-presets'
import { memberWithRole } from '@/lib/meet'
import { useT, type TranslationKey } from '@/i18n'

interface Props {
  side?: Side | null
  meet: Meet
  myClientId: string
  onPick: (role: TeamRole) => void
}

export default function RolePicker({ side, meet, myClientId, onPick }: Props) {
  const t = useT()
  const roles = side ? rolesForSide(side) : rolesForMeet()

  return (
    <div className="px-app-screen py-4">
      <h2 className="mb-4 text-center text-lg font-bold">{t('team.role.pickerTitle')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {roles.map((meta) => (
          <RoleCard
            key={meta.role}
            meta={meta}
            meet={meet}
            myClientId={myClientId}
            onPick={onPick}
            t={t}
          />
        ))}
      </div>
    </div>
  )
}

function RoleCard({
  meta,
  meet,
  myClientId,
  onPick,
  t,
}: {
  meta: RoleMeta
  meet: Meet
  myClientId: string
  onPick: (role: TeamRole) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}) {
  const occupant = memberWithRole(meet, meta.role)
  const taken = Boolean(occupant && occupant.id !== myClientId)
  const isMe = occupant?.id === myClientId
  const dashed = meta.role === 'anchor_b'

  return (
    <button
      type="button"
      disabled={taken}
      onClick={() => onPick(meta.role)}
      className={`flex min-h-[7.5rem] flex-col items-start rounded-2xl border-2 px-3 py-3 text-left transition-transform active:scale-[0.98] ${
        taken ? 'opacity-40' : ''
      } ${isMe ? 'ring-2 ring-white/30' : ''}`}
      style={{
        borderColor: meta.color,
        borderStyle: dashed ? 'dashed' : 'solid',
        background: `${meta.color}18`,
      }}
    >
      <span className="text-base font-extrabold" style={{ color: meta.color }}>
        {t(meta.labelKey as TranslationKey)}
      </span>
      <span className="mt-1 text-xs leading-snug text-[#aaa]">
        {t(meta.hintKey as TranslationKey)}
      </span>
      <span className="mt-auto pt-2 text-[11px] font-medium text-[#888]">
        {occupant
          ? t('team.roleTaken', { nickname: occupant.nickname })
          : t('team.roleFree')}
      </span>
    </button>
  )
}
