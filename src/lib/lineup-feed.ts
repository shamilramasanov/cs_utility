import { customLineupToGrenade } from '@/lib/lineup-conversion'
import { getMaps, getMap } from '@/lib/grenades'
import type { CustomLineupsFile } from '@/types'
import { getSeedGrenadesForMap, readCustomLineupsFile } from '@/lib/lineups'
import { getPositionById } from '@/lib/positions'
import { getThrowMethodLabel } from '@/lib/throw-labels'
import type { LineupFeedItem } from '@/lib/lineup-feed-types'
import type { MapPosition } from '@/types/positions'
import type { Grenade } from '@/types'

function cleanText(raw: string | undefined | null): string {
  const t = raw?.trim() ?? ''
  return t && t !== 'unused' ? t : ''
}

function feedTextsFromGrenade(g: Grenade, variantIndex: number): {
  throwMethodLabel: string
  methodHint: string
  description: string
} {
  const variants = g.throw_variants?.filter(Boolean) ?? []
  const v = variants[variantIndex]
  const throwMethodLabel = getThrowMethodLabel(v?.throw_type ?? g.throw_type)
  const methodHint = cleanText(v?.method_hint)
  const variantDesc = cleanText(v?.description)
  const rootDesc = cleanText(g.description)
  const description = methodHint || variantDesc || rootDesc
  return { throwMethodLabel, methodHint, description }
}

export type { LineupFeedItem } from '@/lib/lineup-feed-types'
export { lineupFeedDetailHref } from '@/lib/lineup-feed-nav'

function pushVideosFromGrenade(
  g: Grenade,
  mapName: string,
  positionCatalog: MapPosition[],
  items: LineupFeedItem[],
  feedOrder: number,
): void {
  const posId = g.position_ids?.[0] ?? null
  const pos = posId ? getPositionById(posId, positionCatalog) : undefined
  const positionLabel = pos?.label?.trim() || null

  const variants = g.throw_variants?.filter(Boolean) ?? []
  if (variants.length > 0) {
    variants.forEach((v, idx) => {
      const url = v.media_url?.trim()
      if (!url) return
      const texts = feedTextsFromGrenade(g, idx)
      items.push({
        id: `${g.id}:${idx}`,
        grenadeId: g.id,
        mapId: g.map,
        mapName,
        variantIndex: idx,
        videoUrl: url,
        title: g.title,
        description: texts.description,
        throwMethodLabel: texts.throwMethodLabel,
        methodHint: texts.methodHint,
        type: g.type,
        side: g.side,
        positionId: posId,
        positionLabel,
        variantLabel: v.label?.trim() || null,
        feedOrder,
      })
    })
    return
  }

  const url = g.media_url?.trim()
  if (!url) return
  const texts = feedTextsFromGrenade(g, 0)
  items.push({
    id: `${g.id}:0`,
    grenadeId: g.id,
    mapId: g.map,
    mapName,
    variantIndex: 0,
    videoUrl: url,
    title: g.title,
    description: texts.description,
    throwMethodLabel: texts.throwMethodLabel,
    methodHint: texts.methodHint,
    type: g.type,
    side: g.side,
    positionId: posId,
    positionLabel,
    variantLabel: null,
    feedOrder,
  })
}

/** Все видео раскидок: сначала недавние из админки, затем сиды. */
export async function buildLineupFeedItems(
  positionCatalog: MapPosition[],
  customFilePreloaded?: CustomLineupsFile,
): Promise<LineupFeedItem[]> {
  const items: LineupFeedItem[] = []
  let order = 10_000

  const customFile = customFilePreloaded ?? (await readCustomLineupsFile())
  for (let i = customFile.lineups.length - 1; i >= 0; i--) {
    const g = customLineupToGrenade(customFile.lineups[i])
    const mapName = getMap(g.map)?.display_name ?? g.map
    pushVideosFromGrenade(g, mapName, positionCatalog, items, order--)
  }

  const hidden = new Set(customFile.hidden_seed_ids ?? [])
  for (const map of getMaps()) {
    const mapName = map.display_name
    for (const g of getSeedGrenadesForMap(map.id)) {
      if (hidden.has(g.id)) continue
      pushVideosFromGrenade(g, mapName, positionCatalog, items, order--)
    }
  }

  return items.sort((a, b) => b.feedOrder - a.feedOrder)
}
