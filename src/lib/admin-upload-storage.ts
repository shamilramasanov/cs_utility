import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const UPLOAD_PREFIX = 'grenades/'

export async function saveGrenadeMediaFile(
  name: string,
  buf: Buffer,
  mime: string,
): Promise<{ url: string }> {
  try {
    const media = getCloudflareContext().env.MEDIA
    if (media) {
      await media.put(`${UPLOAD_PREFIX}${name}`, buf, {
        httpMetadata: { contentType: mime || 'application/octet-stream' },
      })
      return { url: `/uploads/grenades/${name}` }
    }
  } catch {
    /* dev без Workers — пишем на диск */
  }

  const dir = path.join(process.cwd(), 'public', 'uploads', 'grenades')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, name), buf)
  return { url: `/uploads/grenades/${name}` }
}
