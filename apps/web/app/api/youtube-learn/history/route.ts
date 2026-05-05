import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, desc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db, youtubeVideoHistory, type TranscriptSegment } from "@repo/database";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("youtube-learn/history");

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    }

    const rows = await db
      .select({
        id: youtubeVideoHistory.id,
        videoId: youtubeVideoHistory.videoId,
        title: youtubeVideoHistory.title,
        thumbnailUrl: youtubeVideoHistory.thumbnailUrl,
        channelTitle: youtubeVideoHistory.channelTitle,
        durationSec: youtubeVideoHistory.durationSec,
        lastPosition: youtubeVideoHistory.lastPosition,
        updatedAt: youtubeVideoHistory.updatedAt,
      })
      .from(youtubeVideoHistory)
      .where(eq(youtubeVideoHistory.userId, session.user.id))
      .orderBy(desc(youtubeVideoHistory.updatedAt))
      .limit(50);

    return NextResponse.json({ history: rows });
  } catch (err) {
    log.error({ err }, "history GET error");
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      videoId?: unknown;
      title?: unknown;
      thumbnailUrl?: unknown;
      channelTitle?: unknown;
      durationSec?: unknown;
      transcript?: unknown;
      lastPosition?: unknown;
    } | null;

    if (!body || typeof body.videoId !== "string" || typeof body.title !== "string") {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    }

    const transcript = Array.isArray(body.transcript) ? (body.transcript as TranscriptSegment[]) : [];
    const lastPosition = typeof body.lastPosition === "number" ? Math.floor(body.lastPosition) : 0;
    const durationSec = typeof body.durationSec === "number" ? Math.floor(body.durationSec) : null;
    const thumbnailUrl = typeof body.thumbnailUrl === "string" ? body.thumbnailUrl : null;
    const channelTitle = typeof body.channelTitle === "string" ? body.channelTitle : null;

    const [row] = await db
      .insert(youtubeVideoHistory)
      .values({
        userId: session.user.id,
        videoId: body.videoId,
        title: body.title,
        thumbnailUrl,
        channelTitle,
        durationSec,
        transcript,
        lastPosition,
      })
      .onConflictDoUpdate({
        target: [youtubeVideoHistory.userId, youtubeVideoHistory.videoId],
        set: {
          title: body.title,
          thumbnailUrl,
          channelTitle,
          durationSec,
          transcript,
          lastPosition,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ id: row?.id });
  } catch (err) {
    log.error({ err }, "history POST error");
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    if (!videoId) {
      return NextResponse.json({ error: "Thiếu videoId." }, { status: 400 });
    }

    await db
      .delete(youtubeVideoHistory)
      .where(
        and(
          eq(youtubeVideoHistory.userId, session.user.id),
          eq(youtubeVideoHistory.videoId, videoId),
        ),
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, "history DELETE error");
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
