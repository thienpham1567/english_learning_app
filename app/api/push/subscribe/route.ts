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

  const body = await request.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  // Upsert: delete any existing subscription for this endpoint, then insert
  await db.delete(pushSubscription).where(eq(pushSubscription.endpoint, endpoint));

  await db.insert(pushSubscription).values({
    userId: session.user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
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

  const body = await request.json();
  const { endpoint } = body;

  if (!endpoint) {
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
