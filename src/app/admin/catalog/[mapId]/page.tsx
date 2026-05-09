import { notFound } from 'next/navigation'
import { getMap } from '@/lib/grenades'
import AdminCatalogClient from '@/components/admin/AdminCatalogClient'

interface Props {
  params: Promise<{ mapId: string }>
}

export default async function AdminCatalogMapPage({ params }: Props) {
  const { mapId } = await params
  const map = getMap(mapId)
  if (!map) notFound()
  return <AdminCatalogClient mapId={mapId} map={map} />
}
