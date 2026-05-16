import type { LineupFeedItem } from '@/lib/lineup-feed-types'

export function lineupFeedDetailHref(item: LineupFeedItem): string {
  const sp = new URLSearchParams()
  sp.set('lineup', item.grenadeId)
  sp.set('variant', String(item.variantIndex))
  const sk = item.side === 'CT' ? 'ct' : item.side === 'T' ? 't' : 't'
  sp.set('side', sk)
  if (item.positionId) sp.set('pos', item.positionId)
  return `/map/${item.mapId}?${sp.toString()}`
}
