/**
 * Круглая маска: снаружи окружности — прозрачно (уголки кварата).
 * Радиус по жёлтому кольцу относительно центра кадра.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const SRC = path.join(__dirname, 'favicon-source.png')

async function applyCircularMask(inputPath, outPath, size) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const cx = w / 2
  const cy = h / 2

  let maxYellow = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      if (r > 200 && g > 160 && b < 120) {
        const d = Math.hypot(x - cx + 0.5, y - cy + 0.5)
        if (d > maxYellow) maxYellow = d
      }
    }
  }
  const R = maxYellow + 1.5

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const d = Math.hypot(x - cx + 0.5, y - cy + 0.5)
      if (d > R) data[i + 3] = 0
    }
  }

  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(outPath)
}

const src = process.argv[2] || SRC
if (!fs.existsSync(src)) {
  console.error('Source not found:', src)
  process.exit(1)
}

const appDir = path.join(root, 'src', 'app')
const tmp16 = path.join(__dirname, '.favicon-build-16.png')
const tmp32 = path.join(__dirname, '.favicon-build-32.png')

await applyCircularMask(src, path.join(appDir, 'icon.png'), 512)
await applyCircularMask(src, path.join(appDir, 'apple-icon.png'), 180)
await applyCircularMask(src, tmp32, 32)
await applyCircularMask(src, tmp16, 16)

const icoBuf = await pngToIco([tmp16, tmp32])
fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuf)
fs.unlinkSync(tmp16)
fs.unlinkSync(tmp32)

console.log('Wrote src/app/icon.png, apple-icon.png, favicon.ico')
