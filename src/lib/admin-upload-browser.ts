import { getAdminSecretFromBrowser } from '@/lib/admin-client'

function adminHeaders(): Record<string, string> {
  const sec = getAdminSecretFromBrowser()
  return sec ? { 'x-admin-secret': sec } : {}
}

/** Загрузка фото/видео в `/uploads/grenades/` (локально или R2 на Workers). */
export async function uploadGrenadeMedia(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch('/api/admin/upload', { method: 'POST', headers: adminHeaders(), body: fd })
  const j = (await r.json()) as { url?: string; error?: string }
  if (!r.ok || !j.url) throw new Error(j.error ?? 'Ошибка загрузки')
  return j.url
}
