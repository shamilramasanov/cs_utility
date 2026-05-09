'use client'

import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { LOCALES, type Locale } from '@/i18n/types'

const SHORT_LABELS: Record<Locale, string> = {
  ru: 'РУ',
  en: 'EN',
  uk: 'УКР',
}

interface Props {
  /** Полная подпись (например, в шапке) или иконкой (в углу). */
  variant?: 'compact' | 'full'
  className?: string
}

export default function LanguageSwitcher({ variant = 'compact', className = '' }: Props) {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeIfOutside = (e: MouseEvent | PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeIfOutside, true)
    return () => document.removeEventListener('pointerdown', closeIfOutside, true)
  }, [open])

  const label = variant === 'full' ? t(`language.${locale}` as const) : SHORT_LABELS[locale]

  return (
    <div ref={ref} className={`relative z-[120] ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 min-w-[64px] px-2.5 rounded-full bg-[#1a1a1a] border border-[#333] text-[12px] font-black tracking-wide text-white flex items-center justify-center gap-1 active:scale-95 transition-transform uppercase"
        aria-label={t('language.label')}
        aria-expanded={open}
      >
        <span>{label}</span>
        <span className="text-[#888]" aria-hidden>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-[130] mt-2 min-w-[96px] rounded-[16px] border border-[#2a2a2a] bg-[#141414] p-1 shadow-xl"
        >
          {LOCALES.map((l) => {
            const active = l === locale
            return (
              <button
                key={l}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setLocale(l)
                  setOpen(false)
                }}
                className={`flex h-9 w-full items-center justify-between rounded-xl border px-3 text-left uppercase tracking-wide transition-colors ${
                  active
                    ? 'border-[#F0B429]/70 bg-[#F0B429]/12 text-[#F0B429]'
                    : 'border-transparent bg-transparent text-white hover:border-[#2f2f2f] hover:bg-[#202020]'
                }`}
                style={{
                  fontFamily:
                    'Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: active ? 800 : 700,
                  fontSize: '12px',
                }}
              >
                <span className="leading-none">{SHORT_LABELS[l]}</span>
                <span className="inline-flex w-4 items-center justify-center leading-none" aria-hidden>
                  {active ? '✓' : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
