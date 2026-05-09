# Мастер-список контента

> Один документ, в котором перечислено **всё**, что нужно собрать для наполнения проекта. Источники со ссылками — в `SOURCES.md`. Папочная структура — в `README.md`.
>
> Этот файл — основной чек-лист. По мере наполнения отмечай галочки `[x]`.

---

## 0. Стратегия наполнения

1. **Первая полностью покрытая карта — Mirage.** Самая популярная, по ней больше всего материалов в открытом доступе. Когда Mirage даст нам полный «вертикальный срез» (раскидки + позиции + тактики + переводы), масштабируем на остальные карты.
2. **Сначала собираем сырьё** (видео, тексты, скриншоты) в `content/` — отдельно от продакшна.
3. **Потом нарезаем и переводим в `public/` и `src/data/`** — туда уезжают только финальные ассеты.
4. Папка `content/` *в продакшен не уходит* (`.gitignore` оставляем на твоё усмотрение — но в `public/` копируется только обработанное).

---

## 1. Карты в проекте

С января 2026 (CS2 Premier Season 4) в **Active Duty**: Ancient, Anubis, Dust 2, Inferno, Mirage, Nuke, Overpass. Vertigo и Train в резерве. **29 апреля 2026** Valve выпустила переработанную **Cache** на Source 2 — она доступна в Competitive / Casual / Deathmatch / Retakes (но **не в Premier / Active Duty**).

| Карта | ID | Радар | Слои | Pool |
| --- | --- | --- | --- | --- |
| Mirage | `de_mirage` | ✅ есть | 1 | Active Duty |
| Dust II | `de_dust2` | ✅ есть | 1 | Active Duty |
| Inferno | `de_inferno` | ✅ есть | 1 | Active Duty |
| Nuke | `de_nuke` | ✅ есть | 2 (upper + lower) | Active Duty |
| Overpass | `de_overpass` | ✅ есть | 1 | Active Duty |
| Anubis | `de_anubis` | ✅ есть | 1 | Active Duty |
| Ancient | `de_ancient` | ✅ есть | 1 | Active Duty |
| Cache | `de_cache` | ✅ есть (29.04.2026) | 1 | Reserve / Casual |

---

## 2. Видео раскидок

### 2.1. Формат — финальное решение

**MP4 + H.264, без звука, 720p, 5–15 секунд, 1–3 МБ.** Воспроизведение через `<video autoplay loop muted playsinline>` — это и есть «гифка», только в **27 раз меньше** размером (см. `SOURCES.md` → web.dev). Настоящий `.gif` НЕ используем.

Шаблон конвертации:

```bash
ffmpeg -i input.mkv \
  -vf "scale=1280:720:flags=lanczos" \
  -c:v libx264 -preset slow -crf 22 -profile:v high -movflags +faststart \
  -an -t 12 \
  out.mp4

# Постер для <video poster>:
ffmpeg -i out.mp4 -ss 0.1 -vframes 1 -q:v 3 out.poster.jpg
```

Опционально — дублирующая `.webm` (VP9) ~30% меньше для Chrome/Firefox; iOS всё равно требует MP4.

### 2.2. Минимальный объём по картам

| Карта | Smokes | Flashes | Molotovs | HE | Итого |
| --- | --: | --: | --: | --: | --: |
| Mirage | 16 | 10 | 6 | 4 | **36** |
| Dust2 | 14 | 8 | 6 | 3 | **31** |
| Inferno | 18 | 10 | 10 | 4 | **42** |
| Nuke | 14 | 6 | 6 | 3 | **29** |
| Overpass | 14 | 8 | 6 | 3 | **31** |
| Anubis | 12 | 6 | 4 | 2 | **24** |
| Ancient | 12 | 6 | 4 | 2 | **24** |
| Cache | 12 | 6 | 4 | 2 | **24** |
| **MVP** |  |  |  |  | **≈ 241** |

≈ 0.4–0.7 ГБ суммарно. Хостинг: **Cloudflare R2 + кастомный домен** (см. `CONTENT_AND_MEDIA_CHECKLIST.md` §3.3).

