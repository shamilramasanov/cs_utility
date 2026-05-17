/** Лимиты и MIME для `/api/admin/upload`. */

export const ADMIN_MAX_VIDEO_BYTES = 120 * 1024 * 1024
export const ADMIN_MAX_IMAGE_BYTES = 25 * 1024 * 1024

export const ADMIN_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'] as const
export const ADMIN_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export const ADMIN_VIDEO_TYPES = new Set<string>(ADMIN_VIDEO_MIMES)
export const ADMIN_IMAGE_TYPES = new Set<string>(ADMIN_IMAGE_MIMES)

export const ADMIN_EXT_BY_MIME: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

export function adminMaxBytesForMime(mime: string): number {
  return ADMIN_VIDEO_TYPES.has(mime) ? ADMIN_MAX_VIDEO_BYTES : ADMIN_MAX_IMAGE_BYTES
}

export function adminIsAllowedUploadMime(mime: string): boolean {
  return ADMIN_VIDEO_TYPES.has(mime) || ADMIN_IMAGE_TYPES.has(mime)
}
