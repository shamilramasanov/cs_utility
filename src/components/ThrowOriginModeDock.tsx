'use client'

import { useCallback, useState } from 'react'

const ICONS = ['/nav/home-maps.png', '/nav/picker-list.png'] as const

function ModeNavIconImg({ index, active }: { index: 0 | 1; active: boolean }) {
  const [failed, setFailed] = useState(false)
  const emoji = (['🗺', '📋'] as const)[index]
  if (failed) {
    return (
      <span className={`text-[1.38rem] leading-none ${active ? '' : 'opacity-[0.9]'}`} aria-hidden>
        {emoji}
      </span>
    )
  }
  return (
    <img
      src={ICONS[index]}
      alt=""
      width={38}
      height={38}
      loading="eager"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={`block h-[calc(32px*1.2)] w-[calc(32px*1.2)] max-h-[calc(32px*1.2)] max-w-[calc(32px*1.2)] object-contain object-center select-none transition-opacity duration-300 ease-out ${
        active ? 'opacity-100' : 'opacity-[0.9]'
      }`}
    />
  )
}

interface Props {
  mode: 'map' | 'list'
  onModeChange: (mode: 'map' | 'list') => void
  labels: [string, string]
  ariaLabel: string
  /** Если true — блок внутри flex-колонки (десктоп), без fixed по viewport. */
  embedded?: boolean
}

export default function ThrowOriginModeDock({
  mode,
  onModeChange,
  labels,
  ariaLabel,
  embedded = false,
}: Props) {
  const activeIdx = mode === 'map' ? 0 : 1
  const onPick = useCallback(
    (i: number) => onModeChange(i === 0 ? 'map' : 'list'),
    [onModeChange],
  )

  const inner = (
    <div
      className="pointer-events-auto mx-auto inline-flex max-w-[min(calc(100vw-2.25rem),22rem)] shrink-0 gap-1 rounded-[1.14rem] border border-white/[0.08] bg-black px-1.5 py-1 shadow-[0_10px_34px_rgba(0,0,0,0.52)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/65"
      role="tablist"
    >
      {labels.map((label, i) => {
        const active = i === activeIdx
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={label}
            title={label}
            onClick={() => onPick(i)}
            className={`flex shrink-0 touch-manipulation items-center justify-center rounded-[0.6rem] px-0.5 py-0.5 outline-none transition-colors duration-300 [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#F0B429]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] ${
              active ? 'text-[#F0B429]' : 'text-white/85 active:text-white'
            }`}
          >
            <span
              className={`box-border flex min-h-12 items-center rounded-[1.05rem] transition-[border-color,padding,gap] duration-300 ease-out ${
                active
                  ? 'w-auto max-w-none gap-1.5 border-2 border-[#F0B429] px-1.5 py-0.5'
                  : 'size-12 shrink-0 justify-center border-2 border-transparent'
              }`}
            >
              <span className="flex size-[calc(36px*1.2)] shrink-0 items-center justify-center">
                <ModeNavIconImg index={i as 0 | 1} active={active} />
              </span>
              {active && (
                <span
                  className="whitespace-nowrap text-left text-[12px] font-black uppercase leading-none tracking-wide"
                  aria-hidden
                >
                  {label}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )

  if (embedded) {
    return (
      <nav
        className="pointer-events-none flex shrink-0 justify-center px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
        aria-label={ariaLabel}
      >
        {inner}
      </nav>
    )
  }

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[42] flex justify-center px-3 pt-1 sm:px-4"
      style={{
        paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))',
      }}
      aria-label={ariaLabel}
    >
      {inner}
    </nav>
  )
}
