import { getMap } from '@/lib/grenades'
import { getMergedGrenadesForMap } from '@/lib/lineups'
import { notFound } from 'next/navigation'
import MapPageClientNoSSR from './MapPageClientNoSSR'
import { getMergedPositionCatalog } from '@/lib/position-catalog-runtime'
import { mapPageQueryFromRecord } from '@/lib/map-page-initial-query'

/** ISR: данные карты кэшируются через `unstable_cache` в lib (до 60 с). */
export const revalidate = 60

interface Props {
  params: Promise<{ mapId: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined | null>>
}

export default async function MapPage({ params, searchParams }: Props) {
  const [{ mapId }, sp] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined | null>),
  ])
  const map = getMap(mapId)
  if (!map) notFound()

  const [initialGrenades, positionCatalog] = await Promise.all([
    getMergedGrenadesForMap(mapId),
    getMergedPositionCatalog(),
  ])
  const initialQuery = mapPageQueryFromRecord(sp)
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <MapPageClientNoSSR
        mapId={mapId}
        initialGrenades={initialGrenades}
        positionCatalog={positionCatalog}
        initialQuery={initialQuery}
      />
    </div>
  )
}
