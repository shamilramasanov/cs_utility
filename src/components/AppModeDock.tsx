'use client'

import { useCallback, useState } from 'react'

function ModeNavIconImg({
  src,
  fallback,
  active,
}: {
  src: string
  fallback: string
  active: boolean
}) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <span className={`text-[1.38rem] leading-none ${active ? '' : 'opacity-[0.9]'}`} aria-hidden>
        {fallback}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      width={38}
      height={38}
      loading="eager"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={`block h-8 w-8 object-contain object-center select-none ${
        active ? 'opacity-100' : 'opacity-[0.9]'
      }`}
    />
  )
}

export interface AppModeDockItem {
  label: string
  iconSrc: string
  iconFallback: string
  disabled?: boolean
}

interface Props {
  items: AppModeDockItem[]
  activeIndex: number
  onChange: (index: number) => void
  ariaLabel: string
  embedded?: boolean
  className?: string
  maxWidthClass?: string
  dataIgnoreSwipe?: string
  /** `filterRow` — как блок T/CT в фильтрах карты; `compact` — нижняя навигация главной. */
  layout?: 'compact' | 'filterRow'
}

export default function AppModeDock({
  items,
  activeIndex,
  onChange,
  ariaLabel,
  embedded = false,
  className = '',
  maxWidthClass = 'max-w-[min(calc(100vw-2.25rem),22rem)]',
  dataIgnoreSwipe,
  layout = 'compact',
}: Props) {
  const onPick = useCallback(
    (i: number) => {
      if (items[i]?.disabled) return
      onChange(i)
    },
    [items, onChange],
  )

  const ignoreAttr = dataIgnoreSwipe ? { [dataIgnoreSwipe]: '' } : {}

  const inner =
    layout === 'filterRow' ? (
      <div
        className="pointer-events-auto mx-auto grid h-full w-full grid-cols-2 gap-px rounded-[0.95rem] border border-white/[0.08] bg-black/78 p-0.5 shadow-[0_4px_18px_rgba(0,0,0,0.4)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/65"
        role="tablist"
      >
        {items.map((item, i) => {
          const active = i === activeIndex
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={item.label}
              title={item.label}
              disabled={item.disabled}
              onClick={() => onPick(i)}
              className={`flex min-h-0 min-w-0 touch-manipulation items-center justify-center rounded-[0.5rem] px-0.5 py-1 outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#F0B429]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] disabled:opacity-40 ${
                active ? 'text-[#F0B429]' : 'text-white/85 active:text-white'
              }`}
            >
              <span
                className={`box-border flex min-h-9 w-full max-w-full items-center justify-center gap-1.5 rounded-[0.75rem] px-2 py-1 ${
                  active ? 'border-2 border-[#F0B429]' : 'border-2 border-transparent'
                }`}
              >
                <ModeNavIconImg src={item.iconSrc} fallback={item.iconFallback} active={active} />
                <span
                  className={`whitespace-nowrap text-center text-[11px] font-black uppercase leading-none tracking-tight ${
                    active ? 'text-[#F0B429]' : 'text-white/88'
                  }`}
                  aria-hidden
                >
                  {item.label}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    ) : (
      <div
        className={`pointer-events-auto mx-auto inline-flex shrink-0 gap-1 rounded-[1.14rem] border border-white/[0.08] bg-black/78 px-1.5 py-1 shadow-[0_10px_34px_rgba(0,0,0,0.52)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/65 ${maxWidthClass}`}
        role="tablist"
      >
        {items.map((item, i) => {
          const active = i === activeIndex
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={item.label}
              title={item.label}
              disabled={item.disabled}
              onClick={() => onPick(i)}
              className={`flex shrink-0 touch-manipulation items-center justify-center rounded-[0.6rem] px-0.5 py-0.5 outline-none transition-colors duration-150 [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#F0B429]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] disabled:opacity-40 ${
                active ? 'text-[#F0B429]' : 'text-white/85 active:text-white'
              }`}
            >
              <span
                className={`box-border flex min-h-12 items-center rounded-[1.05rem] transition-[border-color,padding,gap] duration-150 ease-out ${
                  active
                    ? 'w-auto max-w-none gap-1.5 border-2 border-[#F0B429] px-1.5 py-0.5'
                    : 'size-12 shrink-0 justify-center border-2 border-transparent'
                }`}
              >
                <span className="flex size-[calc(36px*1.2)] shrink-0 items-center justify-center">
                  <ModeNavIconImg src={item.iconSrc} fallback={item.iconFallback} active={active} />
                </span>
                {active && (
                  <span
                    className="whitespace-nowrap text-left text-[12px] font-black uppercase leading-none tracking-wide"
                    aria-hidden
                  >
                    {item.label}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    )

  if (embedded || layout === 'filterRow') {
    return (
      <nav
        className={`pointer-events-none flex w-full shrink-0 justify-center ${className}`}
        aria-label={ariaLabel}
        {...ignoreAttr}
      >
        {inner}
      </nav>
    )
  }

  return (
    <nav
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center px-3 pt-1 sm:px-4 ${className}`}
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))' }}
      aria-label={ariaLabel}
      {...ignoreAttr}
    >
      {inner}
    </nav>
  )
}
