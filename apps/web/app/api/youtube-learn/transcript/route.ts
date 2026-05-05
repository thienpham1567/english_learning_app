import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { YoutubeTranscript } from "youtube-transcript";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { extractYouTubeVideoId } from "@/lib/youtube/extract-id";

const log = routeLogger("youtube-learn/transcript");

type OEmbedResponse = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
};

async function fetchVideoMeta(videoId: string): Promise<OEmbedResponse> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { cache: "no-store" },
    );
    if (!res.ok) return {};
    return (await res.json()) as OEmbedResponse;
  } catch {
    return {};
  }
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

    let segments: Array<{ start: number; duration: number; text: string }> = [];
    try {
      const raw = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
      segments = raw.map((s) => ({
        start: s.offset / 1000,
        duration: s.duration / 1000,
        text: decodeHtmlEntities(s.text),
      }));
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

    const meta = await fetchVideoMeta(videoId);

    return NextResponse.json({
      videoId,
      title: meta.title ?? "Untitled video",
      channelTitle: meta.author_name ?? null,
      thumbnailUrl: meta.thumbnail_url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      transcript: segments,
    });
  } catch (err) {
    log.error({ err }, "transcript route error");
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}
