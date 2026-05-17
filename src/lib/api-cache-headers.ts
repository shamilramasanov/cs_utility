/** CDN/браузер: повторные заходы не бьют в origin на каждый клик. */
export const BOOTSTRAP_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600'

export const POSITION_ZONES_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
