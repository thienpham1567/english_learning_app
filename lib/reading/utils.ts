/**
 * Shared utilities for the Reading Practice module.
 */

/** Strip HTML tags and decode common entities */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Estimate CEFR difficulty level from average word length */
export function estimateDifficulty(text: string): "B1" | "B2" | "C1" {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "B1";
  const avgLen = words.reduce((s, w) => s + w.length, 0) / words.length;
  if (avgLen < 4.8) return "B1";
  if (avgLen < 5.5) return "B2";
  return "C1";
}

/** Bounded in-memory cache with max size eviction (FIFO) */
export class BoundedCache<T> {
  private map = new Map<string, { data: T; ts: number }>();

  constructor(
    private maxSize: number,
    private ttlMs: number,
  ) {}

  get(key: string): T | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.ttlMs) {
      this.map.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T) {
    this.map.set(key, { data, ts: Date.now() });
    // Evict oldest entries when over max size
    if (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest) this.map.delete(oldest);
    }
  }
}
