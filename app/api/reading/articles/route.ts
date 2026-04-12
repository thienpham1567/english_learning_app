import { NextRequest } from "next/server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY ?? "test";
const GUARDIAN_BASE = "https://content.guardianapis.com";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry = { data: unknown; ts: number };
const cache = new Map<string, CacheEntry>();

function estimateDifficulty(text: string): "B1" | "B2" | "C1" {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "B1";
  const avgLen = words.reduce((s, w) => s + w.length, 0) / words.length;
  if (avgLen < 4.8) return "B1";
  if (avgLen < 5.5) return "B2";
  return "C1";
}

function stripHtml(html: string): string {
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

/**
 * GET /api/reading/articles
 * Fetches articles from The Guardian API with caching.
 * Query params: section, page, pageSize
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const section = searchParams.get("section") || "";
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("pageSize") || "12";

  const cacheKey = `articles:${section}:${page}:${pageSize}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return Response.json(cached.data);
  }

  try {
    const params = new URLSearchParams({
      "api-key": GUARDIAN_API_KEY,
      "show-fields": "headline,trailText,thumbnail,bodyText,byline,wordcount",
      "page-size": pageSize,
      page,
      "order-by": "newest",
    });
    if (section) params.set("section", section);

    const url = `${GUARDIAN_BASE}/search?${params}`;
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      console.error("[Reading] Guardian API error:", res.status, await res.text());
      return Response.json({ error: "Failed to fetch articles" }, { status: 502 });
    }

    const json = await res.json();
    const results = json.response?.results ?? [];

    const articles = results.map((r: Record<string, unknown>) => {
      const fields = (r.fields ?? {}) as Record<string, string>;
      const bodyText = fields.bodyText ?? "";
      const wordCount = Number(fields.wordcount) || bodyText.split(/\s+/).length;

      return {
        id: encodeURIComponent(r.id as string),
        rawId: r.id,
        title: fields.headline ?? (r.webTitle as string) ?? "",
        trailText: stripHtml(fields.trailText ?? ""),
        author: fields.byline ?? "",
        date: r.webPublicationDate as string,
        thumbnail: fields.thumbnail ?? null,
        section: (r.sectionName as string) ?? "",
        sectionId: (r.sectionId as string) ?? "",
        wordCount,
        readTime: Math.max(1, Math.round(wordCount / 200)),
        difficulty: estimateDifficulty(bodyText),
      };
    });

    const data = {
      articles,
      currentPage: json.response?.currentPage ?? 1,
      totalPages: json.response?.pages ?? 1,
    };

    cache.set(cacheKey, { data, ts: Date.now() });

    return Response.json(data);
  } catch (err) {
    console.error("[Reading] Error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
