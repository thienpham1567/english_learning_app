import { db, toeicDictationItem } from "@repo/database";
import { asc } from "drizzle-orm";
import { ArrowRight, Headphones } from "lucide-react";
import Link from "next/link";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { RoadmapBanner } from "@/components/shared/RoadmapBanner";
import { Card } from "@/components/ui/card";

const LEVEL_META: Record<string, { label: string; color: string; bgClass: string; borderClass: string; textClass: string }> = {
  beginner: {
    label: "Beginner",
    color: "var(--success)",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    textClass: "text-emerald-600",
  },
  intermediate: {
    label: "Intermediate",
    color: "var(--warning)",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    textClass: "text-amber-600",
  },
  advanced: {
    label: "Advanced",
    color: "var(--error)",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/20",
    textClass: "text-red-500",
  },
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
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-auto">
      <div className="p-5 pb-16 max-w-[900px] mx-auto w-full flex flex-col gap-5">
        <RoadmapBanner />
        {["beginner", "intermediate", "advanced"].map((lv) => {
          const list = grouped[lv] ?? [];
          if (list.length === 0) return null;
          const meta = LEVEL_META[lv] ?? LEVEL_META.beginner;

          return (
            <Card
              key={lv}
              shadowSize="sm"
              className="p-0 overflow-hidden"
            >
              {/* Section header */}
              <div className="px-5 py-3.5 border-b-2 border-border bg-surface-alt flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg grid place-items-center ${meta.bgClass} border ${meta.borderClass}`}
                  >
                    <Headphones size={16} className={meta.textClass} />
                  </div>
                  <h3 className="text-sm font-black text-ink font-display uppercase tracking-wider m-0">
                    {meta.label}
                  </h3>
                </div>
                <span
                  className={`text-[10px] font-extrabold rounded-lg ${meta.bgClass} ${meta.textClass} border ${meta.borderClass} px-2.5 py-0.5`}
                >
                  {list.length} sentences
                </span>
              </div>

              {/* Items grid */}
              <div className="p-4">
                <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
                  {list.map((item, i) => (
                    <Link
                      key={item.id}
                      href={`/toeic/dictation/${item.id}`}
                      className="no-underline group"
                    >
                      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border-2 border-border bg-surface-alt hover:border-accent hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150 cursor-pointer">
                        <span className="text-xs font-black text-text-muted font-mono">
                          #{i + 1}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold rounded-lg ${meta.bgClass} ${meta.textClass} border ${meta.borderClass} px-2 py-0.5 truncate max-w-[100px]`}
                        >
                          {item.topic}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
