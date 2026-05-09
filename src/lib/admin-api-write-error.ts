/** Ответ при ошибке записи JSON из админ-API (Vercel serverless — только чтение). */
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
        'Сохранение в JSON на этом хостинге недоступно (у Vercel файловая система деплоя только для чтения). Варианты: править через npm run dev локально и пушить изменения в Git; или перенести хранение в БД / Blob / VPS.',
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
