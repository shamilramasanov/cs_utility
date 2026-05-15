'use client'

import { useT } from '@/i18n'

interface Props {
  open: boolean
  nickname: string
  onNicknameChange: (v: string) => void
  onClose: () => void
  onCreate: () => void
}

export default function QuickCreateSheet({
  open,
  nickname,
  onNicknameChange,
  onClose,
  onCreate,
}: Props) {
  const t = useT()

  if (!open) return null

  const canCreate = nickname.trim().length > 0

  return (
    <>
      <button
        type="button"
        aria-label={t('common.close')}
        className="fixed inset-0 z-[80] bg-black/55"
        onClick={onClose}
      />
      <CreateSheetPanel>
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[#444]" />
        <h2 className="mb-4 text-lg font-bold">{t('team.newMeet')}</h2>
        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#777]">
            {t('team.nickname')}
          </span>
          <input
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            className="h-12 w-full rounded-xl border border-[#333] bg-[#141414] px-3 text-base"
            autoComplete="nickname"
          />
        </label>

        <button
          type="button"
          disabled={!canCreate}
          onClick={onCreate}
          className="flex h-16 w-full items-center justify-center rounded-xl bg-[#F0B429] text-base font-bold text-black disabled:opacity-40"
        >
          {t('team.createMeet')}
        </button>
      </CreateSheetPanel>
    </>
  )
}

function CreateSheetPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] max-h-[92vh] overflow-y-auto rounded-t-2xl border-t border-[#333] bg-[#1a1a1a] px-app-screen pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-3">
      {children}
    </div>
  )
}