### 2.3. Откуда брать

**Способ А (рекомендуется — свои съёмки):** записываем сами в CS2 (Workshop-карта `Aim_Botz` или приватная игра с ботами), `cl_drawhud 0; sv_cheats 1`. Качество и стилистика однородные.

**Способ B (быстрый старт — публичные базы как референс):**

| Сайт | Кол-во раскидок | Можно ли скачать |
| --- | --- | --- |
| **lineups.gg** | 200+ по 8 картам | Только embed, прямого скачивания нет — **используем как референс**, повторяем у себя. |
| **csnades.app** | 696+ (Mirage 157, Inferno 123, Anubis 88, Overpass 84, Nuke 71, Ancient 52, Dust2 36) | Можем повторять у себя — стилистика похожая. |
| **cs2tricks.com** | Видео-туториалы по всем картам | Embed YouTube. |
| **tracker.gg/cs2/lineups** | Community-driven | Только embed. |

> ⚠ **Юридическая ремарка**: чужие видео качать и заливать к себе — **нельзя**. Только для образца «как сделать у себя». Все ролики снимаем сами или используем YouTube embed с разрешения автора.

**Способ C (YouTube источники, по которым повторяем):**

- **NartOutHere** — `youtube.com/watch?v=xPCYPKFG44E` (Mirage, 18:54, 59.3K views, «The ONLY CS2 MIRAGE NADES GUIDE»).
- **NartOutHere** — `youtube.com/watch?v=fWDE1KH9odg` (Inferno, 20:26, 90.1K views, «The ULTIMATE Inferno Nades Guide»).
- **GRAPE CS2** — `youtube.com/watch?v=tk-9WAcn0FA` (Mirage utility 52 nades, 11:57, 44.2K views).

### 2.4. Чек-лист на каждую раскидку

Один MP4 готов, если:

- [ ] видео `*.mp4` (≤ 3 МБ, 5–15 сек, без звука, 720p)
- [ ] постер `*.poster.jpg` (~150 КБ, первый «полезный» кадр)
- [ ] 1+ скриншот прицеливания `*.aim.jpg` (white/yellow стрелка где целиться)
- [ ] заполнены поля: `title`, `description`, `position_ids[]`, `side`, `type`, `difficulty`, `throw_type`, `source`
- [ ] перевод EN (UK — желательно)

---

## 3. Скриншоты прицеливания (aim screenshots)

Для каждой раскидки — минимум **1 скрин 1280×720 JPG** с указанной точкой прицеливания. Кладётся в `gallery_urls` рядом с видео.

**Имя:** `<slug>_v1.aim.jpg` рядом с `<slug>_v1.mp4`.

**Объём:** ≈ 217 файлов на MVP, ~50 МБ суммарно.

---

## 3.5. Скриншоты позиций для visual picker

> Под фичу «Visual Position Picker» (план UI §5.4) для каждой ключевой позиции нужен **in-game скриншот ракурса**, по которому игрок узнает «свою» точку, не зная callout.

- Размер: **640×360 WebP**, ~70–120 КБ
- Куда: `public/positions/<map>/<side>/<position_id>.webp`
- Pipeline: CS2 → встать на точку → `F12` или `PrtSc` → кроп до 16:9 → экспорт WebP

### Минимум для MVP (категория `spawn`)

| Карта | Спавн-позиции (T) | Спавн-позиции (CT) | Итого |
| --- | --: | --: | --: |
| Mirage | 4 | 4 | **8** |
| Dust2 | 4 | 4 | **8** |
| Inferno | 4 | 4 | **8** |
| **MVP-1** |  |  | **24 скриншота** |

> Полное покрытие (все позиции всех категорий) — это V2. Сейчас покрываем хотя бы spawn по 3 ключевым картам.

### Чек-лист скриншотов

- [ ] Один и тот же FOV / разрешение на всех скринах одной карты
- [ ] HUD выключен (`cl_drawhud 0`)
- [ ] Ракурс — естественный «как игрок только что заспавнился»
- [ ] WebP с прозрачным быстрым декодом (~80 КБ)
- [ ] Имя файла = `position_id` без префикса карты

