import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { isAdminAuthorized } from '@/lib/admin-auth'
import {
  ADMIN_ALLOWED_BLOB_CONTENT_TYPES,
  adminMaxBytesForMime,
} from '@/lib/admin-media-constants'

function maxBytesFromPathname(pathname: string): number {
  const lower = pathname.toLowerCase()
  if (/\.(mp4|webm|mov)$/.test(lower)) return adminMaxBytesForMime('video/mp4')
  if (/\.(jpe?g|png|webp|gif)$/.test(lower)) return adminMaxBytesForMime('image/jpeg')
  return adminMaxBytesForMime('video/mp4')
}

function assertSafeGrenadesPathname(pathname: string) {
  if (!pathname.startsWith('grenades/') || pathname.includes('..') || pathname.length > 220) {
    throw new Error('Invalid pathname')
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!token) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN не задан' }, { status: 503 })
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      token,
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        assertSafeGrenadesPathname(pathname)
        if (!isAdminAuthorized(request)) {
          throw new Error('Unauthorized')
        }
        return {
          allowedContentTypes: [...ADMIN_ALLOWED_BLOB_CONTENT_TYPES],
          maximumSizeInBytes: maxBytesFromPathname(pathname),
          addRandomSuffix: false,
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload error' },
      { status: 400 },
    )
  }
}
