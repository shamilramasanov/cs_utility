import { cache } from 'react'
import {
  EDITOR_KEYS,
  type EditorContentKey,
  editorDbGetManyJson,
  isEditorDatabaseEnabled,
} from '@/lib/editor-db'

/** Все ключи редактора одним SELECT (один round-trip к D1 на HTTP-запрос). */
export const EDITOR_BOOTSTRAP_KEYS = [
  EDITOR_KEYS.custom_lineups,
  EDITOR_KEYS.position_catalog_extensions,
  EDITOR_KEYS.position_zones,
] as const satisfies readonly EditorContentKey[]

export const getEditorContentBundle = cache(
  async (): Promise<Partial<Record<EditorContentKey, unknown>> | null> => {
    if (!isEditorDatabaseEnabled()) return null
    return editorDbGetManyJson([...EDITOR_BOOTSTRAP_KEYS])
  },
)
