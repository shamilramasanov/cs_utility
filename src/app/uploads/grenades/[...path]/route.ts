import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/** Отдача медиа из R2, если файла нет в статике деплоя. */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path: segments } = await ctx.params
  const key = `grenades/${segments.join('/')}`

  try {
    const media = getCloudflareContext().env.MEDIA
    if (!media) {
      return new NextResponse('Not found', { status: 404 })
    }
    const obj = await media.get(key)
    if (!obj) {
      return new NextResponse('Not found', { status: 404 })
    }
    const headers = new Headers()
    const type = obj.httpMetadata?.contentType
    if (type) headers.set('Content-Type', type)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    return new NextResponse(obj.body, { status: 200, headers })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
