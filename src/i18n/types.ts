export type Locale = 'ru' | 'en' | 'uk'

export const LOCALES: Locale[] = ['ru', 'en', 'uk']
export const DEFAULT_LOCALE: Locale = 'ru'

/**
 * Структура UI-словаря. Все языки должны её соблюдать — TypeScript проверяет
 * по одинаковости ключей.
 */
export interface Dictionary {
  language: {
    label: string
    ru: string
    en: string
    uk: string
  }
  common: {
    back: string
    close: string
    next: string
    save: string
    cancel: string
    loading: string
    soon: string
    nothingFound: string
  }
  home: {
    pickMap: string
    /** Подпись у логотипа / ссылки на главную в шапке. */
    logoLink: string
    lineupsCount: string
    grenadesEmpty: string
    twoLayers: string
    footerHint: string
    /** Четыре вкладки карусели главной. */
    nav: {
      /** Доступность: весь блок нижней навигации. */
      ariaLabel: string
      search: string
      maps: string
      tactics: string
      news: string
    }
    /** Глобальный поиск точек (вкладка «Поиск»). */
    globalSearch: {
      hint: string
      /** Описание выдачи (пояснение бейджа T/CT). */
      resultsHint: string
    }
    tacticsTab: {
      title: string
      hint: string
    }
    newsTab: {
      title: string
      hint: string
    }
    teamCta: {
      title: string
      description: string
      create: string
      soonBadge: string
    }
  }
  side: {
    title: string
    subtitle: string
    t: { short: string; full: string; hint: string }
    ct: { short: string; full: string; hint: string }
    pill: { reset: string }
  }
  position: {
    title: string
    subtitle: string
    tab: { list: string; map: string; photos: string }
    photosSoon: string
    /** Заглушка вкладки «Список», пока старый список отключён. */
    listSoon: string
    noPhoto: string
    mapSoon: string
    search: string
    empty: string
    grenadesCount: string
    /** Фильтр зон на экране выбора позиции: «все зоны». */
    zoneAll: string
    filter: {
      nadesTitle: string
      teamsTitle: string
      anyTeam: string
      allNades: string
      smoke: string
      flash: string
      molotov: string
      he: string
    }
    pill: { reset: string }
    /** Нижняя навигация выбора режима (карта / фото / список). */
    pickerNav: {
      ariaLabel: string
    }
    category: {
      spawn: string
      a_site: string
      b_site: string
      mid: string
      rotation: string
      utility: string
    }
  }
  subspot: {
    pickerTitle: string
    pickerHint: string
    pillReset: string
    countLabel: string
    emptyHint: string
  }
  lineupGallery: {
    title: string
    hint: string
    empty: string
  }
  throwOrigin: {
    title: string
    hint: string
    mapHint: string
    empty: string
    listMode: string
    mapMode: string
    /** Подсказка, когда радар показан во внешнем MapView (центральная карта страницы). */
    externalMapHint: string
    /** aria для нижнего дока «карта / список». */
    modeDockAria: string
    /** Доступность: нижний док переключения точек броска в ту же цель. */
    variantDockAria: string
    /** Подпись кнопки точки: «{n} из {total}». */
    variantPointAria: string
  }
  map: {
    backToMaps: string
    grenadesCount: string
    layerToggle: string
  }
  admin: {
    pickSide: string
    pickSideHint: string
    pickPosition: string
    pickPositionHint: string
    anyPosition: string
    anyPositionHint: string
    noPositions: string
    showAll: string
    allLabel: string
    toApp: string
    contextHint: string
    contextHintAny: string
    autoTagged: string
    positionsField: string
    positionsHint: string
    sideField: string
    sideAuto: string
    pickSubspot: string
    pickSubspotHint: string
    anySubspot: string
    anySubspotHint: string
    uploadPhoto: string
    replacePhoto: string
    removePhoto: string
    removePhotoConfirm: string
    subspotField: string
    subspotAuto: string
    changelogNav: string
    changelogBack: string
    changelogTitle: string
    changelogLead: string
  }
}

/**
 * Любой путь до строкового листа в Dictionary, через точку.
 * `home.pickMap`, `side.t.full`, и т.д.
 */
export type TranslationKey = NestedKeyOf<Dictionary>

type NestedKeyOf<T> = {
  [K in keyof T & (string | number)]: T[K] extends string
    ? `${K}`
    : T[K] extends object
      ? `${K}.${NestedKeyOf<T[K]>}`
      : never
}[keyof T & (string | number)]
