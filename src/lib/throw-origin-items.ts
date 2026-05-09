import type { Grenade, Position } from '@/types'

/** Элемент галереи «откуда бросаем» (одна карточка / вариант броска). */
export interface ThrowOriginItem {
  key: string
  grenade: Grenade
  variantIndex: number
  title: string
  preview: string | null
  startPos: Position | null
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
          preview: g.gallery_urls?.[0] ?? null,
          startPos: g.start_pos ?? null,
        },
      ]
    }
    return vars.map((v, i) => ({
      key: `${g.id}:${i}`,
      grenade: g,
      variantIndex: i,
      title: v.label?.trim() || `Вариант ${i + 1}`,
      preview: v.gallery_urls?.[0] ?? g.gallery_urls?.[0] ?? null,
      startPos: v.start_pos ?? g.start_pos ?? null,
    }))
  })
}
