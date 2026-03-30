export const ALLOWED_QUERY_PATTERN = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

export function normalizeDictionaryQuery(input: string) {
  const normalized = input.trim().replace(/\s+/g, " ");

  return {
    normalized,
    cacheKey: normalized.toLowerCase(),
  };
}
