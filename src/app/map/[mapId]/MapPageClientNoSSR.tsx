'use client'

import { useEffect, useState } from 'react'
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
  bootstrapOnClient?: boolean
}

const MapPageClient = dynamic(() => import('@/components/MapPageClient'), {
  ssr: false,
  loading: () => <MapPageLoadingFallback />,
})

export default function MapPageClientNoSSR({
  bootstrapOnClient = false,
  mapId,
  initialGrenades,
  positionCatalog,
  initialQuery,
}: Props) {
  const [data, setData] = useState<{
    initialGrenades: Grenade[]
    positionCatalog: MapPosition[]
  } | null>(
    bootstrapOnClient ? null : { initialGrenades, positionCatalog },
  )
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!bootstrapOnClient) return
    const ac = new AbortController()
    setData(null)
    setFailed(false)
    ;(async () => {
      try {
        const res = await fetch(`/api/map/${encodeURIComponent(mapId)}/bootstrap`, {
          cache: 'no-store',
          signal: ac.signal,
        })
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as {
          initialGrenades: Grenade[]
          positionCatalog: MapPosition[]
        }
        if (!ac.signal.aborted) {
          setData(json)
          setFailed(false)
        }
      } catch (e) {
        if (ac.signal.aborted) return
        setFailed(true)
      }
    })()
    return () => ac.abort()
  }, [bootstrapOnClient, mapId])

  if (bootstrapOnClient && !data) {
    if (failed) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-app-screen py-12 text-center">
          <p className="text-sm text-[#888]">Не удалось загрузить карту. Обновите страницу.</p>
        </div>
      )
    }
    return <MapPageLoadingFallback />
  }

  const grenades = data?.initialGrenades ?? initialGrenades
  const catalog = data?.positionCatalog ?? positionCatalog

  return (
    <MapPageClient
      mapId={mapId}
      initialGrenades={grenades}
      positionCatalog={catalog}
      initialQuery={initialQuery}
    />
  )
}
