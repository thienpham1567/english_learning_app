"use client";

import { BookOpenText } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";

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
    return (
      <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
        <div className="text-[28px] font-bold">Completed!</div>
        <div className="mt-2">
          <span className="bg-red-500/15 text-red-600 py-0.5 px-2 inline-block">Again: {stats.again}</span>
          <span className="bg-amber-500/15 text-amber-600 py-0.5 px-2 inline-block">Hard: {stats.hard}</span>
          <span className="bg-emerald-500/15 text-emerald-600 py-0.5 px-2 inline-block">Good: {stats.good}</span>
          <span className="bg-blue-500/15 text-blue-600 py-0.5 px-2 inline-block">Easy: {stats.easy}</span>
        </div>
        <button className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm mt-4" onClick={() => router.push("/toeic/vocab")}>
          Back to Vocab Hub
        </button>
      </div>
    );
  }
  if (!current) return null;

  return (
    <div className="grid gap-3 w-[600px]">
      <div className="flex justify-between text-text-muted text-sm">
        <span>
          Word {idx + 1} / {total}
        </span>
        <span className="bg-accent/10 text-accent py-0.5 px-2 inline-block">{current.topic}</span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${Math.round((idx / total) * 100)}%` }} /></div>

      <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
        <div className="text-center">
          <div className="text-4xl font-bold">{current.word}</div>
          {current.ipa && (
            <div className="text-text-muted mt-1">
              {current.ipa} <span className="bg-accent/10 text-accent py-0.5 px-2 inline-block">{current.pos}</span>
            </div>
          )}
        </div>

        {!revealed ? (
          <div className="text-center mt-6">
            <button className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm" onClick={() => setRevealed(true)}>
              Show Meaning
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <div className="text-lg font-medium">{current.meaningVi}</div>
            <div className="text-text-muted mt-1">{current.meaningEn}</div>
            {current.exampleEn && (
              <div className="mt-3 p-3 bg-surface rounded-lg">
                <div className="italic">{current.exampleEn}</div>
                {current.exampleVi && (
                  <div className="text-text-muted text-[13px] mt-1">{current.exampleVi}</div>
                )}
              </div>
            )}
            <div className="grid gap-2 mt-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              <button className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm" disabled={submitting} onClick={() => submit("again")}>
                Again
              </button>
              <button className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm" disabled={submitting} onClick={() => submit("hard")}>
                Hard
              </button>
              <button className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm" disabled={submitting} onClick={() => submit("good")}>
                Good
              </button>
              <button className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm" disabled={submitting} onClick={() => submit("easy")}>
                Easy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VocabLearnPage() {
  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 flex-1">
        <Suspense fallback={<div>Loading…</div>}>
          <LearnRunner />
        </Suspense>
      </div>
    </div>
  );
}
