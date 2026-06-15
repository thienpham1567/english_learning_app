import { db, errorLog, flashcardProgress, pushSubscription, userStreak } from "@repo/database";
import { inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import webpush from "web-push";

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

// Streak-tier motivational messages for variety
const STREAK_MESSAGES = {
  fire: [
    {
      title: "🔥 Streak {n} ngày — phi thường!",
      body: "Tiếp tục đà chiến thắng! Bạn đang top 5% người dùng.",
    },
    {
      title: "⚡ {n} ngày liên tục!",
      body: "Mỗi ngày luyện tập là một bước gần hơn mục tiêu TOEIC.",
    },
  ],
  warm: [
    { title: "🔥 Streak {n} ngày!", body: "Đừng để mất streak! Hoàn thành 1 bài tập ngay." },
    { title: "💪 {n} ngày kiên trì!", body: "Chỉ cần 5 phút để giữ streak. Bạn làm được!" },
  ],
  start: [
    { title: "✨ Thử thách mỗi ngày đang chờ!", body: "Bắt đầu học tiếng Anh ngay hôm nay." },
    { title: "🚀 Sẵn sàng chưa?", body: "1 bài tập nhỏ, tiến bộ lớn. Bắt đầu thôi!" },
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * GET /api/cron/daily-push
 * Called by Vercel Cron at 20:00 Vietnam time daily.
 * Sends personalized push notifications to users who haven't completed activity today.
 * Enhanced with SRS-aware review reminders, error count nudges, and streak-tier variety.
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

  // Pre-fetch unresolved error counts per user (N+1 avoidance)
  const errorCounts = await db
    .select({
      userId: errorLog.userId,
      count: sql<number>`count(*)::int`,
    })
    .from(errorLog)
    .where(sql`${errorLog.isResolved} = false`)
    .groupBy(errorLog.userId);
  const errorMap = new Map(errorCounts.map((r) => [r.userId, Number(r.count)]));

  for (const sub of subscriptions) {
    // Skip users who already completed activity today
    if (sub.lastCompletedDate === today) continue;

    // Build personalized message with priority:
    // 1. Due flashcards (SRS urgency)
    // 2. Unresolved errors (weakness awareness)
    // 3. Streak-based motivational message (tiered variety)
    let title: string;
    let body: string;

    const dueCount = dueMap.get(sub.userId) ?? 0;
    const unresolvedErrors = errorMap.get(sub.userId) ?? 0;
    const streak = sub.currentStreak ?? 0;

    if (dueCount > 0) {
      title = `📚 ${dueCount} flashcard đang chờ bạn ôn`;
      body =
        unresolvedErrors > 0
          ? `Ôn tập ngay + ${unresolvedErrors} lỗi sai cần xem lại!`
          : "Ôn tập ngay để không quên từ vựng!";
    } else if (unresolvedErrors >= 5) {
      title = `📝 ${unresolvedErrors} lỗi sai chưa nắm`;
      body = "Mở Sổ lỗi sai để ôn lại những điểm yếu nhé!";
    } else if (streak >= 14) {
      const msg = pickRandom(STREAK_MESSAGES.fire);
      title = msg.title.replace("{n}", String(streak));
      body = msg.body;
    } else if (streak > 0) {
      const msg = pickRandom(STREAK_MESSAGES.warm);
      title = msg.title.replace("{n}", String(streak));
      body = msg.body;
    } else {
      const msg = pickRandom(STREAK_MESSAGES.start);
      title = msg.title;
      body = msg.body;
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
          data: { url: "/toeic/practice" },
        }),
      );
      sent++;
    } catch (err: unknown) {
      failed++;
      // If subscription expired (410 Gone), mark for cleanup
      if (
        err &&
        typeof err === "object" &&
        "statusCode" in err &&
        (err as { statusCode: number }).statusCode === 410
      ) {
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
