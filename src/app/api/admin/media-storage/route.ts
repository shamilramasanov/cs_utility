import { NextRequest, NextResponse } from 'next/server'
import { isAdminReadAuthorized } from '@/lib/admin-auth'

/** Клиент решает: FormData → `/api/admin/upload` или client upload → `/api/admin/blob-upload`. */
export async function GET(req: NextRequest) {
  if (!isAdminReadAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const storage = process.env.BLOB_READ_WRITE_TOKEN?.trim() ? 'blob' : 'local'
  return NextResponse.json({ storage })
}
