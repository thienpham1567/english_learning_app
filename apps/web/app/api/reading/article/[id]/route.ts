import { headers } from "next/headers";
import { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("reading/article/[id]");

import { fetchGuardianArticle } from "@/lib/reading/utils";

/**
 * GET /api/reading/article/[id]
 * Fetches a single article from Guardian by its encoded ID.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const articleId = decodeURIComponent(id);

  try {
    const data = await fetchGuardianArticle(articleId);
    return Response.json(data);
  } catch (err) {
    log.error({ err }, "reading.article.error");
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