---

## 4. Каталог позиций (callouts)

Файл `src/data/positions.ts` (по плану `PLAN_SIDE_SELECTION_UI.md` §4.1). На каждую запись:

- `id` (slug, латиницей: `apartments`, `top_mid`, `connector`)
- `label` (англ. callout: `Apartments`)
- `label_i18n.ru` / `label_i18n.uk` (`Апартаменты` / `Апартаменти`)
- `aliases[]` (`apps`, `апки`, `апартаменты`, …)
- `category` (`spawn` / `a_site` / `b_site` / `mid` / `rotation` / `utility`)
- `side` (`T` / `CT` / `both`)
- `hotspot.x` / `hotspot.y` / `hotspot.radius` (нормализованные 0..1 на радаре)
- `hotspot.layer_id` (только Nuke: `upper` / `lower`)

### 4.1. Объём по картам

| Карта | Кол-во callouts (по OnlyCSGO/Liquipedia) | Источник |
| --- | --: | --- |
| Dust 2 | ~30 | `onlycsgo.com/callouts` + `totalcsgo.com/callouts` |
| Mirage | ~30 | OnlyCSGO + cs2.eu/guides/maps/mirage |
| Inferno | ~30 | OnlyCSGO + Liquipedia |
| Nuke | ~25 | OnlyCSGO (с разделением upper/lower) |
| Overpass | ~25 | OnlyCSGO |
| Ancient | ~19 | OnlyCSGO |
| Anubis | ~19 | OnlyCSGO |
| **Итого** | **≈ 178** |  |

> Для MVP-1 берём по 14–22 ключевых callouts на карту (~136 записей). Полный набор — это V2.

### 4.2. Где брать координаты hotspots

- В админке (когда сделаем — план UI §10) — кладём мышью на радаре.
- Временно — DevTools на странице карты + `useRadarImageBox` пишет нормализованные `x/y` в консоль на `mousemove`.

### 4.3. Чек-лист по карте (callouts)

- [ ] T spawn + CT spawn (`category: spawn`)
- [ ] A site main + A short + A heaven / pit (`category: a_site`)
- [ ] B site main + B связки (`category: b_site`)
- [ ] Mid + связки (Window, Connector, Top Mid…) (`category: mid`)
- [ ] Ротации (Banana, Apps, Coffins…) (`category: rotation`)
- [ ] Все имена на 3 языках или хотя бы RU + EN
- [ ] У каждой минимум 2 alias (`apps` / `апки` / `апартаменты`)

---

## 5. Тактики

Файлы черновиков лежат в `content/tactics/<map>/<id>.md` (markdown с YAML-frontmatter), потом конвертируются в `src/data/tactics.json`.

### 5.1. Стартовый набор (MVP)

| ID | Карта | Сторона | Сценарий | Источник |
| --- | --- | --- | --- | --- |
| `mirage_t_default_a` | Mirage | T | full-buy | Steam Guide 3134150813 + cs2.eu/guides/maps/mirage |
| `mirage_t_b_apps_rush` | Mirage | T | force | Liquipedia |
| `mirage_ct_default` | Mirage | CT | full-buy | cs2.eu + Metafy |
| `mirage_ct_a_stack` | Mirage | CT | full-buy | Steam Guide |
| `dust2_t_long_default` | Dust 2 | T | full-buy | Steam Guide |
| `dust2_t_b_split` | Dust 2 | T | full-buy | Liquipedia |
| `dust2_ct_pistol_default` | Dust 2 | CT | pistol | Dignitas blog |
| `inferno_t_b_default` | Inferno | T | full-buy | Steam Guide 3134169812 |
| `inferno_t_a_apps_arch` | Inferno | T | full-buy | NartOutHere |
| `inferno_ct_default` | Inferno | CT | full-buy | Steam Guide 3134169812 |

10 тактик × 5 ролей × 4–7 шагов ≈ 200 строк. Реально собрать за 2–3 дня (1 человек).

### 5.2. Структура одного файла тактики

