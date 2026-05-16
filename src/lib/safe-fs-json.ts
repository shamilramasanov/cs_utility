import fs from 'fs'
import path from 'path'

/** Чтение JSON из репо; на Workers fs может быть недоступен — не роняем запрос. */
export function readJsonFromRepo<T>(
  relPath: string,
  fallback: T,
  normalize: (raw: unknown) => T,
): T {
  try {
    const p = path.join(process.cwd(), relPath)
    if (!fs.existsSync(p)) return fallback
    const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as unknown
    return normalize(raw)
  } catch (e) {
    console.error('[safe-fs-json]', relPath, e)
    return fallback
  }
}
