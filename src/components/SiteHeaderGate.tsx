'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

/**
 * next/dynamic + ssr: false — только в Client Component. Убирает гидрационные
 * рассинхроны шапки при Turbopack/HMR (старый RSC-HTML vs новый бандл).
 */
const SiteHeader = dynamic(() => import('./SiteHeader'), {
  ssr: false,
  loading: () => (
    <header
      className="shrink-0 border-b border-[#222] bg-[#0d0d0d]"
      role="banner"
      data-home-global-swipe-ignore
      aria-busy="true"
      aria-hidden
    >
      <div className="px-app-screen pb-3 pt-app-header">
        <div className="flex min-h-11 min-w-0 animate-pulse items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#1a1a1a]" />
            <div className="h-5 w-24 rounded-md bg-[#1a1a1a]" />
          </div>
          <div className="flex shrink-0 gap-2">
            <div className="h-9 w-14 rounded-lg bg-[#1a1a1a]" />
            <div className="h-9 w-9 shrink-0 rounded-full bg-[#1a1a1a]" />
          </div>
        </div>
      </div>
    </header>
  ),
})

export default function SiteHeaderGate() {
  return <SiteHeader />
}
