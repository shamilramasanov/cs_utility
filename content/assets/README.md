# `content/assets/` — иконки, превью, OG, лого

> Сюда складываем сырые ассеты (SVG, PSD, экспортированные PNG/WebP). Финал уезжает в `public/icons/`, `public/maps/thumbs/`, `public/og/`.
>
> ⚠ **Очень важно**: при использовании CC BY-материалов **обязательна атрибуция**. Файл `ATTRIBUTION.txt` должен попасть в `public/icons/grenades/` вместе с иконками — иначе нарушение лицензии.

---

## 1. Иконки гранат

### 1.1. Источник: game-icons.net (CC BY 3.0)

| Тип | Автор | URL источника | Файл у нас |
| --- | --- | --- | --- |
| smoke | sbed | http://game-icons.net/1x1/sbed/grenade.html | `icons/grenades/smoke.svg` |
| flash | Lorc | http://game-icons.net/1x1/lorc/flash-grenade.html | `icons/grenades/flash.svg` |
| molotov | Skoll | http://game-icons.net/1x1/skoll/bundle-grenade.html | `icons/grenades/molotov.svg` |
| he | sbed | http://game-icons.net/1x1/sbed/grenade.html (тот же — но с другим стилем) | `icons/grenades/he.svg` |

> Альтернативно — поискать на game-icons.net по тегу `weapon` иконку, более подходящую под HE (например с шипами). Но `grenade.html` тоже ок.

### 1.2. ATTRIBUTION.txt (обязательный файл)

Скопировать в `public/icons/grenades/ATTRIBUTION.txt`:

```
Grenade icons used in this project:

— smoke.svg by sbed (https://game-icons.net/1x1/sbed/grenade.html)
— flash.svg by Lorc (https://game-icons.net/1x1/lorc/flash-grenade.html)
— molotov.svg by Skoll (https://game-icons.net/1x1/skoll/bundle-grenade.html)
— he.svg by sbed (https://game-icons.net/1x1/sbed/grenade.html)

Source: https://game-icons.net/
License: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)
```

### 1.3. Цвета

В CSS / Tailwind:

| Граната | Hex | Использование |
| --- | --- | --- |
| smoke | `#9CA3AF` | заливка SVG, бейджи |
| flash | `#FACC15` | заливка SVG, бейджи |
| molotov | `#F97316` | заливка SVG, бейджи |
| he | `#EF4444` | заливка SVG, бейджи |

SVG должны быть `currentColor`-ready: уберите `fill="…"` и поставьте `fill="currentColor"` — тогда цвет задаётся через CSS.

---

## 2. Иконки сторон (T / CT)

### 2.1. Можно нарисовать самим

Простой круг с буквой, цвета:

- T: `#F0B429` (золотой)
- CT: `#3B82F6` (синий)

```svg
<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="14" fill="#F0B429"/>
  <text x="16" y="22" text-anchor="middle"
        font-family="system-ui, sans-serif" font-weight="800" font-size="16" fill="#000">T</text>
</svg>
```

### 2.2. Можно взять из MurkyYT/cs2-map-icons

`https://github.com/MurkyYT/cs2-map-icons/tree/main/images/icons/` — там есть оригинальные T/CT иконки CS2 (но они под лицензией Valve — для коммерческого использования рискованно).

> **Безопасный путь — рисуем сами**, как в варианте 2.1. Они простые, 30 секунд работы.

---

## 3. Иконки категорий callouts (6 шт.)

Под обучающую страницу `/callouts`. Простые геометрические фигуры:

| Категория | Идея | Цвет |
| --- | --- | --- |
| `a_site` | пилюля «A» | `#FACC15` (жёлтый) |
| `b_site` | пилюля «B» | `#10B981` (зелёный) |
| `mid` | ромб | `#3B82F6` (синий) |
| `spawn` | домик | `#9CA3AF` (серый) |
| `rotation` | стрелка-петля | `#A855F7` (фиолетовый) |
| `utility` | гайка | `#F97316` (оранжевый) |

