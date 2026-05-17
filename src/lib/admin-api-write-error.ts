/** Ответ при ошибке записи JSON из админ-API (read-only FS на Workers). */
function errnoCode(e: unknown): string {
  if (typeof e !== 'object' || e === null || !('code' in e)) return ''
  const c = (e as { code?: unknown }).code
  return typeof c === 'string' || typeof c === 'number' ? String(c) : ''
}

export function jsonFromAdminWriteCatch(e: unknown): { error: string } {
  const code = errnoCode(e)
  const msg = e instanceof Error ? e.message : String(e)
  const readOnlyFs =
    code === 'EROFS' ||
    code === 'EPERM' ||
    /EROFS|read-only file system|READONLY/i.test(msg)

  if (readOnlyFs) {
    return {
      error:
        'Сохранение в JSON на Workers недоступно (файловая система деплоя только для чтения). Контент редактора хранится в D1; медиа — в R2 или public/uploads + git.',
    }
  }
  return { error: msg || 'Invalid body' }
}

export function statusFromAdminWriteCatch(e: unknown): number {
  const code = errnoCode(e)
  const msg = e instanceof Error ? e.message : String(e)
  const readOnlyFs =
    code === 'EROFS' ||
    code === 'EPERM' ||
    /EROFS|read-only file system|READONLY/i.test(msg)
  return readOnlyFs ? 503 : 400
}
