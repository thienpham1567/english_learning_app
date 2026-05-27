import { db, toeicDictationItem, toeicQuestion } from "@repo/database";
import { Card, Tag } from "antd";
import { eq, sql } from "drizzle-orm";
import { Headphones } from "lucide-react";
import Link from "next/link";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

export default async function ToeicListeningPage() {
  await requireToeicBaseline();

  const counts = await db
    .select({ part: toeicQuestion.part, c: sql<number>`count(*)::int` })
    .from(toeicQuestion)
    .groupBy(toeicQuestion.part);
  const byPart = new Map(counts.map((r) => [r.part, r.c]));

  const dictationCount = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(toeicDictationItem);
  const dictation = dictationCount[0]?.c ?? 0;

  const cards = [
    {
      href: "/toeic/practice?part=1",
      title: "Part 1 — Photos",
      count: byPart.get(1) ?? 0,
      subtitle: "Photo descriptions · 4 audio captions",
      disabled: (byPart.get(1) ?? 0) === 0,
      note: (byPart.get(1) ?? 0) === 0 ? "Run seed:toeic-part1 to add content" : undefined,
    },
    {
      href: "/toeic/practice?part=2",
      title: "Part 2 — Q-R",
      count: byPart.get(2) ?? 0,
      subtitle: "Audio Q + 3 Responses · 25 questions/test",
      disabled: (byPart.get(2) ?? 0) === 0,
    },
    {
      href: "/toeic/practice?part=3",
      title: "Part 3 — Conversations",
      count: byPart.get(3) ?? 0,
      subtitle: "Conversations · 39 questions/test",
    },
    {
      href: "/toeic/practice?part=4",
      title: "Part 4 — Talks",
      count: byPart.get(4) ?? 0,
      subtitle: "Short Talks · 30 questions/test",
    },
    {
      href: "/toeic/dictation",
      title: "Dictation",
      count: dictation,
      subtitle: "Sentence dictation · train your ear",
      disabled: dictation === 0,
    },
  ];

  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div
        className="p-4 grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
      >
        {cards.map((c) => {
          const inner = (
            <Card
              hoverable={!c.disabled}
              style={c.disabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            >
              <div className="flex justify-between items-center">
                <strong>{c.title}</strong>
                <Tag>{c.count} questions</Tag>
              </div>
              <div className="text-text-muted text-[13px] mt-1.5">{c.subtitle}</div>
              {c.note && (
                <div className="text-xs mt-2" style={{ color: "var(--warning)" }}>
                  {c.note}
                </div>
              )}
            </Card>
          );
          return c.href && !c.disabled ? (
            <Link key={c.title} href={c.href} style={{ textDecoration: "none" }}>
              {inner}
            </Link>
          ) : (
            <div key={c.title}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
