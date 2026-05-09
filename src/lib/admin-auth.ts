import type { NextRequest } from 'next/server'

/**
 * Чтение GET в production: нужен ADMIN_SECRET в .env и совпадение с заголовком/параметром.
 * В development GET всегда разрешён (см. isAdminReadAuthorized).
 */
export function isAdminReadAuthorized(req: NextRequest): boolean {
  return process.env.NODE_ENV !== 'production' || isAdminAuthorized(req)
}

/**
 * Запись (POST/PATCH/загрузки): в development всегда разрешена — иначе при ADMIN_SECRET в .env
 * список точек грузился без ключа, а сохранение (в т.ч. удаление) получало 401 и не писало файл.
 * В production: если ADMIN_SECRET задан — нужен тот же ключ; если не задан — запись запрещена.
 */
export function isAdminAuthorized(req: NextRequest, bodySecret?: string): boolean {
  if (process.env.NODE_ENV !== 'production') return true

  const h = req.headers.get('x-admin-secret')
  const q = req.nextUrl.searchParams.get('secret')
  const s = (bodySecret ?? h ?? q ?? '').trim()
  const configured = process.env.ADMIN_SECRET?.trim()
  if (configured) return s === configured
  return false
}
