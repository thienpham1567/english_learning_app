import { NextResponse } from "next/server";
import { inArray, sql } from "drizzle-orm";
import webpush from "web-push";

import { db } from "@repo/database";
import { pushSubscription, userStreak, flashcardProgress } from "@repo/database";

// VAPID keys — configured lazily to avoid build-time crash
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@thienglish.app";
let vapidInitialized = false;

function initWebPush() {
  if (vapidInitialized) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    throw new Error("Missing VAPID keys");
  }
  webpush.setVapidDetails(VAPID_EMAIL, pub, priv);
  vapidInitialized = true;
}

/**
 * GET /api/cron/daily-push
 * Called by Vercel Cron at 20:00 Vietnam time daily.
 * Sends personalized push notifications to users who haven't completed activity today.
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Initialize web-push with VAPID keys (lazy — only at runtime)
  try {
    initWebPush();
  } catch {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  // Get today's date in Vietnam timezone
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

  // Get all enabled subscriptions with user streak data
  const subscriptions = await db
    .select({
      id: pushSubscription.id,
      endpoint: pushSubscription.endpoint,
      p256dh: pushSubscription.p256dh,
      auth: pushSubscription.auth,
      userId: pushSubscription.userId,
      currentStreak: userStreak.currentStreak,
      lastCompletedDate: userStreak.lastCompletedDate,
    })
    .from(pushSubscription)
    .leftJoin(userStreak, sql`${pushSubscription.userId} = ${userStreak.userId}`)
    .where(sql`${pushSubscription.enabled} = true`);

  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  // Pre-fetch due flashcard counts for all users in one query (avoids N+1)
  const dueCounts = await db
    .select({
      userId: flashcardProgress.userId,
      count: sql<number>`count(*)`,
    })
    .from(flashcardProgress)
    .where(sql`${flashcardProgress.nextReview} <= NOW()`)
    .groupBy(flashcardProgress.userId);
  const dueMap = new Map(dueCounts.map((r) => [r.userId, Number(r.count)]));

  for (const sub of subscriptions) {
    // Skip users who already completed activity today
    if (sub.lastCompletedDate === today) continue;

    // Build personalized message
    let title: string;
    let body: string;

    const dueCount = dueMap.get(sub.userId) ?? 0;
    if (dueCount > 0) {
      title = `📚 ${dueCount} flashcard đang chờ bạn ôn`;
      body = "Ôn tập ngay để không quên từ vựng!";
    } else if (sub.currentStreak && sub.currentStreak > 0) {
      title = `🔥 Streak ${sub.currentStreak} ngày!`;
      body = "Đừng để mất streak! Hoàn thành 1 bài tập ngay.";
    } else {
      title = "✨ Thử thách mỗi ngày đang chờ!";
      body = "Bắt đầu học tiếng Anh ngay hôm nay.";
    }

    // Send push notification
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title,
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          data: { url: "/home" },
        }),
      );
      sent++;
    } catch (err: unknown) {
      failed++;
      // If subscription expired (410 Gone), mark for cleanup
      if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
        staleEndpoints.push(sub.endpoint);
      }
    }
  }

  // Clean up stale subscriptions (single batched DELETE)
  if (staleEndpoints.length > 0) {
    await db.delete(pushSubscription).where(inArray(pushSubscription.endpoint, staleEndpoints));
  }

  return NextResponse.json({
    sent,
    failed,
    cleaned: staleEndpoints.length,
    total: subscriptions.length,
  });
}
