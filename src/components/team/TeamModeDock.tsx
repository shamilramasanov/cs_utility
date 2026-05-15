'use client'

import { useCallback, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import AppModeDock from '@/components/AppModeDock'
import { useMeetSession } from '@/context/MeetSessionContext'
import { useT } from '@/i18n'

interface Props {
  active: 'tactics' | 'lineups'
  embedded?: boolean
  className?: string
  layout?: 'compact' | 'filterRow'
}

export default function TeamModeDock({
  active,
  embedded = false,
  className = '',
  layout = 'filterRow',
}: Props) {
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const session = useMeetSession()

  const tacticsUrl = session?.tacticsUrl ?? null
  const lineupsUrl = session?.lineupsUrl ?? null

  useEffect(() => {
    if (tacticsUrl) router.prefetch(tacticsUrl)
    if (lineupsUrl) router.prefetch(lineupsUrl)
  }, [lineupsUrl, router, tacticsUrl])

  const navigate = useCallback(
    (url: string | null) => {
      if (!url) return
      const target = url.startsWith('/') ? url : `/${url}`
      const current = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ''}`
      if (target === current) return
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }
      router.replace(target, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  if (!session?.meetCode || (!lineupsUrl && !tacticsUrl)) return null

  const items = [
    {
      label: t('team.dockTactics'),
      iconSrc: '/nav/home-tactics.png',
      iconFallback: '⚡',
      disabled: !tacticsUrl,
    },
    {
      label: t('team.dockLineups'),
      iconSrc: '/nav/home-maps.png',
      iconFallback: '🗺',
      disabled: !lineupsUrl,
    },
  ]

  return (
    <AppModeDock
      items={items}
      activeIndex={active === 'tactics' ? 0 : 1}
      onChange={(i) => navigate(i === 0 ? tacticsUrl : lineupsUrl)}
      ariaLabel={`${t('team.dockTactics')} / ${t('team.dockLineups')}`}
      embedded={embedded || layout === 'filterRow'}
      layout={layout}
      className={className}
      dataIgnoreSwipe="data-plan-swipe-ignore"
    />
  )
}
