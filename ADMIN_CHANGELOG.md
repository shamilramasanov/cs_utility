# История изменений админки CS2 Grenades

Живой журнал: всё, что менялось в модераторском UI, связанных API и данных для админки.  
**Правило:** после каждой значимой правки в `/admin`, `AdminMapClient`, `AdminContextSelector`, загрузках, `position-overrides`, `custom-lineups` — добавь блок вверху секции «[Unreleased]» или создай новый релиз по дате.

Формат записи (копируй шаблон):

```text
### YYYY-MM-DD — краткий заголовок
- **Added** — что появилось
- **Changed** — что переименовали / переложили
- **Fixed** — какие баги закрыли ([симптом] → [что сделали])
- **Known issues** — что ещё сломано или неудобно (если есть)
- **Files** — ключевые пути `src/...` (по желанию)
```

Ссылки: гайд модератора [`ADMIN_GUIDE.md`](./ADMIN_GUIDE.md).

---

## [Unreleased]

### 2026-05-06 — Выбор позиции на телефоне (после выбора стороны)
- **Fixed** — те же причины что у стороны: вложенный `h-dvh` + скролл + `onClick`; плюс **`next/image` fill** перехватывал hit-test. Оболочка шага — **`fixed inset-0 overflow-hidden`**; шапка назад / **T×** — **`Link`** на «карту без query»; карточки во **«Фото»** и **«Список»** — **`Link`** на `?side=&pos=`; у **`Image`** **`pointer-events-none`**; у списка скролла **`[-webkit-overflow-scrolling:touch]`** и **`touch-action:pan-y`**.
- **Changed** — карточки с **«Скоро»** (0 раскидок) больше не `disabled`: по ссылке можно открыть позицию и увидеть пустой экран раскидок (как и задумано для контента «скоро»).
- **Files** — `MapPageClient.tsx`, `PositionSelector.tsx`, `PositionPhotoGrid.tsx`, `PositionList.tsx`

### 2026-05-06 — Выбор стороны: карточки по ширине экрана + работающие тапы
- **Fixed** — `MapPageClient` снова передавал только `onPick`/скролл-оболочку без **`pickHref`** → на телефоне работали «мёртвые» кнопки. Теперь переход T/CT через **`Link`** (`/map/…?side=t|ct`); убран внешний **`overflow-y-auto`** на шаге выбора стороны; язык — **после** контента, **`z-[80]`**, узкая область без full-screen overlay.
- **Changed** — мобильная сетка: **`border-x-0`** и **`rounded-none`** у карточек, боковые поля только **`safe-area`**, карточки делят **`flex-1`** высоту между заголовком и подписью.
- **Files** — `MapPageClient.tsx`, `SideSelector.tsx`

### 2026-05-06 — Выбор стороны на телефоне (карта и админка)
- **Fixed** — экран выбора T/CT: fullscreen scroll (`fixed inset-0`), карточки с **`onPointerUp`** для touch и анти-дребезгом; подложки с **`pointer-events-none`**.
- **Changed** — контейнер карточек без `flex-1 min-h-0` на мобильной колонке; `SideSelector` **`min-h-[100dvh]`**; см. блок выше — отказ от второго full-screen overlay для языка.
- **Files** — `SideSelector.tsx`, `MapPageClient.tsx`, `AdminContextSelector.tsx`

### 2026-05-06 — Запрет входа в админку с телефона
- **Added** — `src/middleware.ts`: для путей `/admin` и `/admin/*` ответ **403**, если запрос похож на мобильный (`Sec-CH-UA-Mobile: ?1` или эвристика по User-Agent: iPhone, Android+mobile и т.д.). Планшеты с «десктопным» UA обычно не режутся.
- **Changed** — экстренный обход: переменная окружения `ADMIN_ALLOW_MOBILE=1` или `true`.
- **Files** — `src/middleware.ts`

### 2026-05-06 — Журнал изменений + страница `/admin/changelog`
- **Added** — файл `ADMIN_CHANGELOG.md` (этот документ) и веб-страница с тем же содержимым; навигация из индекса админки, из шага выбора стороны/позиции и из шапки редактора карты (`AdminMapClient`).
- **Reason** — единая история для людей и для ассистента при отладке.
- **Files** — `ADMIN_CHANGELOG.md`, `src/app/admin/changelog/page.tsx`, `src/components/admin/ChangelogView.tsx`, `src/components/admin/AdminChangelogLink.tsx`; ссылки в `src/app/admin/page.tsx`, `AdminContextSelector.tsx`, `AdminMapClient.tsx`; ключи в `src/i18n/*`.

### 2026-05-06 — Вертикальный скролл в админке
- **Fixed** — интерфейс админки не скроллился из-за `overflow: hidden` на `body` и фиксированной вёрстки редактора.
- **Changed** — `src/app/admin/layout.tsx`: контейнер `max-h-[100dvh] overflow-y-auto`; `AdminMapClient`: зона «карта + сайдбар» с `overflow-y-auto` на mobile, у сайдбара убран безлимитный рост по высоте на desktop (`md:max-h-full`).

### 2026-05-06 — Полные callouts по всем картам
- **Added** — `src/data/positions-callouts.ts`: зоны Dust2, Inferno, Nuke (с `layer_id` upper/lower), Overpass, Anubis, Ancient, Cache (`POSITIONS_EXTENDED_CALLOUTS`).
- **Changed** — точки A/B сайтов для этих карт переехали из `siteEntry()` в callouts-модуль; удалён `siteEntry` из `positions.ts`.

### Ранее (накоплено по сессии разработки)

#### Поток модератора и контекст URL
- **Added** — `AdminContextSelector`: шаги карта → сторона → позиция → под-точка → `AdminMapClient`; параметры `side`, `pos`, `spot`, `all=1`.
- **Added** — автотеги новых раскидок: `side`, `position_ids` из контекста (`forcedSide`, `forcedPositionId`, `forcedSubspotId`).
- **Added** — скрытие лишних маркеров при добавлении / режиме клика по радару (`addMode`, `radarPick`), чтобы не промахнуться по чужой точке.

#### Позиции и медиа
- **Added** — `src/data/position-overrides.json`, API `GET/POST /api/admin/position-overrides`, хук `usePositionOverrides`.
- **Added** — `AdminSubspotPicker`: загрузка скриншота под-точки через `/api/admin/upload`, сброс фото (`patch: null`).
- **Added** — маркер выбранной под-точки на радаре (`MapView.subspotMarker`).

#### Прочее
- **Added** — спавн-пакеты `spawnGroup()` + 6 placeholder sub-spot'ов для каждой карты; Mirage CT sub-spots на `ct_spawn_*`.
- **Known issues** — фильтрация позиций Nuke по активному слою радара по `layer_id` в UI пока не реализована (поле в данных уже есть).

---

## Как использовать при багах

1. Воспроизведи баг, кратко опиши: страница URL, шаги, ожидание / факт.
2. Добавь под «[Unreleased]» пункт в **Fixed** или **Known issues**.
3. После фикса — тот же пункт перенеси в **Fixed** с датой или оформи отдельным подзаголовком.

Для ИИ-ассистента: при запросе «что недавно меняли в админке» сначала читай этот файл и последние записи в `[Unreleased]`.
