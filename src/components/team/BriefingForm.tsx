'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Side } from '@/types'
import { getMaps } from '@/lib/grenades'
import { getTacticsByMapAndSide } from '@/lib/tactics'
import { useT } from '@/i18n'

interface Props {
  initialMap?: string | null
  initialSide?: Side | null
  initialTacticId?: string | null
  submitLabel: string
  onSubmit: (map: string, side: Side, tacticId: string) => void
}

export default function BriefingForm({
  initialMap,
  initialSide,
  initialTacticId,
  submitLabel,
  onSubmit,
}: Props) {
  const t = useT()
  const maps = useMemo(() => getMaps().filter((m) => m.competitive), [])
  const [mapId, setMapId] = useState(initialMap ?? maps[0]?.id ?? 'de_mirage')
  const [side, setSide] = useState<Side>(initialSide ?? 'T')
  const [tacticId, setTacticId] = useState(initialTacticId ?? '')

  const tactics = useMemo(() => getTacticsByMapAndSide(mapId, side), [mapId, side])

  useEffect(() => {
    if (!tacticId && tactics[0]) setTacticId(tactics[0].id)
  }, [tactics, tacticId])

  useEffect(() => {
    if (initialMap) setMapId(initialMap)
  }, [initialMap])

  useEffect(() => {
    if (initialSide) setSide(initialSide)
  }, [initialSide])

  const selectedTactic = tactics.find((x) => x.id === tacticId) ?? tactics[0]
  const canSubmit = Boolean(selectedTactic)

  return (
    <>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#777]">{t('team.map')}</p>
      <MapScrollRow>
        {maps.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMapId(m.id)
              setTacticId('')
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              mapId === m.id
                ? 'bg-[#F0B429] text-black'
                : 'border border-[#333] bg-[#141414] text-[#ccc]'
            }`}
          >
            {m.display_name}
          </button>
        ))}
      </MapScrollRow>

      <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-[#777]">
        {t('team.side')}
      </p>
      <div className="mb-4 flex gap-2">
        {(['T', 'CT'] as Side[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSide(s)
              setTacticId('')
            }}
            className={`flex h-14 flex-1 items-center justify-center rounded-xl text-base font-bold ${
              side === s ? 'bg-[#F0B429] text-black' : 'border border-[#333] bg-[#141414]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#777]">
        {t('team.tactic')}
      </p>
      <div className="mb-4 space-y-2">
        {tactics.length === 0 ? (
          <p className="text-sm text-[#666]">{t('common.nothingFound')}</p>
        ) : (
          tactics.map((tac) => (
            <button
              key={tac.id}
              type="button"
              onClick={() => setTacticId(tac.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left ${
                selectedTactic?.id === tac.id
                  ? 'border-[#F0B429] bg-[#F0B429]/10'
                  : 'border-[#262626] bg-[#141414]'
              }`}
            >
              <span className="font-semibold">{tac.name}</span>
            </button>
          ))
        )}
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => selectedTactic && onSubmit(mapId, side, selectedTactic.id)}
        className="flex h-16 w-full items-center justify-center rounded-xl bg-[#F0B429] text-base font-bold text-black disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </>
  )
}

function MapScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">{children}</div>
  )
}
