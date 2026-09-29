export function avatarLabel(title: string): string {
  const letters = title.replace(/[^A-Za-zА-Яа-яЁё]/g, '')
  if (letters) return letters.slice(0, 1).toUpperCase()
  const digits = title.replace(/\D/g, '')
  return digits.slice(-2) || '?'
}
