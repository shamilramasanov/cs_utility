'use client'

import type { Tactic } from '@/types/tactics'
import { useT } from '@/i18n'

interface Props {
  tactics: Tactic[]
  activeId: string | null
  onSelect: (id: string) => void
  onClose: () => void
}

export default function TacticPickerSheet({ tactics, activeId, onSelect, onClose }: Props) {
  const t = useT()

  return (
    <>
      <button
        type="button"
        aria-label={t('common.close')}
        className="fixed inset-0 z-[80] bg-black/55"
        onClick={onClose}
      />
      <TacticSheetShell>
        <SheetDragHandle />
        <h2 className="mb-3 text-lg font-bold">{t('team.changeTactic')}</h2>
        <div className="no-scrollbar max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto">
          {tactics.map((tactic) => {
            const active = tactic.id === activeId
            return (
              <button
                key={tactic.id}
                type="button"
                onClick={() => onSelect(tactic.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition-transform active:scale-[0.99] ${
                  active ? 'border-[#F0B429] bg-[#F0B429]/10' : 'border-[#262626] bg-[#141414]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{tactic.name}</span>
                  {active && <span className="text-[#F0B429]">●</span>}
                </div>
              </button>
            )
          })}
        </div>
      </TacticSheetShell>
    </>
  )
}

function TacticSheetShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[90] max-h-[85vh] rounded-t-2xl border-t border-[#333] bg-[#1a1a1a] px-app-screen pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-3"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
    >
      {children}
    </div>
  )
}

function SheetDragHandle() {
  return <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[#444]" />
}
