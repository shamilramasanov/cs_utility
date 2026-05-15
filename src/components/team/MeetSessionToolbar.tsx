'use client'

import type { ReactNode } from 'react'
import TeamModeDock from './TeamModeDock'
import {
  MEET_CONTEXT_SLOT_CLASS,
  MEET_DOCK_SLOT_CLASS,
  MEET_TOOLBAR_INNER_CLASS,
  MEET_TOOLBAR_SHELL_CLASS,
} from './meet-session-layout'

interface Props {
  active: 'tactics' | 'lineups'
  context: ReactNode
}

export default function MeetSessionToolbar({ active, context }: Props) {
  return (
    <div className={MEET_TOOLBAR_SHELL_CLASS}>
      <div className={MEET_TOOLBAR_INNER_CLASS}>
        <section className={MEET_CONTEXT_SLOT_CLASS}>{context}</section>
        <section className={MEET_DOCK_SLOT_CLASS} aria-hidden={false}>
          <TeamModeDock active={active} layout="filterRow" className="h-full" />
        </section>
      </div>
    </div>
  )
}
