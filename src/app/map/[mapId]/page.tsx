import { getMap } from '@/lib/grenades'
import { notFound } from 'next/navigation'
import MapPageClientNoSSR from './MapPageClientNoSSR'
import { mapPageQueryFromRecord } from '@/lib/map-page-initial-query'

interface Props {
  params: Promise<{ mapId: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined | null>>
}

/** Лёгкий RSC-shell; данные карты — GET /api/map/[mapId]/bootstrap на клиенте. */
export default async function MapPage({ params, searchParams }: Props) {
  const [{ mapId }, sp] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined | null>),
  ])
  if (!getMap(mapId)) notFound()

  const initialQuery = mapPageQueryFromRecord(sp)
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <MapPageClientNoSSR
        mapId={mapId}
        initialGrenades={[]}
        positionCatalog={[]}
        initialQuery={initialQuery}
        bootstrapOnClient
      />
    </div>
  )
}
