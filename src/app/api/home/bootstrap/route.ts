import { NextResponse } from 'next/server'
import { BOOTSTRAP_CACHE_CONTROL } from '@/lib/api-cache-headers'
import { buildHomeBootstrapPayload } from '@/lib/home-bootstrap'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await buildHomeBootstrapPayload()
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': BOOTSTRAP_CACHE_CONTROL },
    })
  } catch (e) {
    console.error('[api/home/bootstrap]', e)
    const msg = e instanceof Error ? e.message : ''
    const status = msg.includes('database') || msg.includes('connect') ? 503 : 500
    return NextResponse.json({ error: 'bootstrap failed' }, { status })
  }
}