```yaml
---
id: mirage_t_default_a
map: de_mirage
side: T
scenario: full
name:
  ru: T Default A
  en: T Default A
  uk: T Default A
description:
  ru: Стандартный заход на A через mid → window → stairs.
  en: Standard A execute via mid → window → stairs.
source:
  type: youtube
  url: https://www.youtube.com/watch?v=xPCYPKFG44E
  author: NartOutHere
---

## entry
brief:
  ru: Первым залетает на сайт через stairs после смока.
steps:
  - kind: spawn
    text: { ru: "Покупка: AK-47, kevlar+helmet, флешка, дым.", en: "Buy: AK-47, kevlar+helmet, flash, smoke." }
  - kind: move
    time: 5
    position_id: t_spawn
    text: { ru: "Бежим в Top Mid через спавн." }
  - kind: throw
    time: 25
    grenade_id: ABC123
    position_id: top_mid
    text: { ru: "Смок Window — закрыть AWP-холд." }
  - kind: exec
    time: 35
    position_id: stairs
    text: { ru: "По смоку залетаем через Stairs на Site." }

## awp
brief:
  ru: …
steps:
  - …

## lurker
…

## support
…

## igl
…
```

> Конвертер `scripts/tactics-md-to-json.ts` будет читать эти файлы и собирать `src/data/tactics.json`. Это V2.

### 5.3. Чек-лист тактики

- [ ] Заполнены `id`, `map`, `side`, `scenario`, `name`, `description`
- [ ] Указан `source` (YouTube URL / Liquipedia / Steam Guide)
- [ ] Описаны планы для всех 5 ролей (или хотя бы 4 из 5)
- [ ] Каждый шаг типа `throw` ссылается на существующий `grenade_id`
- [ ] Каждый шаг типа `move` / `hold` / `peek` ссылается на `position_id`
- [ ] Перевод RU + EN (UK — желательно)

---

## 6. Иконки и UI-ассеты

### 6.1. Иконки гранат (4 шт.)

| Граната | Источник | Лицензия | Куда |
| --- | --- | --- | --- |
| Smoke | game-icons.net (sbed/Lorc) | CC BY 3.0 | `public/icons/grenades/smoke.svg` |
| Flash | game-icons.net (lorc) | CC BY 3.0 | `public/icons/grenades/flash.svg` |
| Molotov | game-icons.net (Skoll/Lorc) | CC BY 3.0 | `public/icons/grenades/molotov.svg` |
| HE | game-icons.net (sbed) | CC BY 3.0 | `public/icons/grenades/he.svg` |

**Атрибуция обязательна.** Кладём в `public/icons/grenades/ATTRIBUTION.txt` (см. шаблон в `content/assets/README.md`).

### 6.2. Иконки сторон (T / CT)

Можно нарисовать самим — простой круг с буквой. Или взять из MurkyYT/cs2-map-icons (там есть оригинальные T/CT иконки CS2). Цвета:

- T-side: `#F0B429` (жёлтый)
- CT-side: `#3B82F6` (синий)

Куда: `public/icons/sides/{t,ct}.svg`.

### 6.3. Иконки категорий callouts (6 шт.)

Под обучающую страницу `/callouts`. Варианты:

- a_site: пилюля «A» — рисуем сами
- b_site: пилюля «B»
- mid: ромб
- spawn: домик
- rotation: стрелка-петля
- utility: гайка

Куда: `public/icons/categories/*.svg`. Все CC0 — рисуем простыми SVG.

### 6.4. Thumbnails карт для главной

`public/maps/thumbs/de_*.webp` (640×360, 16:9). Источник: **MurkyYT/cs2-map-icons** (репо имеет thumbnails в `images/thumbnails/`) — проверить, иначе делаем сами кропом из радаров.

### 6.5. PWA / Favicon

- `public/favicon.ico` — есть, заменить на брендовое
- `public/icons/app/apple-touch-icon.png` (180×180)
- `public/icons/app/icon-192.png`, `icon-512.png`, `icon-mask.png`
- `public/manifest.webmanifest`

