import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushSubscription } from "@/lib/db/schema";

/**
 * POST /api/push/subscribe
 * Save a push subscription for the current user.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { endpoint, keys } = body as Record<string, unknown>;

  if (
    typeof endpoint !== "string" ||
    !endpoint ||
    !keys ||
    typeof keys !== "object" ||
    !("p256dh" in keys) ||
    !("auth" in keys)
  ) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const { p256dh, auth: authKey } = keys as Record<string, string>;

  // Atomic upsert using ON CONFLICT (requires unique index on endpoint)
  await db.insert(pushSubscription).values({
    userId: session.user.id,
    endpoint,
    p256dh,
    auth: authKey,
  }).onConflictDoUpdate({
    target: pushSubscription.endpoint,
    set: { userId: session.user.id, p256dh, auth: authKey },
  });

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/push/subscribe
 * Remove push subscription for the current user.
 */
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { endpoint } = body as Record<string, unknown>;

  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await db.delete(pushSubscription).where(
    and(
      eq(pushSubscription.userId, session.user.id),
      eq(pushSubscription.endpoint, endpoint),
    ),
  );

  return NextResponse.json({ ok: true });
}
