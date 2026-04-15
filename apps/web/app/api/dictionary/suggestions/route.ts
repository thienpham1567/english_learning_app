import { NextResponse } from "next/server";

import { ALLOWED_QUERY_PATTERN } from "@/lib/dictionary/normalize-query";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("q") ?? "";
  const q = raw.trim().toLowerCase();

  if (q.length < 2 || !ALLOWED_QUERY_PATTERN.test(q)) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const searchParams = new URLSearchParams({ s: q, max: "8" });
    const response = await fetch(`https://api.datamuse.com/sug?${searchParams.toString()}`);

    if (!response.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const data = (await response.json()) as { word: string }[];
    return NextResponse.json({ suggestions: data.map((item) => item.word) });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
