import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db, youtubeVideoHistory } from "@repo/database";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("youtube-learn/history/[videoId]");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    }

    const { videoId } = await params;
    const [row] = await db
      .select()
      .from(youtubeVideoHistory)
      .where(
        and(
          eq(youtubeVideoHistory.userId, session.user.id),
          eq(youtubeVideoHistory.videoId, videoId),
        ),
      )
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
    }

    return NextResponse.json({
      videoId: row.videoId,
      title: row.title,
      channelTitle: row.channelTitle,
      thumbnailUrl: row.thumbnailUrl,
      durationSec: row.durationSec,
      transcript: row.transcript,
      lastPosition: row.lastPosition,
    });
  } catch (err) {
    log.error({ err }, "history single GET error");
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
