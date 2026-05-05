import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Innertube } from "youtubei.js";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { extractYouTubeVideoId } from "@/lib/youtube/extract-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = routeLogger("youtube-learn/transcript");

type Segment = { start: number; duration: number; text: string };

let innertubePromise: Promise<Innertube> | null = null;
function getInnertube(): Promise<Innertube> {
  if (!innertubePromise) {
    innertubePromise = Innertube.create({ retrieve_player: false });
  }
  return innertubePromise;
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as { url?: unknown } | null;
    const rawUrl = typeof body?.url === "string" ? body.url : "";
    const videoId = extractYouTubeVideoId(rawUrl);

    if (!videoId) {
      return NextResponse.json(
        { error: "Link YouTube không hợp lệ. Hãy dán link đầy đủ." },
        { status: 400 },
      );
    }

    const yt = await getInnertube();

    let info;
    try {
      info = await yt.getInfo(videoId);
    } catch (err) {
      log.warn({ err, videoId }, "getInfo failed");
      return NextResponse.json(
        { error: "Không tải được video. Kiểm tra link hoặc video có thể bị chặn." },
        { status: 404 },
      );
    }

    let segments: Segment[] = [];
    try {
      const transcriptData = await info.getTranscript();
      const initial =
        transcriptData?.transcript?.content?.body?.initial_segments ?? [];
      segments = initial
        .map((seg): Segment | null => {
          const startMs = Number(seg.start_ms);
          const endMs = Number(seg.end_ms);
          const text = seg.snippet?.text?.trim() ?? "";
          if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || !text) {
            return null;
          }
          return {
            start: startMs / 1000,
            duration: Math.max(0, (endMs - startMs) / 1000),
            text,
          };
        })
        .filter((s): s is Segment => s !== null);
    } catch (err) {
      log.warn({ err, videoId }, "transcript fetch failed");
      return NextResponse.json(
        { error: "Video này không có phụ đề tiếng Anh. Hãy thử video khác." },
        { status: 404 },
      );
    }

    if (segments.length === 0) {
      return NextResponse.json(
        { error: "Video này không có phụ đề tiếng Anh." },
        { status: 404 },
      );
    }

    const basic = info.basic_info;
    const thumbnails = basic.thumbnail ?? [];
    const bestThumb = thumbnails[thumbnails.length - 1]?.url;

    return NextResponse.json({
      videoId,
      title: basic.title ?? "Untitled video",
      channelTitle: basic.author ?? null,
      thumbnailUrl: bestThumb ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      transcript: segments,
    });
  } catch (err) {
    log.error({ err }, "transcript route error");
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
