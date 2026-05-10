import type { Grenade, Position, ThrowVariant } from '@/types'

/** Элемент галереи «откуда бросаем» (одна карточка / вариант броска). */
export interface ThrowOriginItem {
  key: string
  grenade: Grenade
  variantIndex: number
  title: string
  preview: string | null
  startPos: Position | null
}

function isStillImageUrl(url: string): boolean {
  const u = url.split('?')[0]?.toLowerCase() ?? ''
  return /\.(jpe?g|png|webp|gif)$/i.test(u)
}

/** Первая загруженная картинка из списков URL (пропускаем видео и прочие типы). */
function firstStillImageUrl(...buckets: Array<readonly string[] | string | null | undefined>): string | null {
  for (const b of buckets) {
    if (!b) continue
    if (typeof b === 'string') {
      const u = b.trim()
      if (u && isStillImageUrl(u)) return u
      continue
    }
    for (const raw of b) {
      const u = raw?.trim()
      if (u && isStillImageUrl(u)) return u
    }
  }
  return null
}

function previewForVariant(g: Grenade, v: ThrowVariant): string | null {
  return firstStillImageUrl(
    v.gallery_urls,
    v.method_media_url,
    g.gallery_urls,
    g.media_url && isStillImageUrl(g.media_url) ? g.media_url : undefined,
  )
}

function previewForSimpleGrenade(g: Grenade): string | null {
  return firstStillImageUrl(g.gallery_urls, g.media_url && isStillImageUrl(g.media_url) ? g.media_url : undefined)
}

export function buildThrowOriginItems(grenades: Grenade[]): ThrowOriginItem[] {
  return grenades.flatMap((g) => {
    const vars = g.throw_variants?.filter(Boolean) ?? []
    if (vars.length === 0) {
      return [
        {
          key: `${g.id}:0`,
          grenade: g,
          variantIndex: 0,
          title: 'Вариант 1',
          preview: previewForSimpleGrenade(g),
          startPos: g.start_pos ?? null,
        },
      ]
    }
    return vars.map((v, i) => ({
      key: `${g.id}:${i}`,
      grenade: g,
      variantIndex: i,
      title: v.label?.trim() || `Вариант ${i + 1}`,
      preview: previewForVariant(g, v),
      startPos: v.start_pos ?? g.start_pos ?? null,
    }))
  })
}
