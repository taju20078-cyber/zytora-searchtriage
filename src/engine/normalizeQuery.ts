/**
 * Normalizes search terms for deterministic matching, deduplication, and intent scoring.
 */

export function normalizeQuery(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/['"“”‘’]/g, '') // remove quote marks
    .replace(/[^\w\s-]/g, ' ') // replace symbols with spaces (keeps letters, numbers, hyphens)
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeQuery(normalized: string): string[] {
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

export function getExactGroupKey(query: string): string {
  return normalizeQuery(query);
}
