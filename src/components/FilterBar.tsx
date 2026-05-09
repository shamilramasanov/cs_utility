'use client'

interface FilterType {
  id: string
  label: string
  emoji: string
}

interface Props {
  types: FilterType[]
  active: string
  counts: Record<string, number>
  onChange: (type: string) => void
  /** «Док» внизу экрана — бордер, safe-area, отступы под большой палец */
  dock?: 'top' | 'bottom'
}

export default function FilterBar({ types, active, counts, onChange, dock = 'top' }: Props) {
  const isBottom = dock === 'bottom'

  return (
    <div
      className={`shrink-0 no-scrollbar ${
        isBottom
          ? 'border-t border-[#2a2a2a] bg-[#0d0d0d] tab-bar px-3 pt-2.5 pb-3'
          : 'px-4 pb-2'
      }`}
    >
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {types.map((t) => {
          const isActive = active === t.id
          const count = counts[t.id] ?? 0
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`flex items-center gap-1.5 shrink-0 rounded-full text-sm transition-transform active:scale-[0.97] ${
                isActive
                  ? 'bg-[#F0B429] px-3.5 py-2.5 font-bold text-black shadow-[0_0_0_1px_rgba(0,0,0,0.06)]'
                  : 'bg-[#1a1a1a] px-3.5 py-2.5 font-medium text-[#e0e0e0] ring-1 ring-[#2a2a2a]'
              }`}
            >
              <span className="text-[15px] leading-none" aria-hidden>
                {t.emoji}
              </span>
              <span className="whitespace-nowrap">{t.label}</span>
              {t.id === 'all' || count > 0 ? (
                <span
                  className={`text-xs tabular-nums ${
                    isActive ? 'font-semibold text-black/50' : 'font-medium text-[#666]'
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
