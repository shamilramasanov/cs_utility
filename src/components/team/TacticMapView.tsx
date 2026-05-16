'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import type { Tactic, ViewRole } from '@/types/tactics'
import { roleMeta } from '@/data/role-presets'
import { getMap } from '@/lib/grenades'
import { markersForRole, overviewTarget, pathsForRole } from '@/lib/tactic-map'
import RouteOverlay from './RouteOverlay'
import { radarImageObjectPosition, useRadarImageBox } from '@/hooks/useRadarImageBox'
import { useT, type TranslationKey } from '@/i18n'

interface Props {
  tactic: Tactic
  viewRole: ViewRole
}

export default function TacticMapView({ tactic, viewRole }: Props) {
  const t = useT()
  const mapData = getMap(tactic.map)
  const radarFile = mapData?.radar ?? mapData?.layers?.[0]?.file ?? ''
  const radarLayoutRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const box = useRadarImageBox(radarLayoutRef, imgRef, imgLoaded, 'center')

  useEffect(() => {
    const img = imgRef.current
    if (!img || !radarFile) return

    setImgLoaded(false)
    setImgFailed(false)

    const markLoaded = () => {
      if (img.naturalWidth > 0) {
        setImgLoaded(true)
        setImgFailed(false)
      }
    }
    const markFailed = () => {
      setImgLoaded(false)
      setImgFailed(true)
    }

    if (img.complete) {
      if (img.naturalWidth > 0) markLoaded()
      else markFailed()
      return
    }

    img.addEventListener('load', markLoaded)
    img.addEventListener('error', markFailed)
    return () => {
      img.removeEventListener('load', markLoaded)
      img.removeEventListener('error', markFailed)
    }
  }, [radarFile])

  const plansToShow = useMemo(() => {
    if (viewRole === 'all') return tactic.role_plans
    return tactic.role_plans.filter((p) => p.role === viewRole)
  }, [tactic.role_plans, viewRole])

  const paths = useMemo(() => {
    return plansToShow.flatMap((plan) => {
      const color = roleMeta(plan.role).color
      return pathsForRole(plan).map((points) => ({ points, color }))
    })
  }, [plansToShow])

  const markers = useMemo(() => {
    return plansToShow.flatMap((plan) => {
      const color = roleMeta(plan.role).color
      return markersForRole(plan, color)
    })
  }, [plansToShow])

  const target = overviewTarget(tactic)
  const roleLabel =
    viewRole === 'all'
      ? t('team.filterAll')
      : t(`team.role.${viewRole}` as TranslationKey)

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      ref={radarLayoutRef}
      role="region"
      aria-label={mapData?.display_name ?? tactic.map}
    >
      {radarFile ? (
        <>
          <img
            ref={imgRef}
            src={`/minimaps/${radarFile}`}
            alt=""
            className={`absolute inset-0 h-full w-full object-contain transition-opacity ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ objectPosition: radarImageObjectPosition('center') }}
            draggable={false}
          />
          {imgFailed && (
            <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-[#888]">
              Не удалось загрузить радар. Проверьте файл в public/minimaps/
            </p>
          )}
        </>
      ) : (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-[#666]">
          {t('common.nothingFound')}
        </p>
      )}
      {imgLoaded && box && box.width > 0 && (
        <div
          className="pointer-events-none absolute z-[5]"
          style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
        >
          <RouteOverlay
            paths={paths}
            markers={markers}
            target={target}
            width={Math.round(box.width)}
            height={Math.round(box.height)}
          />
        </div>
      )}
      <p className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] text-[#aaa]">
        {roleLabel}
      </p>
    </div>
  )
}
