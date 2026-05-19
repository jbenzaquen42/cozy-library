export function normalizeIsbn(value: string) {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function isLikelyIsbn(value: string) {
  const normalized = normalizeIsbn(value);
  return normalized.length === 10 || normalized.length === 13;
}

export function isbnFromBarcode(value: string) {
  const normalized = normalizeIsbn(value);
  if (normalized.length === 13 && (normalized.startsWith("978") || normalized.startsWith("979"))) return normalized;
  if (normalized.length === 10) return normalized;
  return null;
}
