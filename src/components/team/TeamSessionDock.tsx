'use client'

import { usePathname, useSearchParams } from 'next/navigation'

/** Нижний dock отключён: переключатель тактика/раскидки только сверху. */
export default function TeamSessionDock() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const meetCode = searchParams.get('meet')
  const onMap = pathname.startsWith('/map/')
  const onTeam = pathname.startsWith('/team/')
  const onTeamPlan = onTeam && searchParams.get('plan') === '1'

  if (meetCode && (onMap || onTeamPlan)) return null
  if (!onMap && !onTeam) return null

  return null
}
