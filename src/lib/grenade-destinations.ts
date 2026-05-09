import type { Grenade, ThrowVariant } from '@/types'

function round4(n: number): string {
  return (Math.round(n * 10000) / 10000).toFixed(4)
}

function toVariant(g: Grenade, index: number): ThrowVariant {
  return {
    id: `${g.id}-v${index + 1}`,
    label: `Вариант ${index + 1}`,
    start_pos: g.start_pos,
    throw_type: g.throw_type ?? 'normal',
    media_url: g.media_url ?? null,
    gallery_urls: (g.gallery_urls ?? []).filter(Boolean),
    description: g.description ?? '',
  }
}

function variantSignature(v: ThrowVariant): string {
  return [
    round4(v.start_pos.x),
    round4(v.start_pos.y),
    v.throw_type ?? 'normal',
    v.media_url ?? '',
  ].join('|')
}

/**
 * Группирует гранаты в "цели" (куда кидаем), объединяя варианты стартовых позиций.
 * Это убирает дубли маркеров одной и той же точки прилёта и даёт UX
 * "цель -> список откуда бросать".
 */
export function mergeGrenadesByDestination(grenades: Grenade[]): Grenade[] {
  const groups = new Map<string, Grenade>()

  for (const g of grenades) {
    const land = g.land_pos ?? g.start_pos
    const key = [
      g.map,
      g.layer_file ?? '',
      g.side,
      g.type,
      g.title.trim().toLowerCase(),
      round4(land.x),
      round4(land.y),
    ].join('::')

    const sourceVariants = (g.throw_variants?.filter(Boolean) ?? []).length
      ? (g.throw_variants?.filter(Boolean) ?? [])
      : [toVariant(g, 0)]

    const current = groups.get(key)
    if (!current) {
      groups.set(key, {
        ...g,
        land_pos: { x: land.x, y: land.y },
        start_pos: sourceVariants[0]?.start_pos ?? g.start_pos,
        throw_type: sourceVariants[0]?.throw_type ?? g.throw_type,
        media_url: sourceVariants[0]?.media_url ?? g.media_url,
        gallery_urls: sourceVariants[0]?.gallery_urls ?? g.gallery_urls,
        position_ids: (g.position_ids ?? []).filter(Boolean),
        throw_variants: sourceVariants.map((v, i) => ({
          ...v,
          label: v.label?.trim() || `Вариант ${i + 1}`,
        })),
      })
      continue
    }

    const existing = current.throw_variants ?? []
    const seen = new Set(existing.map(variantSignature))
    const posIds = new Set((current.position_ids ?? []).filter(Boolean))
    for (const id of g.position_ids ?? []) {
      if (id) posIds.add(id)
    }

    for (const v of sourceVariants) {
      const sig = variantSignature(v)
      if (seen.has(sig)) continue
      seen.add(sig)
      existing.push({
        ...v,
        label: v.label?.trim() || `Вариант ${existing.length + 1}`,
      })
    }

    current.throw_variants = existing
    current.position_ids = Array.from(posIds)
  }

  return Array.from(groups.values())
}

