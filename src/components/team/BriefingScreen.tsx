'use client'

import Link from 'next/link'
import BriefingForm from '@/components/team/BriefingForm'
import type { Meet } from '@/types/meet'
import type { Side } from '@/types'
import { useT } from '@/i18n'

interface Props {
  meet: Meet
  onSubmit: (map: string, side: Side, tacticId: string) => void
  onBack?: () => void
}

export default function BriefingScreen({ meet, onSubmit, onBack }: Props) {
  const t = useT()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-app-screen py-4 pb-8">
      <BriefingHeader>
        {onBack ? (
          <button type="button" onClick={onBack} className="text-sm font-semibold text-[#888]">
            ← {t('team.lobbyTitle')}
          </button>
        ) : (
          <Link href="/team" className="text-sm font-semibold text-[#888]">
            ← {t('team.title')}
          </Link>
        )}
        <h1 className="mt-2 text-xl font-bold">{t('team.briefingTitle')}</h1>
        <p className="mt-1 font-mono text-sm tracking-widest text-[#666]">{meet.code}</p>
      </BriefingHeader>

      <BriefingForm
        initialMap={meet.map}
        initialSide={meet.side}
        initialTacticId={meet.tactic_id}
        submitLabel={t('team.lockBriefing')}
        onSubmit={onSubmit}
      />
    </div>
  )
}

function BriefingHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-6">{children}</div>
}
