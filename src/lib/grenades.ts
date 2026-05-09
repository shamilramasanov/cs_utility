import type { Grenade, MapData } from '@/types'
import grenadesData from '@/data/grenades.json'
import mapsData from '@/data/maps.json'

export function getMaps(): MapData[] {
  return mapsData.maps as MapData[]
}

export function getMap(id: string): MapData | undefined {
  return getMaps().find((m) => m.id === id)
}

export function getGrenades(mapId: string, type?: string): Grenade[] {
  const all = (grenadesData.grenades as Grenade[]).filter((g) => g.map === mapId)
  if (type && type !== 'all') return all.filter((g) => g.type === type)
  return all
}

export const GRENADE_COLORS: Record<string, string> = {
  smoke: '#4FC3F7',
  flash: '#FFD54F',
  molotov: '#FF7043',
  he: '#EF5350',
}

export const GRENADE_LABELS: Record<string, string> = {
  smoke: 'Smoke',
  flash: 'Flash',
  molotov: 'Molotov',
  he: 'HE',
}

export const GRENADE_EMOJIS: Record<string, string> = {
  smoke: '💨',
  flash: '⚡',
  molotov: '🔥',
  he: '💥',
}

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#4CAF50',
  medium: '#FF9800',
  hard: '#EF5350',
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Легко',
  medium: 'Средне',
  hard: 'Сложно',
}
