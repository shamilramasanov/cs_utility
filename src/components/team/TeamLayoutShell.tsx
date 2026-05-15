'use client'

import type { ReactNode } from 'react'
import { MeetSessionProvider } from '@/context/MeetSessionContext'

export default function TeamLayoutShell({ children }: { children: ReactNode }) {
  return (
    <MeetSessionProvider>
      <TeamLayoutFrameInner>{children}</TeamLayoutFrameInner>
    </MeetSessionProvider>
  )
}

function TeamLayoutFrameInner({ children }: { children: ReactNode }) {
  const Tag = 'div' as const
  return (
    <Tag className="flex min-h-0 w-full flex-1 flex-col bg-[#0d0d0d]">
      {children}
    </Tag>
  )
}
