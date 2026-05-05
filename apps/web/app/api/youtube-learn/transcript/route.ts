import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Innertube } from "youtubei.js";
import type { YT } from "youtubei.js";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { extractYouTubeVideoId } from "@/lib/youtube/extract-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = routeLogger("youtube-learn/transcript");

type Segment = { start: number; duration: number; text: string };

const CLIENT_FALLBACKS = ["IOS", "ANDROID", "TV_EMBEDDED", "WEB"] as const;
type ClientType = (typeof CLIENT_FALLBACKS)[number];

let innertubePromise: Promise<Innertube> | null = null;
function getInnertube(): Promise<Innertube> {
  if (!innertubePromise) {
    innertubePromise = Innertube.create({ retrieve_player: false });
  }
  return innertubePromise;
}

async function tryGetInfoWithCaptions(
  yt: Innertube,
  videoId: string,
): Promise<{ info: YT.VideoInfo; client: ClientType } | null> {
  for (const client of CLIENT_FALLBACKS) {
    try {
      const info = await yt.getInfo(videoId, { client });
      const trackCount = info.captions?.caption_tracks?.length ?? 0;
      log.info(
        { videoId, client, captionTracksCount: trackCount },
        "tried client",
      );
      if (trackCount > 0) return { info, client };
    } catch (err) {
      log.warn(
        {
          videoId,
          client,
          errMessage: err instanceof Error ? err.message : String(err),
        },
        "getInfo with client failed",
      );
    }
  }
  return null;
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

    log.info({ videoId }, "fetching video info");

    const result = await tryGetInfoWithCaptions(yt, videoId);
    if (!result) {
      log.error(
        { videoId, triedClients: CLIENT_FALLBACKS },
        "no client returned caption tracks (likely IP-gated)",
      );
      return NextResponse.json(
        {
          error:
            "YouTube đang chặn server lấy phụ đề video này. Hãy thử lại sau hoặc dùng video khác.",
        },
        { status: 502 },
      );
    }

    const { info, client: usedClient } = result;
    const captionTracks =
      info.captions?.caption_tracks?.map((t) => ({
        languageCode: t.language_code,
        kind: t.kind,
        name: t.name?.text,
        vssId: t.vss_id,
      })) ?? [];
    log.info(
      {
        videoId,
        usedClient,
        title: info.basic_info?.title,
        captionTracksCount: captionTracks.length,
        captionTracks,
      },
      "video info loaded",
    );

    let segments: Segment[] = [];
    try {
      const transcriptData = await info.getTranscript();
      const initial =
        transcriptData?.transcript?.content?.body?.initial_segments ?? [];

      log.info(
        {
          videoId,
          usedClient,
          rawSegmentCount: initial.length,
          firstSegment: initial[0],
        },
        "transcript fetched",
      );

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
      log.error(
        {
          err,
          errMessage: err instanceof Error ? err.message : String(err),
          errStack: err instanceof Error ? err.stack : undefined,
          videoId,
          usedClient,
          captionTracks,
        },
        "transcript fetch failed",
      );

      const track =
        info.captions?.caption_tracks?.find((t) => /^en/i.test(t.language_code ?? "")) ??
        info.captions?.caption_tracks?.[0];
      const baseUrl = track?.base_url;
      if (baseUrl) {
        log.info({ videoId, baseUrl }, "falling back to direct timedtext fetch");
        try {
          segments = await fetchTimedtext(baseUrl);
        } catch (fallbackErr) {
          log.error(
            {
              videoId,
              errMessage:
                fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
            },
            "timedtext fallback failed",
          );
        }
      }

      if (segments.length === 0) {
        return NextResponse.json(
          { error: "Video này không có phụ đề tiếng Anh. Hãy thử video khác." },
          { status: 404 },
        );
      }
    }

    if (segments.length === 0) {
      log.warn(
        { videoId, captionTracks },
        "transcript returned zero usable segments",
      );
      return NextResponse.json(
        { error: "Video này không có phụ đề tiếng Anh." },
        { status: 404 },
      );
    }

    log.info(
      { videoId, usedClient, segmentCount: segments.length },
      "transcript ready",
    );

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

async function fetchTimedtext(baseUrl: string): Promise<Segment[]> {
  const url = baseUrl.includes("fmt=") ? baseUrl : `${baseUrl}&fmt=json3`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    throw new Error(`timedtext HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    events?: Array<{
      tStartMs?: number;
      dDurationMs?: number;
      segs?: Array<{ utf8?: string }>;
    }>;
  };
  const segments: Segment[] = [];
  for (const ev of data.events ?? []) {
    if (typeof ev.tStartMs !== "number" || !ev.segs) continue;
    const text = ev.segs
      .map((s) => s.utf8 ?? "")
      .join("")
      .replace(/\n+/g, " ")
      .trim();
    if (!text) continue;
    segments.push({
      start: ev.tStartMs / 1000,
      duration: (ev.dDurationMs ?? 0) / 1000,
      text,
    });
  }
  return segments;
}
