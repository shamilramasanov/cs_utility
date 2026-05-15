'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Meet } from '@/types/meet'
import { isBriefingComplete, lineupsHref, loadMeetFromStorage, meetHref } from '@/lib/meet'

interface MeetSessionValue {
  meetCode: string | null
  meet: Meet | null
  lineupsUrl: string | null
  tacticsUrl: string | null
  prefetchMap: (mapId: string) => void
}

const MeetSessionContext = createContext<MeetSessionValue | null>(null)

export function MeetSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const meetFromQuery = searchParams.get('meet')?.toUpperCase() ?? null
  const meetFromPath = pathname.match(/^\/team\/([^/?#]+)/)?.[1]?.toUpperCase() ?? null
  const meetCode = meetFromQuery ?? meetFromPath
  const [meet, setMeet] = useState<Meet | null>(null)

  useEffect(() => {
    if (!meetCode) {
      setMeet(null)
      return
    }
    const load = () => setMeet(loadMeetFromStorage(meetCode))
    load()
    const onStorage = (e: StorageEvent) => {
      if (e.key?.toUpperCase().includes(meetCode)) load()
    }
    window.addEventListener('storage', onStorage)
    const id = window.setInterval(load, 1500)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.clearInterval(id)
    }
  }, [meetCode])

  const prefetchMap = useCallback(
    (mapId: string) => {
      if (!meetCode) return
      const qs = new URLSearchParams({ meet: meetCode })
      if (meet?.side) qs.set('side', meet.side)
      router.prefetch(`/map/${mapId}?${qs.toString()}`)
    },
    [meet?.side, meetCode, router],
  )

  useEffect(() => {
    if (meet?.map && isBriefingComplete(meet)) prefetchMap(meet.map)
  }, [meet, prefetchMap])

  const tacticsUrl = useMemo(() => {
    if (!meetCode || !meet) return null
    const fromMeet = searchParams.get('fromMeet')
    return fromMeet ?? meetHref(meet, { plan: '1' })
  }, [meet, meetCode, searchParams])

  const lineupsUrl = useMemo(() => {
    if (!meet) return null
    return lineupsHref(meet, true)
  }, [meet])

  useEffect(() => {
    if (tacticsUrl) router.prefetch(tacticsUrl)
    if (lineupsUrl) router.prefetch(lineupsUrl)
  }, [lineupsUrl, router, tacticsUrl])

  const value = useMemo<MeetSessionValue>(() => {
    if (!meetCode || !meet) {
      return {
        meetCode,
        meet: null,
        lineupsUrl: null,
        tacticsUrl: null,
        prefetchMap,
      }
    }
    return {
      meetCode,
      meet,
      lineupsUrl,
      tacticsUrl,
      prefetchMap,
    }
  }, [lineupsUrl, meet, meetCode, prefetchMap, tacticsUrl])

  return <MeetSessionContext.Provider value={value}>{children}</MeetSessionContext.Provider>
}

export function useMeetSession() {
  return useContext(MeetSessionContext)
}
