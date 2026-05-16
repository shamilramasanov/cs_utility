'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  CLIENT_BOOTSTRAP_TTL_MS,
  readClientBootstrapCache,
  writeClientBootstrapCache,
} from '@/lib/client-bootstrap-cache'
import type { Grenade } from '@/types'
import type { MapPosition, PositionZone } from '@/types/positions'
import type { MapPageInitialQuery } from '@/lib/map-page-initial-query'
import MapPageLoadingFallback from './MapPageLoadingFallback'

interface Props {
  mapId: string
  initialGrenades: Grenade[]
  positionCatalog: MapPosition[]
  initialQuery: MapPageInitialQuery
  bootstrapOnClient?: boolean
}

type MapBootstrapPayload = {
  initialGrenades: Grenade[]
  positionCatalog: MapPosition[]
  zonesBySide: { t: PositionZone[]; ct: PositionZone[] }
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
  const cacheKey = `map:${mapId}`
  const [data, setData] = useState<MapBootstrapPayload | null>(() => {
    if (!bootstrapOnClient) {
      return { initialGrenades, positionCatalog, zonesBySide: { t: [], ct: [] } }
    }
    return readClientBootstrapCache<MapBootstrapPayload>(cacheKey, CLIENT_BOOTSTRAP_TTL_MS)
  })
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!bootstrapOnClient) return
    const ac = new AbortController()
    const hadCache = readClientBootstrapCache<MapBootstrapPayload>(cacheKey, CLIENT_BOOTSTRAP_TTL_MS) != null
    if (!hadCache) {
      setData(null)
      setFailed(false)
    }
    ;(async () => {
      try {
        const res = await fetch(`/api/map/${encodeURIComponent(mapId)}/bootstrap`, {
          signal: ac.signal,
        })
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as MapBootstrapPayload
        writeClientBootstrapCache(cacheKey, json)
        if (!ac.signal.aborted) {
          setData(json)
          setFailed(false)
        }
      } catch (e) {
        if (ac.signal.aborted) return
        if (!hadCache) setFailed(true)
      }
    })()
    return () => ac.abort()
  }, [bootstrapOnClient, mapId, cacheKey])

  if (bootstrapOnClient && !data) {
    if (failed) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-app-screen py-12 text-center">
          <p className="text-sm text-[#888]">
            Не удалось загрузить карту. Проверьте DATABASE_PUBLIC_URL в Cloudflare и обновите страницу.
          </p>
        </div>
      )
    }
    return <MapPageLoadingFallback />
  }

  const grenades = data?.initialGrenades ?? initialGrenades
  const catalog = data?.positionCatalog ?? positionCatalog
  const zonesBySide = data?.zonesBySide

  return (
    <MapPageClient
      mapId={mapId}
      initialGrenades={grenades}
      positionCatalog={catalog}
      initialQuery={initialQuery}
      initialZonesBySide={zonesBySide}
    />
  )
}
