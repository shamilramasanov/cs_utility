import fs from 'fs'
import path from 'path'
import type { PositionOverridesFile } from '@/types/positions'

const DATA_REL = 'src/data/position-overrides.json'

export function getPositionOverridesPath(): string {
  return path.join(process.cwd(), DATA_REL)
}

export function readPositionOverridesFile(): PositionOverridesFile {
  const p = getPositionOverridesPath()
  if (!fs.existsSync(p)) return { overrides: {} }
  try {
    const raw = fs.readFileSync(p, 'utf8')
    const d = JSON.parse(raw) as PositionOverridesFile
    return { overrides: d.overrides && typeof d.overrides === 'object' ? d.overrides : {} }
  } catch {
    return { overrides: {} }
  }
}

export function writePositionOverridesFile(data: PositionOverridesFile): void {
  const p = getPositionOverridesPath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8')
}
