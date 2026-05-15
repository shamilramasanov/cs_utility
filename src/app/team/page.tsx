import { Suspense } from 'react'
import TeamHome from '@/components/team/TeamHome'

export default function TeamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-app-screen py-12">
          <p className="text-sm text-[#666]">…</p>
        </div>
      }
    >
      <TeamHome />
    </Suspense>
  )
}
