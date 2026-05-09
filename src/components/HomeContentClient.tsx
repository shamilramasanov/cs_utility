'use client'

import dynamic from 'next/dynamic'
import type { Grenade, MapData } from '@/types'
import type { MapPosition } from '@/types/positions'

interface MapEntry {
  map: MapData
  grenadeCount: number
}

export interface HomeContentClientProps {
  mapsWithCounts: MapEntry[]
  grenadesByMap: Record<string, Grenade[]>
  positionCatalog: MapPosition[]
}

/**
 * next/dynamic с ssr: false допустим только в Client Component — иначе падает сборка.
 * Обход рассинхрона RSC/HTML и клиентского бандла в dev (Turbopack/HMR).
 */
const HomeContent = dynamic(() => import('./HomeContent'), {
  ssr: false,
  loading: () => (
    <div
      className="relative flex min-h-[50vh] flex-1 flex-col bg-[#0d0d0d]"
      aria-hidden
    >
      <div className="animate-pulse px-app-screen pt-3">
        <div className="mb-2 h-11 w-full rounded-2xl bg-[#1a1a1a]" />
        <div className="mb-3 h-3 w-3/4 max-w-xs rounded bg-[#1a1a1a]" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-[#1a1a1a]" />
          ))}
        </div>
      </div>
    </div>
  ),
})

export default function HomeContentClient(props: HomeContentClientProps) {
  return <HomeContent {...props} />
}
