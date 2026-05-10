'use client'

import { useCallback, useSyncExternalStore } from 'react'
import type { PositionOverride, PositionOverridesFile } from '@/types/positions'

type Overrides = Record<string, PositionOverride>

const EMPTY: Overrides = {}

let cache: Overrides | null = null
let loadPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const fn of listeners) fn()
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  if (cache === null && loadPromise === null) {
    loadPromise = (async () => {
      try {
        const r = await fetch('/api/admin/position-overrides', { cache: 'no-store' })
        if (r.ok) {
          const j = (await r.json()) as PositionOverridesFile
          cache = j.overrides ?? {}
        } else {
          cache = {}
        }
      } catch {
        cache = {}
      } finally {
        loadPromise = null
        emit()
      }
    })()
  }
  return () => {
    listeners.delete(onChange)
  }
}

function getSnapshot(): Overrides {
  return cache ?? EMPTY
}

function getServerSnapshot(): Overrides {
  return EMPTY
}

/**
 * Overrides позиций (скриншоты и т.п.) — один общий fetch на всех подписчиков,
 * чтобы не дёргать `/api/admin/position-overrides` по разу на каждый смонтированный
 * `PositionPhotoGrid` / `SubspotPicker` / `MapPageClient` и т.д.
 */
export function usePositionOverrides() {
  const overrides = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const loaded = cache !== null

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/position-overrides', { cache: 'no-store' })
      if (!r.ok) return
      const j = (await r.json()) as PositionOverridesFile
      cache = j.overrides ?? {}
    } catch {
      /* offline — оставляем предыдущий cache */
    } finally {
      emit()
    }
  }, [])

  const screenshotFor = useCallback(
    (positionId: string, fallback?: string): string | undefined => {
      const o = overrides[positionId]
      return o?.screenshot_url ?? fallback
    },
    [overrides],
  )

  return { overrides, loaded, refresh, screenshotFor }
}
