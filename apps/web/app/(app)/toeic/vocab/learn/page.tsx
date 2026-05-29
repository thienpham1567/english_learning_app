"use client";

import { BookOpenText, CheckCircle, MapPin } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { useRoadmap } from "@/lib/curriculum/roadmap-context";
import { getUnitIdForVocabTopic, getVocabRoadmapWeek } from "@/lib/curriculum/vocab-mapping";
import { Card } from "@/components/ui/card";

type VocabWord = {
  id: string;
  word: string;
  pos: string;
  ipa: string | null;
  meaningEn: string;
  meaningVi: string;
  exampleEn: string | null;
  exampleVi: string | null;
  topic: string;
  level: string;
};

type Progress = {
  status: string;
  dueAt: string;
  attemptCount: number;
  easeFactor: number;
};

function LearnRunner() {
  const router = useRouter();
  const params = useSearchParams();
  const pack = params.get("pack");
  const mode = (params.get("mode") ?? "new") as "new" | "review";
  const { completeUnit } = useRoadmap();

  const [words, setWords] = useState<VocabWord[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    const load = async () => {
      if (mode === "review") {
        const r = await api.get<{ words: VocabWord[] }>("/toeic-vocab/due");
        setWords(r.words.slice(0, 20));
      } else if (pack) {
        const r = await api.get<{ words: VocabWord[]; progress: Record<string, Progress> }>(
          `/toeic-vocab/pack/${encodeURIComponent(pack)}`,
        );
        setProgress(r.progress);
        const newWords = r.words.filter((w) => !r.progress[w.id]);
        setWords(newWords.slice(0, 15));
      }
      startTime.current = Date.now();
    };
    void load();
  }, [pack, mode]);

  const current = words[idx];
  const total = words.length;

  const submit = async (outcome: "again" | "hard" | "good" | "easy") => {
    if (!current || submitting) return;
    setSubmitting(true);
    try {
      await api.post("/toeic-vocab/review", {
        wordId: current.id,
        outcome,
        durationMs: Date.now() - startTime.current,
      });
      setStats((s) => ({ ...s, [outcome]: s[outcome] + 1 }));
    } catch (e) {
      console.warn("vocab review failed", e);
    }
    setSubmitting(false);
    if (idx + 1 >= words.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setRevealed(false);
      startTime.current = Date.now();
    }
  };

  if (words.length === 0) {
    return <div className="p-6">Loading vocabulary... (or empty pack)</div>;
  }
  if (done) {
    // Auto-complete roadmap unit for this vocab pack
    const roadmapWeek = pack ? getVocabRoadmapWeek(pack) : null;
    const unitId = pack ? getUnitIdForVocabTopic(pack) : null;
    if (unitId) completeUnit(unitId);

    return (
      <Card shadowSize="sm" className="p-6 max-w-[500px] mx-auto">
        <div className="text-center mb-4">
          <CheckCircle size={36} className="text-success mx-auto mb-2" />
          <div className="text-2xl font-black text-text-primary">Completed!</div>
        </div>
        <div className="flex gap-2 justify-center flex-wrap mb-4">
          <span className="bg-error/10 text-error py-1 px-3 rounded-lg text-sm font-bold">
            Again: {stats.again}
          </span>
          <span className="bg-warning/10 text-warning py-1 px-3 rounded-lg text-sm font-bold">
            Hard: {stats.hard}
          </span>
          <span className="bg-success/10 text-success py-1 px-3 rounded-lg text-sm font-bold">
            Good: {stats.good}
          </span>
          <span className="bg-info/10 text-info py-1 px-3 rounded-lg text-sm font-bold">
            Easy: {stats.easy}
          </span>
        </div>
        {roadmapWeek && (
          <a
            href={`/roadmap/week/${roadmapWeek.weekNumber}`}
            className="no-underline flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl border-2 border-success/30 bg-success/8 text-xs font-bold text-success hover:bg-success/12 transition-colors mb-4"
          >
            <MapPin size={12} />
            Roadmap Week {roadmapWeek.weekNumber} — vocab unit auto-completed ✓
          </a>
        )}
        <div className="text-center">
          <button
            className="py-2.5 px-5 rounded-xl border-none bg-accent text-[var(--text-on-accent)] font-extrabold text-sm cursor-pointer shadow-sm"
            onClick={() => router.push("/toeic/vocab")}
          >
            Back to Vocab Hub
          </button>
        </div>
      </Card>
    );
  }
  if (!current) return null;

  return (
    <div className="grid gap-3 w-[600px] mx-auto">
      <div className="flex justify-between text-text-muted text-sm px-1">
        <span>
          Word {idx + 1} / {total}
        </span>
        <span className="bg-accent/10 text-accent py-0.5 px-2 inline-block rounded-md font-bold">
          {current.topic}
        </span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${Math.round((idx / total) * 100)}%` }}
        />
      </div>

      <Card shadowSize="sm" className="p-6">
        <div className="text-center">
          <div className="text-4xl font-bold">{current.word}</div>
          {current.ipa && (
            <div className="text-text-muted mt-1 font-mono">
              {current.ipa}{" "}
              <span className="bg-accent/10 text-accent py-0.5 px-2 inline-block rounded-md font-bold font-sans ml-1 text-xs">
                {current.pos}
              </span>
            </div>
          )}
        </div>

        {!revealed ? (
          <div className="text-center mt-6">
            <button
              className="py-2.5 px-5 rounded-xl border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm hover:translate-y-[-1px] active:translate-y-0 transition-transform"
              onClick={() => setRevealed(true)}
            >
              Show Meaning
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <div className="text-lg font-medium border-t-2 border-border/10 pt-4">
              {current.meaningVi}
            </div>
            <div className="text-text-muted mt-1">{current.meaningEn}</div>
            {current.exampleEn && (
              <div className="mt-3 p-3 bg-surface-alt rounded-lg border-2 border-border/10">
                <div className="italic">{current.exampleEn}</div>
                {current.exampleVi && (
                  <div className="text-text-muted text-[13px] mt-1">{current.exampleVi}</div>
                )}
              </div>
            )}
            <div className="grid gap-2 mt-6" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              <button
                className="py-2 px-3 rounded-lg border-2 border-border bg-error text-white font-bold text-xs cursor-pointer shadow-sm hover:translate-y-[-1px] active:translate-y-0 transition-transform"
                disabled={submitting}
                onClick={() => submit("again")}
              >
                Again
              </button>
              <button
                className="py-2 px-3 rounded-lg border-2 border-border bg-warning text-black font-bold text-xs cursor-pointer shadow-sm hover:translate-y-[-1px] active:translate-y-0 transition-transform"
                disabled={submitting}
                onClick={() => submit("hard")}
              >
                Hard
              </button>
              <button
                className="py-2 px-3 rounded-lg border-2 border-border bg-success text-white font-bold text-xs cursor-pointer shadow-sm hover:translate-y-[-1px] active:translate-y-0 transition-transform"
                disabled={submitting}
                onClick={() => submit("good")}
              >
                Good
              </button>
              <button
                className="py-2 px-3 rounded-lg border-2 border-border bg-secondary text-white font-bold text-xs cursor-pointer shadow-sm hover:translate-y-[-1px] active:translate-y-0 transition-transform"
                disabled={submitting}
                onClick={() => submit("easy")}
              >
                Easy
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function VocabLearnPage() {
  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 flex-1 flex justify-center items-start pt-12">
        <Suspense fallback={<div>Loading…</div>}>
          <LearnRunner />
        </Suspense>
      </div>
    </div>
  );
}
