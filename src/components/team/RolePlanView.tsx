'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Meet } from '@/types/meet'
import type { Tactic, TacticStep, TeamRole, ViewRole } from '@/types/tactics'
import type { Grenade } from '@/types'
import { roleMeta } from '@/data/role-presets'
import StepCard from './StepCard'
import TacticMapView from './TacticMapView'
import AppModeDock from '@/components/AppModeDock'
import MeetSessionToolbar from './MeetSessionToolbar'
import { MEET_MAP_PANEL_CLASS } from './meet-session-layout'
import BottomSheet from '@/components/BottomSheet'
import { useMeetSession } from '@/context/MeetSessionContext'
import { useHorizontalPanelSwipe } from '@/hooks/useHorizontalPanelSwipe'
import { useT, type TranslationKey } from '@/i18n'

const BOTTOM_TAB_H = '4.5rem'

interface Props {
  meet: Meet
  tactic: Tactic
  myRole: TeamRole
  viewRole: ViewRole
  mapLabel: string
  onChangeRole: () => void
  onChangeTactic?: () => void
  onBackToLobby?: () => void
  isCaptain?: boolean
  previewRoles?: TeamRole[]
  onViewRoleChange?: (role: ViewRole) => void
}

export default function RolePlanView({
  meet,
  tactic,
  myRole,
  viewRole,
  mapLabel,
  onChangeRole,
  onChangeTactic,
  onBackToLobby,
  isCaptain,
  previewRoles,
  onViewRoleChange,
}: Props) {
  const t = useT()
  const session = useMeetSession()
  const meta = roleMeta(myRole)
  const viewMeta = viewRole === 'all' ? null : roleMeta(viewRole)
  const [tab, setTab] = useState<'text' | 'map'>('map')
  const panelIndex = tab === 'text' ? 0 : 1
  const swipeContainerRef = useRef<HTMLDivElement>(null)
  const planTrackRef = useRef<HTMLDivElement>(null)
  const { trackStyle, panelStyle, goToPanel } = useHorizontalPanelSwipe({
    panelCount: 2,
    activeIndex: panelIndex,
    onActiveIndexChange: (i) => setTab(i === 0 ? 'text' : 'map'),
    containerRef: swipeContainerRef,
    trackRef: planTrackRef,
    excludeSelector: '[data-plan-swipe-ignore]',
  })

  const plan =
    tactic.role_plans.find((p) => p.role === myRole) ??
    tactic.role_plans.find((p) => p.role === 'igl') ??
    null

  const steps = useMemo(() => {
    const list = plan?.steps ?? []
    return [...list].sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
  }, [plan])

  const orderedPreviewRoles = useMemo(() => {
    if (!previewRoles?.length) return []
    const rest = previewRoles.filter((r) => r !== myRole)
    return previewRoles.includes(myRole) ? [myRole, ...rest] : previewRoles
  }, [previewRoles, myRole])

  const [lineupGrenade, setLineupGrenade] = useState<Grenade | null>(null)
  const [stickyStep, setStickyStep] = useState<TacticStep | null>(null)

  const openLineup = useCallback(async (grenadeId: string, step: TacticStep) => {
    setStickyStep(step)
    try {
      const res = await fetch(`/api/grenade/${grenadeId}`)
      if (!res.ok) return
      setLineupGrenade((await res.json()) as Grenade)
    } catch {
      /* noop */
    }
  }, [])

  const sideLabel = meet.side === 'T' ? 'T-side' : 'CT-side'
  const viewBadgeLabel =
    viewRole === 'all' ? t('team.filterAll') : t(`team.role.${viewRole}` as TranslationKey)

  useEffect(() => {
    if (meet.map) session?.prefetchMap(meet.map)
  }, [meet.map, session])

  const bottomPad = `pb-[calc(${BOTTOM_TAB_H}+env(safe-area-inset-bottom,0px))]`

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0d0d0d]">
      <MeetSessionToolbar
        active="tactics"
        context={
          <>
            <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-bold leading-tight">{tactic.name}</p>
          <span className="shrink-0 text-[10px] text-[#777]">
            {mapLabel} · {sideLabel}
          </span>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={
              viewMeta
                ? { background: `${viewMeta.color}33`, color: viewMeta.color }
                : { background: '#F0B42933', color: '#F0B429' }
            }
          >
            {viewBadgeLabel}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]">
          {isCaptain && onChangeTactic && (
            <button type="button" onClick={onChangeTactic} className="font-semibold text-[#F0B429]">
              {t('team.changeTactic')}
            </button>
          )}
          <button type="button" onClick={onChangeRole} className="font-semibold text-[#888]">
            {t('team.changeRole')}
          </button>
          {onBackToLobby && (
            <button type="button" onClick={onBackToLobby} className="font-semibold text-[#888]">
              ← {t('team.lobbyTitle')}
            </button>
          )}
        </div>
        {orderedPreviewRoles.length > 0 && onViewRoleChange && (
          <div className="no-scrollbar mt-1.5 flex gap-1.5 overflow-x-auto">
            {orderedPreviewRoles.map((r) => (
              <RoleChip
                key={r}
                label={t(`team.role.${r}` as TranslationKey)}
                active={viewRole === r}
                onClick={() => onViewRoleChange(r)}
                activeColor={roleMeta(r).color}
              />
            ))}
            <RoleChip
              label={t('team.filterAll')}
              active={viewRole === 'all'}
              onClick={() => onViewRoleChange('all')}
              activeColor="#F0B429"
            />
          </div>
        )}
          </>
        }
      />

      <div
        ref={swipeContainerRef}
        className={`flex min-h-0 flex-1 flex-col overflow-hidden touch-pan-y ${bottomPad}`}
      >
        <div ref={planTrackRef} className="flex h-full min-h-0 shrink-0" style={trackStyle}>
          <section
            className="flex min-h-0 shrink-0 flex-col"
            style={panelStyle}
            aria-hidden={panelIndex !== 0}
          >
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-app-screen py-3">
              <div className="space-y-3">
                {steps.map((step) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    roleColor={meta.color}
                    onOpenLineup={
                      step.grenade_id
                        ? () => openLineup(step.grenade_id!, step)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          </section>

          <section
            className="flex min-h-0 shrink-0 flex-col"
            style={panelStyle}
            aria-hidden={panelIndex !== 1}
          >
            <div className={MEET_MAP_PANEL_CLASS}>
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#262626] bg-[#121212]">
                <TacticMapView tactic={tactic} viewRole={viewRole} />
              </div>
            </div>
          </section>
        </div>
      </div>

      {tab === 'text' && stickyStep?.grenade_id && !lineupGrenade && (
        <div
          className="pointer-events-none fixed inset-x-0 z-40 px-app-screen"
          style={{ bottom: `calc(${BOTTOM_TAB_H} + 0.5rem + env(safe-area-inset-bottom, 0px))` }}
        >
          <button
            type="button"
            onClick={() => openLineup(stickyStep.grenade_id!, stickyStep)}
            className="pointer-events-auto flex h-[3.25rem] w-full items-center justify-center rounded-xl bg-[#F0B429] text-sm font-bold text-black"
            data-plan-swipe-ignore
          >
            {t('team.openVideo')}: {stickyStep.text.slice(0, 40)}
          </button>
        </div>
      )}

      <PlanViewTabs tab={tab} onTab={(next) => goToPanel(next === 'text' ? 0 : 1)} />

      {lineupGrenade && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#0d0d0d]" data-plan-swipe-ignore>
          <BottomSheet
            grenade={lineupGrenade}
            onClose={() => {
              setLineupGrenade(null)
              setStickyStep(null)
            }}
            backToPlanLabel={t('team.backToPlan')}
            onBackToPlan={() => {
              setLineupGrenade(null)
              setStickyStep(null)
            }}
            panel
          />
        </div>
      )}
    </div>
  )
}

function PlanViewTabs({
  tab,
  onTab,
}: {
  tab: 'text' | 'map'
  onTab: (t: 'text' | 'map') => void
}) {
  const t = useT()
  return (
    <AppModeDock
      items={[
        {
          label: t('team.tabText'),
          iconSrc: '/nav/picker-list.png',
          iconFallback: '📋',
        },
        {
          label: t('team.tabMap'),
          iconSrc: '/nav/home-maps.png',
          iconFallback: '🗺',
        },
      ]}
      activeIndex={tab === 'text' ? 0 : 1}
      onChange={(i) => onTab(i === 0 ? 'text' : 'map')}
      ariaLabel={`${t('team.tabText')} / ${t('team.tabMap')}`}
      dataIgnoreSwipe="data-plan-swipe-ignore"
    />
  )
}

function RoleChip({
  label,
  active,
  onClick,
  activeColor,
}: {
  label: string
  active: boolean
  onClick: () => void
  activeColor: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        active ? 'text-black' : 'border border-[#333] text-[#aaa]'
      }`}
      style={active ? { background: activeColor } : undefined}
    >
      {label}
    </button>
  )
}
