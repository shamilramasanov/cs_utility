'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { LINEUPS_VERSION_STORAGE_KEY } from '@/lib/lineups-sync'

/**
 * После сохранения в админке поднимается версия в localStorage; в других вкладках
 * и при возврате на вкладку карты — подтягиваем свежие server props (числа, маркеры).
 */
export default function LineupsDataRefresh() {
  const router = useRouter()
  const lastRef = useRef<string | null>(null)

  useEffect(() => {
    const readVersion = () => {
      try {
        return localStorage.getItem(LINEUPS_VERSION_STORAGE_KEY) ?? '0'
      } catch {
        return '0'
      }
    }

    const sync = () => {
      const cur = readVersion()
      if (lastRef.current === null) {
        lastRef.current = cur
        return
      }
      if (cur !== lastRef.current) {
        lastRef.current = cur
        router.refresh()
      }
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === LINEUPS_VERSION_STORAGE_KEY || e.key === null) sync()
    }

    const onVis = () => {
      if (document.visibilityState === 'visible') sync()
    }

    lastRef.current = readVersion()
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [router])

  return null
}
