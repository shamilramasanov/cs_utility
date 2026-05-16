import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
  /**
   * Dev-сервер Next блокирует загрузку dev-ресурсов (HMR и т.п.) с “чужих” origin’ов.
   * На iOS при открытии по IP это проявляется как “кнопки жмутся, но ничего не происходит”,
   * потому что клиентский JS/обновления могут не подгрузиться корректно.
   */
  // Разрешаем dev-доступ с телефона по IP (см. логи Next про allowedDevOrigins).
  // Держим оба адреса: старый (hotspot) и текущий (Wi‑Fi LAN).
  allowedDevOrigins: ['172.20.10.3', '192.168.3.23', '192.168.0.13', '192.168.3.28'],
  turbopack: {
    // Фиксируем корень проекта, чтобы Turbopack не брал /Users/apple и не держал «старые» артефакты.
    root: path.resolve(__dirname),
  },
}

export default nextConfig

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

initOpenNextCloudflareForDev()
