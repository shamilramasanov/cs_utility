# Скриншоты позиций для visual picker

> Сюда складываем raw-скриншоты POV-ракурсов из CS2. Финал уезжает в `public/positions/<map>/<side>/<position_id>.webp`.

---

## Pipeline

```bash
# 1. В CS2 встать на точку, нажать F12 (Steam) или PrtSc.
# 2. Положить raw .png/.jpg в content/assets/position-shots/<map>/<side>/<id>.png
# 3. Прогнать через ffmpeg (640×360 WebP, ~80 KB):

ffmpeg -i content/assets/position-shots/de_mirage/t/t_spawn_apps.png \
  -vf "scale=640:360:flags=lanczos" \
  -compression_level 6 -q:v 75 \
  public/positions/de_mirage/t/t_spawn_apps.webp
```

## Параметры скриншота

- **Resolution**: 1920×1080 (исходник), 640×360 WebP (финал).
- **Aspect**: ровно 16:9 — кропать перед экспортом.
- **HUD**: выключен (`cl_drawhud 0; sv_cheats 1` в console).
- **FOV**: дефолтный.
- **Crosshair**: оставить по центру (это якорь для глаза).
- **Освещение**: дневное / стандартное на карте (без custom-настроек).

## Минимум для MVP (3 карты × 2 стороны × 4 точки = 24 скриншота)

См. чек-лист в `content/INVENTORY.md` §3.5.
