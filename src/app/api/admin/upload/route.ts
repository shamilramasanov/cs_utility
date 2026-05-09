import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { isAdminAuthorized } from '@/lib/admin-auth'

const MAX_VIDEO = 120 * 1024 * 1024
const MAX_IMAGE = 25 * 1024 * 1024

const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const EXT: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

function sanitizeBaseName(name: string): string {
  const withoutExt = name.replace(/\.[^/.]+$/, '')
  const ascii = withoutExt
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return ascii || 'file'
}

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
    const isVideo = VIDEO_TYPES.has(mime)
    const isImage = IMAGE_TYPES.has(mime)
    if (!isVideo && !isImage) {
      return NextResponse.json({ error: 'Недопустимый тип файла' }, { status: 400 })
    }

    const max = isVideo ? MAX_VIDEO : MAX_IMAGE
    if (file.size > max) {
      return NextResponse.json({ error: 'Файл слишком большой' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const ext =
      EXT[mime] || path.extname((file as File).name || '') || (isVideo ? '.mp4' : '.bin')

    const originalName = file instanceof File ? file.name || '' : ''
    const baseName = sanitizeBaseName(originalName)
    const shortId = randomUUID().slice(0, 8)
    const name = `${baseName}-${shortId}${ext}`
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