Куда: `icons/categories/<slug>.svg` → `public/icons/categories/<slug>.svg`.

CC0 (рисуем сами) → атрибуция не нужна.

---

## 4. Thumbnails карт

### 4.1. Источник

**MurkyYT/cs2-map-icons** содержит превью карт в `images/thumbnails/`. Проверить URL: `https://github.com/MurkyYT/cs2-map-icons/tree/main/images/thumbnails`.

### 4.2. Свой вариант

Если не нравится — кропаем из радаров:

```bash
# 16:9 кроп радара (1024×1024 → 1024×576), потом ресайз до 640×360 WebP
ffmpeg -i public/minimaps/de_mirage_radar_psd.png \
  -vf "crop=in_w:in_w*9/16,scale=640:360" \
  content/assets/thumbnails/de_mirage.webp
```

### 4.3. Куда

- raw → `content/assets/thumbnails/de_<map>.webp`
- final → `public/maps/thumbs/de_<map>.webp`

---

## 5. OG-превью (Open Graph)

### 5.1. Вариант A — статика

Сделать 7 PNG 1200×630 в Figma, по одному на карту + 1 общий:

- `og/cover.png` — общий
- `og/map_de_mirage.png` … `og/map_de_ancient.png` — на карту

### 5.2. Вариант B — генерация (рекомендуется)

Next.js 16 умеет `next/og` нативно. Создаём `src/app/og/route.tsx`:

```tsx
import { ImageResponse } from 'next/og'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const map = url.searchParams.get('map') ?? 'mirage'
  return new ImageResponse(
    <div style={{
      display: 'flex', width: '100%', height: '100%',
      background: '#0d0d0d', color: 'white', alignItems: 'center', justifyContent: 'center',
      fontSize: 96, fontWeight: 800
    }}>
      CS2 Grenades · {map}
    </div>,
    { width: 1200, height: 630 }
  )
}
```

Тогда в `metadata` каждой страницы:

```ts
openGraph: { images: [`/og?map=${mapId}`] }
```

— PNG не надо хранить вообще.

---

## 6. Favicon и PWA

### 6.1. Что нужно

- `public/favicon.ico` — 32×32 (есть, заменить)
- `public/icons/app/apple-touch-icon.png` — 180×180
- `public/icons/app/icon-192.png` — 192×192
- `public/icons/app/icon-512.png` — 512×512
- `public/icons/app/icon-mask.png` — 512×512 (maskable, safe zone 80%)
- `public/manifest.webmanifest`

### 6.2. Шаблон manifest

```json
{
  "name": "CS2 Grenades",
  "short_name": "CS2 Grenades",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0d0d0d",
  "theme_color": "#F0B429",
  "icons": [
    { "src": "/icons/app/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/app/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/app/icon-mask.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 6.3. Генерация всего комплекта

Воспользоваться https://realfavicongenerator.net/ — кладёшь 1 SVG, получаешь весь набор PNG в нужных размерах + `manifest.webmanifest` + `<head>`-теги.

---

## 7. Pipeline экспорта SVG → public/

```bash
# Скопировать все SVG из content/assets/icons/ в public/icons/, сохраняя структуру
rsync -av --include='*/' --include='*.svg' --exclude='*' \
  content/assets/icons/ public/icons/

# Скопировать thumbnails:
rsync -av content/assets/thumbnails/ public/maps/thumbs/

# ATTRIBUTION.txt вручную:
cp content/assets/icons/grenades/ATTRIBUTION.txt public/icons/grenades/
```

---

## 8. Что не делать

- ❌ Не использовать иконки CC BY без `ATTRIBUTION.txt` — это нарушение.
- ❌ Не качать иконки CS2 из game-файлов / Steam Workshop — они под лицензией Valve.
- ❌ Не делать иконки в виде PNG-растра, если есть SVG-исходник — теряется чёткость на retina.
- ❌ Не складывать `.psd` файлы в git без LFS — они тяжёлые.

