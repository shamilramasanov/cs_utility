# `content/lineups/` — нарезка видео раскидок

> Сюда складываем сырые захваты из CS2 (OBS / NVIDIA Shadow Play). Здесь же конвертируем их в финальные MP4-«гифки» (autoplay, loop, muted) и постеры. Финал уезжает в R2.

---

## 1. Запись в игре

### 1.1. Подготовка карты

```cfg
// в консоли CS2:
sv_cheats 1
mp_warmup_end
mp_freezetime 0
mp_roundtime 60
mp_buy_anywhere 1
sv_infinite_ammo 1
mp_restartgame 1

// для чистого видео без HUD:
cl_drawhud 0
cl_drawviewmodel_arms 0
hud_showtargetid 0
```

> Запись лучше с **Workshop-карты**, где есть стандартные позиции — это удобнее, чем приватная игра. Альтернатива: `Aim Botz` или `Yprac` версии.

### 1.2. Параметры захвата (OBS)

- Разрешение: 1920×1080
- FPS: 60
- Кодек: NVENC H.264 / AV1 — что есть
- Битрейт: 25–40 Мбит/с (исходник, потом сжимаем)
- Расширение: `.mkv` (надёжно к падениям)

---

## 2. Конвертация в финальный MP4

### 2.1. Базовая команда `ffmpeg`

```bash
ffmpeg -i input.mkv \
  -ss 00:00:01.5 -t 12 \
  -vf "scale=1280:720:flags=lanczos,fps=30" \
  -c:v libx264 -preset slow -crf 22 -profile:v high -movflags +faststart \
  -an \
  out.mp4
```

Параметры:

- `-ss 1.5` — отрезать первые 1.5 секунды (старт OBS).
- `-t 12` — обрезать до 12 секунд.
- `scale=1280:720` — даунсайз до 720p.
- `fps=30` — даунсэмпл до 30fps (60 не нужен для loop).
- `crf 22` — качество (меньше = лучше, 18–23 — рабочий диапазон).
- `-an` — выкинуть аудио.
- `-movflags +faststart` — кладёт moov-атом в начало → играет до полной загрузки.

### 2.2. Постер (первый кадр)

```bash
ffmpeg -i out.mp4 -ss 0.1 -vframes 1 -q:v 3 out.poster.jpg
```

### 2.3. Опционально — `.webm` (VP9, ~30% меньше)

```bash
ffmpeg -i input.mkv \
  -ss 00:00:01.5 -t 12 \
  -vf "scale=1280:720:flags=lanczos,fps=30" \
  -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 \
  -an \
  out.webm
```

> iOS Safari WebM играет с iOS 16+, но не везде. Если хочется идеально — отдаём оба источника `<source>` в `<video>`.

### 2.4. Скрипт для пакетной обработки

Положить в `scripts/process-lineup.sh`:

```bash
#!/usr/bin/env bash
# Использование: ./process-lineup.sh input.mkv output_dir slug
set -e
INPUT=$1
OUT_DIR=$2
SLUG=$3
mkdir -p "$OUT_DIR"

ffmpeg -i "$INPUT" -ss 1.5 -t 12 \
  -vf "scale=1280:720:flags=lanczos,fps=30" \
  -c:v libx264 -preset slow -crf 22 -profile:v high -movflags +faststart \
  -an "$OUT_DIR/$SLUG.mp4"

ffmpeg -i "$OUT_DIR/$SLUG.mp4" -ss 0.1 -vframes 1 -q:v 3 \
  "$OUT_DIR/$SLUG.poster.jpg"

echo "Готово: $OUT_DIR/$SLUG.mp4"
```

---

## 3. Скриншоты прицеливания (`*.aim.jpg`)

### 3.1. Что должно быть на скрине

- Внутри-игровой view от первого лица.
- Прицел чётко наведён на ориентир.
- Стрелка/обводка нарисована поверх (жёлтая `#F0B429` 4px, тонкая обводка чёрная).
- Подпись «Целиться сюда» — опционально, в углу.

### 3.2. Pipeline

1. В CS2: занять стартовую позицию, навестись на ориентир, нажать `F12` (Steam screenshot) или `PrtSc`.
2. В Photopea / Figma / GIMP: добавить стрелку.
3. Экспорт: JPG, 1280×720, качество 85, ~150–250 КБ.
4. Имя: `<slug>.aim.jpg` рядом с `<slug>.mp4`.

---

## 4. План раскидок по карте

В `content/lineups/_raw/<map>/_plan.md` ведём список того, что **надо снять**, в порядке приоритета.

Шаблон:

```markdown
# Mirage — план раскидок

## T-side (цель: 18 раскидок)

| # | Тип | Название | Старт | Приём (position) | Источник | Готово |
|--:|---|---|---|---|---|:--:|
| 1 | smoke | Window | T spawn | window | Nart 04:12 | [ ] |
| 2 | smoke | Stairs | T mid | stairs | Nart 05:30 | [ ] |
| 3 | smoke | CT | T mid | ct_spawn | Nart 06:50 | [ ] |
| 4 | flash | Pop-flash через top mid | top_mid | window | Grape 03:10 | [ ] |
| ... |

## CT-side (цель: 8 раскидок)
...
```

Источник = «канал + минута:секунда» где видна эта раскидка. Так легко вернуться к референсу.

---

## 5. Где хранится финал

После прохождения pipeline:

1. **dev-режим**: можно загружать через админку → файл лежит в `public/uploads/grenades/<uuid>.mp4`. Работает локально.
2. **прод**: заливается в R2 через CLI / dashboard. URL вида `https://media.<домен>/<map>/<side>/<position>/<type>/<slug>.mp4` ставится в поле `video_url` админки.

---

## 6. Что не делать

- ❌ Не оставлять звук в финале (`-an` обязательно).
- ❌ Не качать чужие видео и не заливать на R2 (плагиат + копирайт).
- ❌ Не делать ролик длиннее 15 сек (ползёт удобство мгновенного просмотра).
- ❌ Не использовать GIF — только MP4 (см. `INVENTORY.md` §2.1).

