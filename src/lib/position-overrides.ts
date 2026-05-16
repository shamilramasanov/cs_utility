import fs from 'fs'
import path from 'path'
import { cache } from 'react'
import type { PositionOverridesFile } from '@/types/positions'
import { EDITOR_KEYS, editorDbGetJson, editorDbSetJson, isEditorDatabaseEnabled } from '@/lib/editor-db'
import { readJsonFromRepo } from '@/lib/safe-fs-json'

const DATA_REL = 'src/data/position-overrides.json'

export function getPositionOverridesPath(): string {
  return path.join(process.cwd(), DATA_REL)
}

function readPositionOverridesFromDisk(): PositionOverridesFile {
  return readJsonFromRepo(DATA_REL, { overrides: {} }, normalizeOverrides)
}

function writePositionOverridesToDisk(data: PositionOverridesFile): void {
  const p = getPositionOverridesPath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8')
}

function normalizeOverrides(raw: unknown): PositionOverridesFile {
  if (!raw || typeof raw !== 'object') return { overrides: {} }
  const d = raw as PositionOverridesFile
  return { overrides: d.overrides && typeof d.overrides === 'object' ? d.overrides : {} }
}

export const readPositionOverridesFile = cache(async (): Promise<PositionOverridesFile> => {
  if (isEditorDatabaseEnabled()) {
    const row = await editorDbGetJson(EDITOR_KEYS.position_overrides)
    if (row != null) return normalizeOverrides(row)
  }
  return readPositionOverridesFromDisk()
})

export async function writePositionOverridesFile(data: PositionOverridesFile): Promise<void> {
  if (isEditorDatabaseEnabled()) {
    await editorDbSetJson(EDITOR_KEYS.position_overrides, data)
    return
  }
  writePositionOverridesToDisk(data)
}
