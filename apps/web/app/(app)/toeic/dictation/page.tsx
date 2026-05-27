import { db, toeicDictationItem } from "@repo/database";
import { asc } from "drizzle-orm";
import { Headphones } from "lucide-react";
import Link from "next/link";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
const LEVEL_COLOR: Record<string, string> = {
  beginner: "green",
  intermediate: "orange",
  advanced: "red",
};

export default async function ToeicDictationPage() {
  await requireToeicBaseline();

  const items = await db
    .select({
      id: toeicDictationItem.id,
      level: toeicDictationItem.level,
      topic: toeicDictationItem.topic,
    })
    .from(toeicDictationItem)
    .orderBy(asc(toeicDictationItem.level), asc(toeicDictationItem.topic));

  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    grouped[item.level] = grouped[item.level] ?? [];
    grouped[item.level].push(item);
  }

  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 grid gap-4">
        {["beginner", "intermediate", "advanced"].map((lv) => {
          const list = grouped[lv] ?? [];
          if (list.length === 0) return null;
          return (
            <div
              key={lv}
              className="border-2 border-border rounded-xl bg-surface shadow-sm p-4"
            >
              <div className="flex justify-between items-center mb-3">
                <strong>{LEVEL_LABEL[lv] ?? lv}</strong>
                <span className="bg-accent/10 text-accent py-0.5 px-2 rounded-md text-sm font-bold">{list.length} sentences</span>
              </div>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
              >
                {list.map((item, i) => (
                  <Link
                    key={item.id}
                    href={`/toeic/dictation/${item.id}`}
                    className="rounded-lg text-ink border-2 border-border flex justify-between items-center text-[13px]"
                    style={{
                      padding: 10,
                      background: "var(--surface-hover)",
                      textDecoration: "none",
                    }}
                  >
                    <span>#{i + 1}</span>
                    <span className="bg-accent/10 text-accent py-0.5 px-2 inline-block">{item.topic}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
