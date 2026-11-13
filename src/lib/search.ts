export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[′’‘´`]/g, "'")
    .replace(/\s+/g, '')
}
