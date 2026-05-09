import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Доступ к UI админки с телефонов закрыт (удобнее модерировать с десктопа).
 *
 * Отключить проверку (экстренно / отладка): `ADMIN_ALLOW_MOBILE=1 npm run dev`
 *
 * Эвристика по User-Agent плюс Client Hint `Sec-CH-UA-Mobile`.
 * Планшеты без «mobile» в UA часто проходят (намеренно: запрет именно телефона).
 */
export function middleware(req: NextRequest) {
  if (process.env.ADMIN_ALLOW_MOBILE === '1' || process.env.ADMIN_ALLOW_MOBILE === 'true') {
    return NextResponse.next()
  }

  const ch = req.headers.get('sec-ch-ua-mobile')
  if (ch === '?0') {
    return NextResponse.next()
  }
  const ua = req.headers.get('user-agent')

  if (ch === '?1' || isPhoneLikeUserAgent(ua)) {
    return new NextResponse(forbiddenPage(), {
      status: 403,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }

  return NextResponse.next()
}

function isPhoneLikeUserAgent(ua: string | null): boolean {
  if (!ua) return false

  // Явная оговорка: крупный iPad без «mobile» в CH не режем здесь по UA.
  if (/ipad\b/i.test(ua)) return false

  return (
    /iphone\b|ipod\b/i.test(ua) ||
    /android\b.+mobile\b/i.test(ua) ||
    /blackberry|bb10|windows phone|iemobile|opera mini|opera mobi|webos/i.test(ua)
  )
}

function forbiddenPage(): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="robots" content="noindex,nofollow"/>
  <title>Админка недоступна</title>
  <style>
    body{font-family:system-ui,sans-serif;background:#0d0d0d;color:#fff;margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:1.25rem;text-align:center}
    div{max-width:22rem}
    h1{font-size:1.1rem;margin:0 0 .75rem}
    p{color:#888;font-size:.875rem;line-height:1.45;margin:0}
    code{color:#F0B429;font-size:.78rem;display:block;margin-top:1rem;word-break:break-all}
  </style>
</head>
<body><div><h1>Вход с телефона в админку отключён</h1><p>Открой эту страницу с компьютера или планшета в полноформатном браузере.</p>${
    process.env.NODE_ENV !== 'production'
      ? `<p style="margin-top:.75rem">Для локальной проверки: <code>ADMIN_ALLOW_MOBILE=1</code></p>`
      : ''
  }</div></body>
</html>`
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
