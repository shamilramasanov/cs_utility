export const HOME_RETURN_PANEL_STORAGE_KEY = 'cs2-home-return-panel'
export const HOME_RETURN_FEED_ITEM_STORAGE_KEY = 'cs2-home-return-feed-item'
export const HOME_RETURN_PANEL_QUERY = 'panel'
export const HOME_RETURN_FEED_ITEM_QUERY = 'feed'

export const HOME_RETURN_PANEL_SEARCH = 'search'
export const HOME_RETURN_PANEL_NEWS = 'news'

export function homeUrlWithReturnPanel(panel: string, feedItemId?: string | null): string {
  const sp = new URLSearchParams()
  sp.set(HOME_RETURN_PANEL_QUERY, panel)
  if (feedItemId?.trim()) sp.set(HOME_RETURN_FEED_ITEM_QUERY, feedItemId.trim())
  return `/?${sp.toString()}`
}
