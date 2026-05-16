'use client'

import { Suspense, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  CLIENT_BOOTSTRAP_TTL_MS,
  readClientBootstrapCache,
  writeClientBootstrapCache,
} from '@/lib/client-bootstrap-cache'
import type { Grenade, MapData } from '@/types'
import type { MapPosition } from '@/types/positions'
import type { LineupFeedItem } from '@/lib/lineup-feed-types'

interface MapEntry {
  map: MapData
  grenadeCount: number
}

export interface HomeContentClientProps {
  mapsWithCounts: MapEntry[]
  grenadesByMap: Record<string, Grenade[]>
  positionCatalog: MapPosition[]
  lineupFeedItems: LineupFeedItem[]
  /** Cloudflare Workers: данные с /api/home/bootstrap после mount */
  bootstrapOnClient?: boolean
}

const HomeContent = dynamic(() => import('./HomeContent'), {
  ssr: false,
  loading: () => <HomeBootstrapSkeleton />,
})

function HomeBootstrapSkeleton() {
  return (
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
        <p className="mt-4 text-center text-xs text-[#666]">Загрузка данных…</p>
      </div>
    </div>
  )
}

type HomeBootstrapPayload = Omit<HomeContentClientProps, 'bootstrapOnClient'>

export default function HomeContentClient({
  bootstrapOnClient = false,
  ...initial
}: HomeContentClientProps) {
  const [data, setData] = useState<HomeContentClientProps | null>(() => {
    if (!bootstrapOnClient) return { ...initial, bootstrapOnClient: false }
    const cached = readClientBootstrapCache<HomeBootstrapPayload>('home', CLIENT_BOOTSTRAP_TTL_MS)
    return cached ? { ...cached, bootstrapOnClient: false } : null
  })
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!bootstrapOnClient) return
    let cancelled = false
    const hadCache = readClientBootstrapCache<HomeBootstrapPayload>('home', CLIENT_BOOTSTRAP_TTL_MS) != null
    ;(async () => {
      try {
        const res = await fetch('/api/home/bootstrap')
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as HomeBootstrapPayload
        writeClientBootstrapCache('home', json)
        if (!cancelled) {
          setData({ ...json, bootstrapOnClient: false })
          setFailed(false)
        }
      } catch {
        if (!cancelled && !hadCache) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- один fetch при mount / bootstrapOnClient
  }, [bootstrapOnClient])

  if (bootstrapOnClient && !data) {
    if (failed) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-app-screen py-12 text-center">
          <p className="text-sm text-[#888]">
            Не удалось загрузить данные с сервера. Проверьте DATABASE_PUBLIC_URL в Cloudflare и обновите страницу.
          </p>
        </div>
      )
    }
    return <HomeBootstrapSkeleton />
  }

  const payload = data ?? { ...initial, bootstrapOnClient: false }
  const { bootstrapOnClient: _bootstrap, ...contentProps } = payload

  return (
    <Suspense fallback={<HomeBootstrapSkeleton />}>
      <HomeContent {...contentProps} />
    </Suspense>
  )
}
