/**
 * Иконка поля поиска — та же картинка, что вкладка «Поиск» на главной (`public/nav/home-search.png`).
 */
export const APP_SEARCH_ICON_SRC = '/nav/home-search.png' as const

export function SearchInputLeadingIcon() {
  return (
    <span
      className="pointer-events-none absolute left-3 top-[calc(50%-3px)] -translate-y-1/2"
      aria-hidden
    >
      <img
        src={APP_SEARCH_ICON_SRC}
        alt=""
        width={22}
        height={22}
        loading="eager"
        decoding="async"
        draggable={false}
        className="block h-[22px] w-[22px] object-contain opacity-70"
      />
    </span>
  )
}
