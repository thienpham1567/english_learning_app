"use client";

import { AlertTriangle, BookOpen, MapPin } from "lucide-react";
import Link from "next/link";
import { getVocabRoadmapWeek } from "@/lib/curriculum/vocab-mapping";
import { Card } from "@/components/ui/card";

type Pack = { topic: string; label: string; total: number; learned: number };

export function VocabHub({ packs, dueCount }: { packs: Pack[]; dueCount: number }) {
  return (
    <div className="grid gap-4">
      {/* Due review banner */}
      <Card shadowSize="sm" size="sm">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-text-muted flex items-center gap-1.5">
              <AlertTriangle size={14} /> Due for review today
            </div>
            <div className="text-[28px] font-bold">{dueCount} words</div>
          </div>
          {dueCount > 0 ? (
            <Link
              href="/toeic/vocab/learn?mode=review"
              className="py-2 px-4 rounded-lg text-sm font-bold"
              style={{ background: "var(--error)", color: "#fff", textDecoration: "none" }}
            >
              Review Now
            </Link>
          ) : (
            <span className="bg-accent/10 text-accent py-0.5 px-2 inline-block text-sm font-semibold rounded-md">
              Review completed today
            </span>
          )}
        </div>
      </Card>

      {/* Topic packs grid */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
      >
        {packs.map((p) => {
          const pct = p.total > 0 ? Math.round((p.learned / p.total) * 100) : 0;
          const roadmapWeek = getVocabRoadmapWeek(p.topic);
          return (
            <Link
              key={p.topic}
              href={`/toeic/vocab/learn?pack=${encodeURIComponent(p.topic)}&mode=new`}
              style={{ textDecoration: "none" }}
            >
              <Card
                interactive
                shadowSize="sm"
                size="sm"
                className="h-full hover:border-accent/30"
              >
                <div className="flex items-center gap-2 text-base font-bold text-text-primary">
                  <BookOpen size={16} className="text-accent" />
                  <span className="flex-1">{p.label}</span>
                  {roadmapWeek && (
                    <span className="text-[10px] font-extrabold text-accent/80 bg-accent/8 rounded-md py-0.5 px-2 flex items-center gap-1 shrink-0">
                      <MapPin size={9} /> W{roadmapWeek.weekNumber}
                    </span>
                  )}
                </div>
                <div className="text-[13px] text-text-muted mt-2 font-medium">
                  {p.learned} / {p.total} words · {pct}%
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 100
                        ? "var(--success)"
                        : "linear-gradient(90deg, var(--accent), var(--secondary))",
                    }}
                  />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
