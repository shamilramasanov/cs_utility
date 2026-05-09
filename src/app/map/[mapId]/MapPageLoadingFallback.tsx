/** Скеллон для Suspense: те же отступы шапки, что у `MapPageClient`, чтобы не было скачка верстки. */
export default function MapPageLoadingFallback() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-x-hidden overscroll-none bg-[#0d0d0d]">
      <div className="relative z-20 flex shrink-0 items-center gap-2 px-app-screen pb-3 pt-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-[#1a1a1a]" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-5 max-w-[10rem] rounded bg-[#222]" />
          <div className="h-3 max-w-[6rem] rounded bg-[#1a1a1a]" />
        </div>
      </div>
      <div className="min-h-0 flex-1 bg-[#121212]" />
    </div>
  )
}
