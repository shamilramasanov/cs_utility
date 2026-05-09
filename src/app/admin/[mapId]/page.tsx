import { notFound } from 'next/navigation'
import { getMap } from '@/lib/grenades'
import { getMergedPositionCatalog } from '@/lib/position-catalog-runtime'
import AdminMapClient from '@/components/admin/AdminMapClient'

interface Props {
  params: Promise<{ mapId: string }>
}

export default async function AdminMapPage({ params }: Props) {
  const { mapId } = await params
  const map = getMap(mapId)
  if (!map) notFound()

  const positionCatalog = await getMergedPositionCatalog()

  return (
    <AdminMapClient
      mapId={mapId}
      map={map}
      positionCatalog={positionCatalog}
    />
  )
}
