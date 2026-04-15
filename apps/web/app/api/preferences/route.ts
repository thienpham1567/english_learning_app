import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";

/**
 * GET /api/preferences
 * Returns user preferences (exam mode, etc.)
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const rows = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (rows.length === 0) {
    // Return default
    return Response.json({ examMode: "toeic" });
  }

  return Response.json({ examMode: rows[0].examMode });
}

/**
 * PATCH /api/preferences
 * Update user preferences.
 * Body: { examMode: "toeic" | "ielts" }
 */
export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const examMode = body.examMode;

  if (examMode !== "toeic" && examMode !== "ielts") {
    return Response.json({ error: "Invalid examMode" }, { status: 400 });
  }

  await db
    .insert(userPreferences)
    .values({ userId, examMode, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { examMode, updatedAt: new Date() },
    });

  return Response.json({ examMode });
}
