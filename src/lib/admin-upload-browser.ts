import { upload as blobClientUpload } from '@vercel/blob/client'
import { getAdminSecretFromBrowser } from '@/lib/admin-client'
import { makeGrenadeStoredFilename } from '@/lib/admin-upload-names'

const MULTIPART_THRESHOLD = 4.5 * 1024 * 1024

function adminHeaders(): Record<string, string> {
  const sec = getAdminSecretFromBrowser()
  return sec ? { 'x-admin-secret': sec } : {}
}

/**
 * Загрузка фото/видео для админки: при наличии `BLOB_READ_WRITE_TOKEN` на сервере — напрямую в Vercel Blob
 * (без лимита тела serverless ~4.5 MB). Иначе — POST `/api/admin/upload` в `public/uploads/grenades/`.
 */
export async function uploadGrenadeMedia(file: File): Promise<string> {
  const headers = adminHeaders()

  const modeRes = await fetch('/api/admin/media-storage', { headers })
  if (!modeRes.ok) {
    let msg = `Storage ${modeRes.status}`
    try {
      const j = (await modeRes.json()) as { error?: string }
      if (j.error) msg = j.error
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  const { storage } = (await modeRes.json()) as { storage: 'blob' | 'local' }

  const mime = file.type || 'application/octet-stream'

  if (storage === 'blob') {
    const shortId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : `x${Date.now().toString(36)}`
    const filename = makeGrenadeStoredFilename(file.name, mime, shortId)
    const pathname = `grenades/${filename}`
    const result = await blobClientUpload(pathname, file, {
      access: 'public',
      handleUploadUrl: '/api/admin/blob-upload',
      headers,
      multipart: file.size > MULTIPART_THRESHOLD,
      contentType: mime || undefined,
    })
    return result.url
  }

  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch('/api/admin/upload', { method: 'POST', headers, body: fd })
  const j = (await r.json()) as { url?: string; error?: string }
  if (!r.ok || !j.url) throw new Error(j.error ?? 'Ошибка загрузки')
  return j.url
}
