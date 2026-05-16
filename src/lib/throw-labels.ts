export const THROW_LABELS: Record<string, string> = {
  normal: 'Левая кнопка мышки',
  jump: 'Левая кнопка+пробел',
  jumprun: 'w+левая кнопка+пробел',
  run: 'Правая кнопка мышки',
  right: 'Правая кнопка мышки',
  rightclick: 'Правая кнопка мышки',
  mouse2: 'Правая кнопка мышки',
  left_right: 'Левая+правая кнопка',
  leftright: 'Левая+правая кнопка',
  lr: 'Левая+правая кнопка',
  d_jumprun: 'd+левая кнопка+пробел',
  djumprun: 'd+левая кнопка+пробел',
  d_jump: 'd+левая кнопка+пробел',
  d_jumpthrow: 'd+левая кнопка+пробел',
}

export function getThrowMethodLabel(throwType: string | undefined | null): string {
  const key = throwType?.trim() ?? ''
  if (!key) return '—'
  return THROW_LABELS[key] ?? key
}
