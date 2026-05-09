# `content/` — папка с сырым контентом

> Здесь живёт **исходный материал** для наполнения проекта: черновики тактик, нарезки видео, скриншоты, заметки. **В продакшен (`public/`, `src/data/`) попадают только обработанные ассеты.**

---

## Структура

```
content/
├── INVENTORY.md              ← Сводный список «всё, что нужно собрать» (главный документ)
├── SOURCES.md                ← Реестр внешних источников со ссылками
├── README.md                 ← Этот файл
│
├── lineups/                  ← Видео раскидок (raw → processed → public/)
│   ├── _raw/                 ← Захваты OBS, MOV, MKV (не коммитим в git!)
│   │   ├── de_mirage/
│   │   ├── de_dust2/
│   │   └── ...
│   └── README.md             ← Pipeline: запись → ffmpeg → R2
│
├── tactics/                  ← Текстовые тактики (markdown с YAML-фронтматтером)
│   ├── _drafts/              ← Незаконченные / на ревью
│   ├── mirage/
│   │   ├── t_default_a.md
│   │   ├── t_b_apps_rush.md
│   │   ├── ct_default.md
│   │   └── ct_a_stack.md
│   ├── dust2/
│   ├── inferno/
│   ├── nuke/
│   ├── overpass/
│   ├── anubis/
│   ├── ancient/
│   └── README.md             ← Шаблон тактики + правила оформления
│
├── callouts/                 ← Заметки и сырые данные по позициям
│   ├── _research/            ← Скрины с OnlyCSGO, Liquipedia, ручные заметки
│   └── README.md             ← Как переносить в src/data/positions.ts
│
├── positions/                ← Промежуточные JSON-наброски позиций (по картам)
│   └── (пусто — сюда складываем кладёшь черновые JSON, потом мерджим)
│
├── assets/                   ← Иконки, лого, OG, превью карт (raw)
│   ├── icons/
│   │   ├── grenades/
│   │   ├── sides/
│   │   └── categories/
│   ├── og/                   ← Шаблоны OG-превью .psd / .figma / .png
│   ├── thumbnails/           ← Превью карт для главной (640×360)
│   └── README.md             ← Атрибуции CC BY и pipeline
│
└── translations/             ← Черновики переводов UI-словарей и контента
    ├── ru.md
    ├── en.md
    └── uk.md
```

---

## Правила

### 1. Сырое vs обработанное

| Где живёт raw | Куда едет processed |
| --- | --- |
| `content/lineups/_raw/<map>/<name>.mov` | `R2://media/<map>/<side>/<position>/<type>/<name>.mp4` (через `ffmpeg`) |
| `content/tactics/<map>/<id>.md` | `src/data/tactics.json` (через `scripts/tactics-md-to-json.ts` — V2) |
| `content/positions/<map>.json` | `src/data/positions.ts` (вручную merge) |
| `content/assets/icons/grenades/*.svg` | `public/icons/grenades/*.svg` |
| `content/assets/thumbnails/<map>.webp` | `public/maps/thumbs/<map>.webp` |

### 2. Что коммитим в git, что нет

- **Коммитим:** все `.md`, `.json`, `.svg`, `.webp` — текстовый и финальный контент.
- **НЕ коммитим:** сырые `.mov`/`.mkv` — добавлены в `.gitignore` (см. ниже). Это десятки гигабайт.

Текущий `.gitignore` лежит в корне репо. Дописать (если ещё не):

```gitignore
# Сырые видеокаптуры
content/lineups/_raw/**/*.mov
content/lineups/_raw/**/*.mkv
content/lineups/_raw/**/*.mp4
content/lineups/_raw/**/*.webm

# Но `_plan.md` и `README.md` — оставляем
!content/lineups/_raw/**/*.md
```

### 3. Именование файлов

```
<map_id>__<side>__<position_id>__<grenade_type>__<short_label>__v<N>.<ext>

Примеры:
de_mirage__t__apartments__smoke__window__v1.mp4
de_mirage__t__apartments__smoke__window__v1.poster.jpg
de_mirage__t__apartments__smoke__window__v1.aim.jpg
de_inferno__t__banana__molotov__coffins__v1.mp4
```

Двойное подчёркивание `__` как разделитель между логическими полями, одиночное `_` внутри поля. Это даёт чистую парсинг-схему: `split('__')` → 6 полей.

### 4. Workflow тактики

1. Открыл нужный YouTube-гайд / Steam Guide.
2. Создал `content/tactics/_drafts/<id>.md` (либо сразу в финальной папке).
3. Скопировал шаблон из `content/tactics/README.md`.
4. Заполнил YAML-фронтматтер.
5. Расписал планы по 5 ролям.
6. Каждый шаг типа `throw` — сослался на `grenade_id` из `src/data/custom-lineups.json` (если уже есть) или поставил `grenade_id: TODO`.
7. Сохранил, отправил на ревью (комментарий, PR — как удобнее).
8. После ревью — переместил в `content/tactics/<map>/<id>.md`.

### 5. Workflow раскидки

1. Прошёл по списку `_plan.md` для нужной карты.
2. Выбрал раскидку, сделал захват в OBS — сохранил в `content/lineups/_raw/<map>/<name>.mkv`.
3. Прогнал через `ffmpeg` (см. `content/lineups/README.md`).
4. Получил `<name>.mp4` + `<name>.poster.jpg`.
5. Сделал скриншот прицеливания → `<name>.aim.jpg`.
6. Загрузил в админку (или в R2-бакет) → получил публичный URL.
7. Заполнил поля в админке (`title`, `description`, `position_ids`, `side`, `type`, `difficulty`, `throw_type`, `source`).
8. Прогнал на телефоне — проверил, что играется без задержки.
9. Удалил `<name>.mkv` (опционально — оставь как backup).

---

## Где что искать

| Хочу… | Иду в |
| --- | --- |
| понять, **что в целом надо сделать** | `INVENTORY.md` |
| найти **внешний материал** (видео, тактика, callouts) | `SOURCES.md` |
| написать **новую тактику** | `tactics/README.md` (шаблон), `tactics/<map>/` |
| **нарезать видео** раскидки | `lineups/README.md` |
| **разметить позицию** на радаре | `callouts/README.md` |
| **закоммитить иконку** | `assets/README.md` (атрибуции!) |
| **перевести строки** UI | `translations/<lang>.md` |

---

## Что точно не делать

- ❌ Складывать сырые `.mkv`/`.mov` без compression в git.
- ❌ Качать чужие видео и заливать на свой R2.
- ❌ Использовать иконки без указания автора (это нарушение CC BY 3.0).
- ❌ Трогать `src/data/positions.ts` вручную — сначала черновик в `content/positions/<map>.json`.
- ❌ Пропускать этап `EN` перевода (UK — можно отложить, EN — нет).

