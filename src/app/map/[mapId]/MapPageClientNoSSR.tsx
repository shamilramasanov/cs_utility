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

const MapPageClient = dynamic(() => import('@/components/MapPageClient'), {
  ssr: false,
  loading: () => <MapPageLoadingFallback />,
})

export default function MapPageClientNoSSR({
  mapId,
  initialGrenades,
  positionCatalog,
  initialQuery,
}: Props) {
  return (
    <MapPageClient
      mapId={mapId}
      initialGrenades={initialGrenades}
      positionCatalog={positionCatalog}
      initialQuery={initialQuery}
    />
  )
}
