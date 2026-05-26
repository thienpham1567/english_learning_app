import { readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

/**
 * GET /api/cron/cleanup-toeic-audio
 * Daily cron — delete TOEIC speaking upload files older than 30 days.
 *
 * Configured in vercel.json or external cron with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dir = join(process.cwd(), "uploads/speaking");
  const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

  let scanned = 0;
  let deleted = 0;
  let errors = 0;

  try {
    const entries = await readdir(dir);
    for (const name of entries) {
      scanned++;
      const path = join(dir, name);
      try {
        const s = await stat(path);
        if (s.isFile() && s.mtimeMs < cutoffMs) {
          await unlink(path);
          deleted++;
        }
      } catch {
        errors++;
      }
    }
  } catch (err) {
    // dir doesn't exist yet — fine
    return NextResponse.json({
      scanned: 0,
      deleted: 0,
      note: "uploads dir not present",
      error: err instanceof Error ? err.message : null,
    });
  }

  return NextResponse.json({ scanned, deleted, errors });
}
