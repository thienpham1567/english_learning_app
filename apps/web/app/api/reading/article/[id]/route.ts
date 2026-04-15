import { NextRequest } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { stripHtml, estimateDifficulty, BoundedCache } from "@/lib/reading/utils";

const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY ?? "test";
const GUARDIAN_BASE = "https://content.guardianapis.com";

const articleCache = new BoundedCache<unknown>(200, 60 * 60 * 1000); // 200 entries, 1-hour TTL

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

  const cached = articleCache.get(articleId);
  if (cached) {
    return Response.json(cached);
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

    articleCache.set(articleId, data);

    return Response.json(data);
  } catch (err) {
    console.error("[Reading] Article error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
