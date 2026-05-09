import type { Metadata, Viewport } from 'next'
import './globals.css'
import LineupsDataRefresh from '@/components/LineupsDataRefresh'
import SiteHeaderGate from '@/components/SiteHeaderGate'
import { BRAND_NAME, BRAND_TAGLINE_RU } from '@/lib/brand'
import { I18nProvider } from '@/i18n'
import { getServerLocale } from '@/i18n/server'

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: `${BRAND_TAGLINE_RU} · карты, точки, видео`,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d0d0d',
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale()

  return (
    <html lang={locale}>
      <body className="flex min-h-dvh w-full max-w-full flex-col overflow-x-clip bg-[#0d0d0d] text-white overscroll-none">
        <I18nProvider initialLocale={locale}>
          <LineupsDataRefresh />
          <SiteHeaderGate />
          <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
        </I18nProvider>
      </body>
    </html>
  )
}
