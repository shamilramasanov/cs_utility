'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PositionOverride, PositionOverridesFile } from '@/types/positions'

/**
 * Загружает overrides позиций (модерируемые `screenshot_url` и т.п.) и
 * предоставляет помощник `screenshotFor(positionId)` для рендера карточек.
 *
 * Работает на любой публичной странице — endpoint GET без авторизации.
 */
export function usePositionOverrides() {
  const [overrides, setOverrides] = useState<Record<string, PositionOverride>>({})
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/position-overrides', { cache: 'no-store' })
      if (!r.ok) return
      const j = (await r.json()) as PositionOverridesFile
      setOverrides(j.overrides ?? {})
    } catch {
      /* offline / не критично — просто не отрисуем фото */
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const screenshotFor = useCallback(
    (positionId: string, fallback?: string): string | undefined => {
      const o = overrides[positionId]
      return o?.screenshot_url ?? fallback
    },
    [overrides],
  )

  return { overrides, loaded, refresh, screenshotFor }
}
