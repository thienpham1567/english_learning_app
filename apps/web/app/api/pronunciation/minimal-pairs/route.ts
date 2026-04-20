import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { minimalPairsSession } from "@repo/database";
import {
  CONTRAST_TAGS,
  type MinimalPairTagStat,
} from "@/lib/pronunciation/minimal-pairs";

/**
 * POST /api/pronunciation/minimal-pairs — Save session result (AC5)
 * GET  /api/pronunciation/minimal-pairs — Get weakness aggregation (AC6)
 */

type MinimalPairsPayload = {
  mode: "listen" | "speak";
  total: number;
  correct: number;
  focusTags: string[];
  tagStats: MinimalPairTagStat[];
};

type StoredMinimalPairsSession = {
  focusTags: unknown;
  tagStats?: unknown;
};

const KNOWN_TAGS = new Set(CONTRAST_TAGS);

function isKnownTag(value: unknown): value is string {
  return typeof value === "string" && KNOWN_TAGS.has(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function uniqueKnownTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isKnownTag))];
}

function normalizeTagStats(value: unknown): MinimalPairTagStat[] {
  if (!Array.isArray(value)) return [];

  const stats = new Map<string, MinimalPairTagStat>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as { tag?: unknown; total?: unknown; correct?: unknown };
    if (!isKnownTag(candidate.tag)) continue;
    if (!isInteger(candidate.total) || !isInteger(candidate.correct)) continue;
    if (candidate.total < 1 || candidate.correct < 0 || candidate.correct > candidate.total) continue;

    const existing = stats.get(candidate.tag) ?? { tag: candidate.tag, total: 0, correct: 0 };
    existing.total += candidate.total;
    existing.correct += candidate.correct;
    stats.set(candidate.tag, existing);
  }

  return [...stats.values()];
}

export function normalizeMinimalPairsPayload(body: unknown):
  | { ok: true; value: MinimalPairsPayload }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid JSON body" };
  }

  const data = body as {
    mode?: unknown;
    total?: unknown;
    correct?: unknown;
    focusTags?: unknown;
    tagStats?: unknown;
  };

  if (data.mode !== "listen" && data.mode !== "speak") {
    return { ok: false, error: "mode must be 'listen' or 'speak'" };
  }
  if (
    !isInteger(data.total)
    || !isInteger(data.correct)
    || data.total < 1
    || data.correct < 0
    || data.correct > data.total
  ) {
    return { ok: false, error: "Invalid total/correct values" };
  }
  if (data.focusTags !== undefined && !Array.isArray(data.focusTags)) {
    return { ok: false, error: "focusTags must be an array" };
  }
  if (data.tagStats !== undefined && !Array.isArray(data.tagStats)) {
    return { ok: false, error: "tagStats must be an array" };
  }

  return {
    ok: true,
    value: {
      mode: data.mode,
      total: data.total,
      correct: data.correct,
      focusTags: uniqueKnownTags(data.focusTags ?? []),
      tagStats: normalizeTagStats(data.tagStats ?? []),
    },
  };
}

export function aggregateWeakestContrasts(sessions: StoredMinimalPairsSession[]) {
  const tagStats = new Map<string, MinimalPairTagStat>();

  for (const session of sessions) {
    const stats = normalizeTagStats(session.tagStats ?? []);

    if (stats.length > 0) {
      for (const stat of stats) {
        const existing = tagStats.get(stat.tag) ?? { tag: stat.tag, total: 0, correct: 0 };
        existing.total += stat.total;
        existing.correct += stat.correct;
        tagStats.set(stat.tag, existing);
      }
      continue;
    }

    // Legacy fallback: old rows only recorded missed focus tags, not per-tag totals.
    for (const tag of uniqueKnownTags(session.focusTags)) {
      const existing = tagStats.get(tag) ?? { tag, total: 0, correct: 0 };
      existing.total += 1;
      tagStats.set(tag, existing);
    }
  }

  return [...tagStats.values()]
    .map(({ tag, total, correct }) => ({
      tag,
      total,
      correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total || a.tag.localeCompare(b.tag))
    .slice(0, 3);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = normalizeMinimalPairsPayload(await request.json().catch(() => null));
  if (!payload.ok) {
    return Response.json({ error: payload.error }, { status: 400 });
  }

  try {
    await db.insert(minimalPairsSession).values({
      userId: session.user.id,
      mode: payload.value.mode,
      total: payload.value.total,
      correct: payload.value.correct,
      focusTags: payload.value.focusTags,
      tagStats: payload.value.tagStats,
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[minimal-pairs] Save failed:", err);
    return Response.json({ error: "Failed to save session" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await db
      .select()
      .from(minimalPairsSession)
      .where(eq(minimalPairsSession.userId, session.user.id))
      .orderBy(desc(minimalPairsSession.createdAt));

    return Response.json({
      sessions: sessions.length,
      weakest: aggregateWeakestContrasts(sessions),
    });
  } catch (err) {
    console.error("[minimal-pairs] Aggregate failed:", err);
    return Response.json({ error: "Failed to load data" }, { status: 500 });
  }
}
