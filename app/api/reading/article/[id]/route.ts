import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY ?? "test";
const GUARDIAN_BASE = "https://content.guardianapis.com";

type CacheEntry = { data: unknown; ts: number };
const articleCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

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

function estimateDifficulty(text: string): "B1" | "B2" | "C1" {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "B1";
  const avgLen = words.reduce((s, w) => s + w.length, 0) / words.length;
  if (avgLen < 4.8) return "B1";
  if (avgLen < 5.5) return "B2";
  return "C1";
}

/**
 * GET /api/reading/article/[id]
 * Fetches a single article from Guardian by its encoded ID.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const articleId = decodeURIComponent(id);

  // Check cache
  const cached = articleCache.get(articleId);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return Response.json(cached.data);
  }

  try {
    const apiUrl = `${GUARDIAN_BASE}/${articleId}?api-key=${GUARDIAN_API_KEY}&show-fields=headline,trailText,thumbnail,body,bodyText,byline,wordcount`;
    const res = await fetch(apiUrl, { next: { revalidate: 3600 } });

    if (!res.ok) {
      console.error("[Reading] Article fetch error:", res.status);
      return Response.json({ error: "Article not found" }, { status: 404 });
    }

    const json = await res.json();
    const content = json.response?.content;
    if (!content) {
      return Response.json({ error: "Article not found" }, { status: 404 });
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

    articleCache.set(articleId, { data, ts: Date.now() });

    return Response.json(data);
  } catch (err) {
    console.error("[Reading] Article error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
