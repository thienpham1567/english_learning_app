export function normalizeDictionaryQuery(input: string) {
  const normalized = input.trim().replace(/\s+/g, " ");

  return {
    normalized,
    cacheKey: normalized.toLowerCase(),
  };
}
