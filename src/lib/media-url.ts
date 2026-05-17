import type { Grenade } from '@/types'

/** Старые URL Vercel Blob → относительные пути (файлы в `public/uploads/grenades/` или R2). */
const VERCEL_BLOB_GRENADES_RE =
  /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/grenades\//i

export function normalizeMediaUrl(url: string | null | undefined): string | null {
  const t = url?.trim()
  if (!t) return null
  if (VERCEL_BLOB_GRENADES_RE.test(t)) {
    return t.replace(VERCEL_BLOB_GRENADES_RE, '/uploads/grenades/')
  }
  return t
}

export function normalizeMediaUrlList(urls: string[] | null | undefined): string[] {
  if (!urls?.length) return []
  return urls.map((u) => normalizeMediaUrl(u) ?? u).filter(Boolean)
}

/** Подмена legacy Vercel Blob URL во всём объекте раскидки. */
export function normalizeGrenadeMedia(g: Grenade): Grenade {
  const throw_variants = g.throw_variants?.map((v) => ({
    ...v,
    media_url: normalizeMediaUrl(v.media_url),
    method_media_url: normalizeMediaUrl(v.method_media_url),
    gallery_urls: normalizeMediaUrlList(v.gallery_urls),
  }))
  return {
    ...g,
    media_url: normalizeMediaUrl(g.media_url),
    gallery_urls: normalizeMediaUrlList(g.gallery_urls),
    throw_variants,
  }
}
