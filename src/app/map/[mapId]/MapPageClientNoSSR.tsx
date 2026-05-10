'use client'

import dynamic from 'next/dynamic'
import type { Grenade } from '@/types'
import type { MapPosition } from '@/types/positions'
import type { MapPageInitialQuery } from '@/lib/map-page-initial-query'
import MapPageLoadingFallback from './MapPageLoadingFallback'

interface Props {
  mapId: string
  initialGrenades: Grenade[]
  positionCatalog: MapPosition[]
  initialQuery: MapPageInitialQuery
}

/**
 * Один уровень `dynamic({ ssr: false })`. Раньше тут была обёртка над обёрткой
 * (`MapPageClientNoSSR` + ещё один `dynamic` внутри `MapPageClient.tsx`),
 * из-за чего получался лишний проход «fallback → fallback → реальный UI».
 */
const MapPageClient = dynamic(() => import('@/components/MapPageClient'), {
  ssr: false,
  loading: () => <MapPageLoadingFallback />,
})

export default function MapPageClientNoSSR(props: Props) {
  return <MapPageClient {...props} />
}
