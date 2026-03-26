type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export function createDictionaryCache(now = Date.now) {
  const store = new Map<string, CacheEntry<unknown>>();

  return {
    get<T>(key: string): T | null {
      const hit = store.get(key);
      if (!hit) return null;
      if (hit.expiresAt <= now()) {
        store.delete(key);
        return null;
      }
      return hit.value as T;
    },
    set<T>(key: string, value: T, ttlMs = 14 * 24 * 60 * 60 * 1000) {
      store.set(key, {
        value,
        expiresAt: now() + ttlMs,
      });
    },
  };
}

export const dictionaryCache = createDictionaryCache();
