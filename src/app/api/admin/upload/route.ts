import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { isAdminAuthorized } from '@/lib/admin-auth'
import {
  ADMIN_MAX_IMAGE_BYTES,
  ADMIN_MAX_VIDEO_BYTES,
  adminIsAllowedUploadMime,
  ADMIN_VIDEO_TYPES,
} from '@/lib/admin-media-constants'
import { makeGrenadeStoredFilename } from '@/lib/admin-upload-names'

export async function POST(req: NextRequest) {
  try {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fd = await req.formData()
    const file = fd.get('file')
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Нет файла' }, { status: 400 })
    }

    const mime = file.type || 'application/octet-stream'
    if (!adminIsAllowedUploadMime(mime)) {
      return NextResponse.json({ error: 'Недопустимый тип файла' }, { status: 400 })
    }

    const max = ADMIN_VIDEO_TYPES.has(mime) ? ADMIN_MAX_VIDEO_BYTES : ADMIN_MAX_IMAGE_BYTES
    if (file.size > max) {
      return NextResponse.json({ error: 'Файл слишком большой' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const originalName = file instanceof File ? file.name || '' : ''
    const name = makeGrenadeStoredFilename(originalName, mime, randomUUID().slice(0, 8))
    const relDir = ['public', 'uploads', 'grenades']
    const dir = path.join(process.cwd(), ...relDir)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, name), buf)

    const url = `/uploads/grenades/${name}`
    return NextResponse.json({ ok: true, url })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 })
  }
}
