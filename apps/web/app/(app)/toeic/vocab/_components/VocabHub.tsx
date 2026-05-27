"use client";

import { Card, Progress, Tag } from "antd";
import { AlertTriangle, BookOpen } from "lucide-react";
import Link from "next/link";

type Pack = { topic: string; label: string; total: number; learned: number };

export function VocabHub({ packs, dueCount }: { packs: Pack[]; dueCount: number }) {
  return (
    <div className="grid gap-4">
      {/* Due review banner */}
      <Card size="small">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-text-muted">
              <AlertTriangle /> Due for review today
            </div>
            <div className="text-[28px] font-bold">{dueCount} words</div>
          </div>
          {dueCount > 0 ? (
            <Link
              href="/toeic/vocab/learn?mode=review"
              className="py-2 px-4 rounded-lg"
              style={{ background: "var(--error)", color: "#fff", textDecoration: "none" }}
            >
              Review Now
            </Link>
          ) : (
            <Tag>Review completed today</Tag>
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
          return (
            <Link
              key={p.topic}
              href={`/toeic/vocab/learn?pack=${encodeURIComponent(p.topic)}&mode=new`}
              style={{ textDecoration: "none" }}
            >
              <Card hoverable size="small" className="h-full">
                <div className="flex items-center gap-2 text-base">
                  <BookOpen />
                  <span>{p.label}</span>
                </div>
                <div className="text-[13px] text-text-muted mt-1.5">
                  {p.learned} / {p.total} words
                </div>
                <Progress
                  percent={pct}
                  size="small"
                  showInfo={false}
                  strokeColor={
                    pct < 30 ? "var(--error)" : pct < 70 ? "var(--warning)" : "var(--success)"
                  }
                />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
