const PREFIX = 'cs2gren:bootstrap:'

export function readClientBootstrapCache<T>(key: string, ttlMs: number): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return null
    const { at, data } = JSON.parse(raw) as { at: number; data: T }
    if (Date.now() - at > ttlMs) return null
    return data
  } catch {
    return null
  }
}

export function writeClientBootstrapCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), data }))
  } catch {
    /* quota */
  }
}

/** 5 мин — повторные переходы по сайту без ожидания cold DB. */
export const CLIENT_BOOTSTRAP_TTL_MS = 5 * 60 * 1000
