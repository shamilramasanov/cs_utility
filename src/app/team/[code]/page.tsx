import { Suspense } from 'react'
import MeetRoomClient from '@/components/team/MeetRoomClient'

interface Props {
  params: Promise<{ code: string }>
}

export default async function MeetRoomPage({ params }: Props) {
  const { code } = await params
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center px-app-screen py-12 text-sm text-[#666]">
            …
          </div>
        }
      >
        <MeetRoomClient code={code} />
      </Suspense>
    </div>
  )
}
