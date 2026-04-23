import { NextRequest } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { fetchGuardianArticle } from "@/lib/reading/utils";

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

  try {
    const data = await fetchGuardianArticle(articleId);
    return Response.json(data);
  } catch (err) {
    console.error("[Reading] Article error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
