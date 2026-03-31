import type { FuelPriceResult } from "@/lib/fuel-prices/scraper";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_HISTORY = 5;

type CacheEntry = {
  data: FuelPriceResult;
  cachedAt: number;
};

type PriceSnapshot = {
  prices: Record<string, string>; // name → price
  timestamp: string;
};

/** In-memory cache + price history for comparison. */
class FuelPriceCache {
  private current: CacheEntry | null = null;
  private history: PriceSnapshot[] = [];

  /** Returns cached data if still valid, otherwise null. */
  get(): FuelPriceResult | null {
    if (!this.current) return null;
    const age = Date.now() - this.current.cachedAt;
    if (age > CACHE_TTL_MS) {
      this.current = null;
      return null;
    }
    return this.current.data;
  }

  /** Stores new data and pushes a snapshot into history. */
  set(data: FuelPriceResult) {
    // Only cache successful results
    if (!data.success || data.prices.length === 0) return;

    // Save snapshot before overwriting
    if (this.current?.data.success) {
      this.pushSnapshot(this.current.data);
    }

    this.current = { data, cachedAt: Date.now() };
  }

  /** Returns the previous price snapshot (if any) for comparison. */
  getPreviousSnapshot(): PriceSnapshot | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  /** Returns all stored snapshots. */
  getHistory(): PriceSnapshot[] {
    return [...this.history];
  }

  /** Returns remaining TTL in seconds or 0 if expired. */
  getRemainingTtl(): number {
    if (!this.current) return 0;
    const remaining = CACHE_TTL_MS - (Date.now() - this.current.cachedAt);
    return Math.max(0, Math.round(remaining / 1000));
  }

  private pushSnapshot(data: FuelPriceResult) {
    const snapshot: PriceSnapshot = {
      prices: Object.fromEntries(data.prices.map((p) => [p.name, p.price])),
      timestamp: data.updatedAt,
    };

    this.history.push(snapshot);
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
  }
}

/** Singleton cache instance (lives for the lifetime of the server process). */
export const fuelPriceCache = new FuelPriceCache();
