'use client'

import type { Meet } from '@/types/meet'
import { useT } from '@/i18n'

interface Props {
  meet: Meet
}

export default function MeetWaiting({ meet }: Props) {
  const t = useT()

  return (
    <WaitingBox>
      <p className="text-lg font-bold">{t('team.waitingBriefing')}</p>
      <p className="mt-4 font-mono text-2xl font-bold tracking-[0.35em]">{meet.code}</p>
    </WaitingBox>
  )
}

function WaitingBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-app-screen py-12 text-center">
      {children}
    </div>
  )
}
