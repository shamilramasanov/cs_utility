import type { Meet } from '@/types/meet'
import type { Side } from '@/types'

export function normalizeMeet(raw: Meet): Meet {
  const map = raw.map ?? null
  const side = raw.side ?? null
  const tactic_id = raw.tactic_id ?? null
  const briefing_locked =
    raw.briefing_locked ?? Boolean(map && side && tactic_id)
  return {
    ...raw,
    map,
    side,
    tactic_id,
    briefing_locked,
  }
}

export function isBriefingComplete(meet: Meet): boolean {
  return Boolean(meet.briefing_locked && meet.map && meet.side && meet.tactic_id)
}

export function encodeMeetPayload(meet: Meet): string {
  const json = JSON.stringify(normalizeMeet(meet))
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function decodeMeetPayload(encoded: string): Meet | null {
  try {
    let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const json = decodeURIComponent(escape(atob(b64)))
    const parsed = JSON.parse(json) as Meet
    if (!parsed?.code || !parsed?.secret) return null
    return normalizeMeet(parsed)
  } catch {
    return null
  }
}
