import { NextResponse } from "next/server";
import axios from "axios";

import { ALLOWED_QUERY_PATTERN } from "@/lib/dictionary/normalize-query";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("q") ?? "";
  const q = raw.trim().toLowerCase();

  if (q.length < 2 || !ALLOWED_QUERY_PATTERN.test(q)) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const { data } = await axios.get<{ word: string }[]>(
      "https://api.datamuse.com/sug",
      { params: { s: q, max: 8 } },
    );
    return NextResponse.json({ suggestions: data.map((item) => item.word) });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