### 6.6. OG-превью

- `public/og/cover.png` (1200×630, общий)
- `public/og/map_de_*.png` × 7 — или генерим через `next/og` (Next.js 16 умеет, см. `SOURCES.md`).

---

## 7. Локализация (RU / EN / UK)

Под план UI §16. Словари UI лежат в `src/i18n/dictionaries/{ru,en,uk}.ts`. Контент-поля локализуются inline через `*_i18n: { ru, en, uk }`.

### 7.1. Что перевести в UI (минимум)

| Раздел | Кол-во строк | Готов RU | Готов EN | Готов UK |
| --- | --: | --- | --- | --- |
| Главная (`home.*`) | ~10 | ⏳ | ⏳ | ⏳ |
| Выбор стороны (`side.*`) | ~6 | ⏳ | ⏳ | ⏳ |
| Выбор позиции (`position.*`) | ~12 | ⏳ | ⏳ | ⏳ |
| Раскидка (`grenade.*`, `bottomsheet.*`) | ~15 | ⏳ | ⏳ | ⏳ |
| Тактика / команда (`team.*`) | ~25 | ⏳ | ⏳ | ⏳ |
| Callouts-обучение (`callouts.*`) | ~10 | ⏳ | ⏳ | ⏳ |
| Админка (`admin.*`) | ~30 | ⏳ | — | — |
| **Итого UI** | **≈ 110** |  |  |  |

> Админку держим только на RU (внутренняя команда).

Промежуточные файлы черновиков переводов лежат в `content/translations/{ru,en,uk}.md`.

### 7.2. Что перевести в контенте

- Названия раскидок (`title`, `title_i18n`) — на каждой раскидке.
- Описания раскидок (`description`, `description_i18n`) — на каждой раскидке.
- Названия позиций (`Position.label`, `label_i18n`) — на каждой позиции.
- Названия тактик и описания ролей.

> Стратегия: пишем сразу на 2 языках (RU + EN), UK добавляем во вторую итерацию.

---

## 8. Сводный чек-лист «карта готова к продакшну»

Применяется по очереди для каждой из 7 карт. Использовать как DoD.

```
[ ] 0. Радар PNG в public/minimaps/                    (✅ для всех 7)
[ ] 1. Thumbnail 640×360 WebP в public/maps/thumbs/
[ ] 2. OG-превью 1200×630 PNG (или генератор)
[ ] 3. Позиции в src/data/positions.ts (≥ 14 шт.)
[ ] 4. Минимум раскидок:
       [ ] 12 smokes
       [ ] 6 flashes
       [ ] 4 molotovs
       [ ] 2 HE
[ ] 5. Каждая раскидка имеет:
       [ ] mp4 + poster.jpg + хотя бы 1 aim.jpg
       [ ] заполненные поля (включая position_ids[])
       [ ] перевод EN
[ ] 6. Минимум 2 тактики (1 T + 1 CT) в content/tactics/<map>/
[ ] 7. Smoke-test на iPhone SE / Android medium
[ ] 8. Поиск по callouts работает (RU + EN + aliases)
```

---

## 9. Что делать прямо сейчас

1. **Скачать иконки гранат** с game-icons.net (4 SVG) → `content/assets/icons/grenades/`. Записать атрибуции в `ATTRIBUTION.txt`.
2. **Открыть NartOutHere Mirage video** (`youtube.com/watch?v=xPCYPKFG44E`) и **выписать 36 раскидок** в `content/lineups/_raw/de_mirage/_plan.md` (название + время в видео + сторона + тип). Это позволит планомерно их повторить у себя в игре.
3. **Скопировать callouts Mirage** с `onlycsgo.com/callouts` → `content/callouts/_research/de_mirage.md`. С ним уже можно начать заполнять `src/data/positions.ts`.
4. **Написать первую тактику** `content/tactics/mirage/t_default_a.md` (шаблон в `content/tactics/README.md`). Источник — Steam Guide `3134150813` + видео NartOutHere.
5. После первого «полного среза» Mirage — повторить для Dust 2 и Inferno.

