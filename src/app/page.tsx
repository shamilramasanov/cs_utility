import HomeContentClient from '@/components/HomeContentClient'
import { getMaps } from '@/lib/grenades'

/** Главная: shell на сервере, данные — GET /api/home/bootstrap (Workers не рендерят тяжёлый RSC с БД). */
export default function HomePage() {
  const maps = getMaps()
  return (
    <HomeContentClient
      mapsWithCounts={maps.map((map) => ({ map, grenadeCount: 0 }))}
      grenadesByMap={Object.fromEntries(maps.map((m) => [m.id, []]))}
      positionCatalog={[]}
      lineupFeedItems={[]}
      bootstrapOnClient
    />
  )
}
