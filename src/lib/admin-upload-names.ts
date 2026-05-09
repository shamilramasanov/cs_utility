import { ADMIN_EXT_BY_MIME, ADMIN_VIDEO_TYPES } from '@/lib/admin-media-constants'

function extFromOriginalName(name: string): string {
  const m = /\.([^.]+)$/.exec(name.trim())
  return m ? `.${m[1].toLowerCase()}` : ''
}

export function sanitizeUploadBaseName(name: string): string {
  const withoutExt = name.replace(/\.[^/.]+$/, '')
  const ascii = withoutExt
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return ascii || 'file'
}

/** Имя файла как в локальном `public/uploads/grenades/` (без каталога). */
export function makeGrenadeStoredFilename(originalName: string, mime: string, shortId: string): string {
  const ext =
    ADMIN_EXT_BY_MIME[mime] ||
    extFromOriginalName(originalName || '') ||
    (ADMIN_VIDEO_TYPES.has(mime) ? '.mp4' : '.bin')
  const baseName = sanitizeUploadBaseName(originalName || 'file')
  return `${baseName}-${shortId}${ext}`
}
