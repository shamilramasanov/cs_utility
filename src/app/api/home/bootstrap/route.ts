import { NextResponse } from 'next/server'
import { buildHomeBootstrapPayload } from '@/lib/home-bootstrap'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await buildHomeBootstrapPayload()
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (e) {
    console.error('[api/home/bootstrap]', e)
    return NextResponse.json({ error: 'bootstrap failed' }, { status: 500 })
  }
}
