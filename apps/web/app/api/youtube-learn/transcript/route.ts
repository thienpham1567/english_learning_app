import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { extractYouTubeVideoId } from "@/lib/youtube/extract-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = routeLogger("youtube-learn/transcript");

type Segment = { start: number; duration: number; text: string };

type SupadataTranscript = {
  content: Array<{
    text: string;
    offset: number;
    duration: number;
    lang?: string;
  }>;
  lang?: string;
  availableLangs?: string[];
};

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

    const apiKey = process.env.SUPADATA_API_KEY;
    if (!apiKey) {
      log.error({}, "SUPADATA_API_KEY env var is missing");
      return NextResponse.json(
        { error: "Server chưa cấu hình transcript provider." },
        { status: 500 },
      );
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

    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const supadataUrl =
      `https://api.supadata.ai/v1/youtube/transcript` +
      `?url=${encodeURIComponent(watchUrl)}&lang=en&text=false`;

    log.info({ videoId }, "fetching transcript via Supadata");

    let supadataRes: Response;
    try {
      supadataRes = await fetch(supadataUrl, {
        headers: { "x-api-key": apiKey },
        cache: "no-store",
      });
    } catch (err) {
      log.error(
        { err, errMessage: err instanceof Error ? err.message : String(err), videoId },
        "Supadata network error",
      );
      return NextResponse.json(
        { error: "Không kết nối được dịch vụ transcript. Hãy thử lại." },
        { status: 502 },
      );
    }

    if (!supadataRes.ok) {
      const errBody = await supadataRes.text().catch(() => "");
      log.warn(
        { videoId, status: supadataRes.status, body: errBody.slice(0, 500) },
        "Supadata returned non-ok",
      );
      if (supadataRes.status === 404) {
        return NextResponse.json(
          { error: "Video này không có phụ đề tiếng Anh. Hãy thử video khác." },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Dịch vụ transcript đang gặp sự cố. Hãy thử lại sau." },
        { status: 502 },
      );
    }

    const data = (await supadataRes.json()) as SupadataTranscript;
    const segments: Segment[] = (data.content ?? [])
      .map((c): Segment | null => {
        const offsetMs = Number(c.offset);
        const durationMs = Number(c.duration);
        const text = c.text?.trim() ?? "";
        if (!Number.isFinite(offsetMs) || !text) return null;
        return {
          start: offsetMs / 1000,
          duration: Number.isFinite(durationMs) ? durationMs / 1000 : 0,
          text,
        };
      })
      .filter((s): s is Segment => s !== null);

    if (segments.length === 0) {
      log.warn({ videoId, lang: data.lang }, "Supadata returned empty content");
      return NextResponse.json(
        { error: "Video này không có phụ đề tiếng Anh." },
        { status: 404 },
      );
    }

    log.info(
      { videoId, lang: data.lang, segmentCount: segments.length },
      "transcript ready",
    );

    const meta = await fetchVideoMeta(videoId);

    return NextResponse.json({
      videoId,
      title: meta.title ?? "Untitled video",
      channelTitle: meta.author_name ?? null,
      thumbnailUrl: meta.thumbnail_url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      transcript: segments,
    });
  } catch (err) {
    log.error(
      { err, errMessage: err instanceof Error ? err.message : String(err) },
      "transcript route error",
    );
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
