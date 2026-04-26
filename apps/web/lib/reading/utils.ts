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

const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY ?? "test";
const GUARDIAN_BASE = "https://content.guardianapis.com";

const articleCache = new BoundedCache<Record<string, unknown>>(200, 60 * 60 * 1000); // 200 entries, 1-hour TTL

export async function fetchGuardianArticle(articleId: string) {
  const cached = articleCache.get(articleId);
  if (cached) return cached;

  const apiUrl = `${GUARDIAN_BASE}/${articleId}?api-key=${GUARDIAN_API_KEY}&show-fields=headline,trailText,thumbnail,body,bodyText,byline,wordcount`;
  const res = await fetch(apiUrl, { next: { revalidate: 3600 } });

  if (!res.ok) {
    throw new Error(`Article not found: ${res.status}`);
  }

  const json = await res.json();
  const content = json.response?.content;
  if (!content) {
    throw new Error("Article not found: no content");
  }

  const fields = content.fields ?? {};
  const bodyText = fields.bodyText ?? "";
  const wordCount = Number(fields.wordcount) || bodyText.split(/\s+/).length;

  // Split body into paragraphs (from HTML)
  const bodyHtml = fields.body ?? "";
  const paragraphs = bodyHtml
    .split(/<\/?p[^>]*>/i)
    .map((p: string) => stripHtml(p))
    .filter((p: string) => p.length > 20);

  const data = {
    id: encodeURIComponent(content.id),
    rawId: content.id,
    title: fields.headline ?? content.webTitle ?? "",
    trailText: stripHtml(fields.trailText ?? ""),
    author: fields.byline ?? "",
    date: content.webPublicationDate,
    thumbnail: fields.thumbnail ?? null,
    section: content.sectionName ?? "",
    sectionId: content.sectionId ?? "",
    wordCount,
    readTime: Math.max(1, Math.round(wordCount / 200)),
    difficulty: estimateDifficulty(bodyText),
    paragraphs,
    bodyText,
  };

  articleCache.set(articleId, data);
  return data;
}
