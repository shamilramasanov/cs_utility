'use client'

import Link from 'next/link'
import LanguageSwitcher from './LanguageSwitcher'
import { useT } from '@/i18n'
import { BRAND_NAME, BRAND_WORDMARK_ACCENT_FROM } from '@/lib/brand'

/**
 * Общая шапка: логотип слева (→ главная), справа — язык и админка.
 */
export default function SiteHeader() {
  const t = useT()

  return (
    <header
      className="shrink-0 border-b border-[#222] bg-[#0d0d0d]"
      role="banner"
    >
      <div className="px-app-screen pb-3 pt-app-header">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link
            href="/"
            prefetch={false}
            className="flex min-w-0 max-w-[min(100%,300px)] items-center gap-2.5 rounded-lg pr-1 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0B429] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] [-webkit-tap-highlight-color:transparent]"
            aria-label={t('home.logoLink')}
          >
            <img
              src="/logo-home.png"
              alt=""
              width={128}
              height={128}
              decoding="async"
              fetchPriority="high"
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-[#F0B429]/35 md:h-11 md:w-11"
            />
            <span className="truncate font-bold text-[1.05rem] leading-tight tracking-tight text-white md:text-lg">
              {BRAND_NAME.slice(0, BRAND_WORDMARK_ACCENT_FROM)}
              <span className="text-[#F0B429]">{BRAND_NAME.slice(BRAND_WORDMARK_ACCENT_FROM)}</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/admin"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#333] bg-[#1a1a1a] text-xs font-semibold text-[#F0B429]"
              title="Admin"
            >
              A
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
