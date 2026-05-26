"use client";

import { Button, Card, Progress, Tag } from "antd";
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
    return <div className="p-6">Đang tải từ vựng… (hoặc pack rỗng)</div>;
  }
  if (done) {
    return (
      <Card>
        <div className="text-[28px] font-bold">Hoàn thành!</div>
        <div className="mt-2">
          <Tag color="red">Again: {stats.again}</Tag>
          <Tag color="orange">Hard: {stats.hard}</Tag>
          <Tag color="green">Good: {stats.good}</Tag>
          <Tag color="blue">Easy: {stats.easy}</Tag>
        </div>
        <Button type="primary" onClick={() => router.push("/toeic/vocab")} className="mt-4">
          Về Vocab Hub
        </Button>
      </Card>
    );
  }
  if (!current) return null;

  return (
    <div className="grid gap-3 w-[600px]">
      <div className="flex justify-between text-text-muted text-sm">
        <span>
          Từ {idx + 1} / {total}
        </span>
        <Tag>{current.topic}</Tag>
      </div>
      <Progress percent={Math.round((idx / total) * 100)} showInfo={false} size="small" />

      <Card>
        <div className="text-center">
          <div className="text-4xl font-bold">{current.word}</div>
          {current.ipa && (
            <div className="text-text-muted mt-1">
              {current.ipa} <Tag>{current.pos}</Tag>
            </div>
          )}
        </div>

        {!revealed ? (
          <div className="text-center mt-6">
            <Button type="primary" size="large" onClick={() => setRevealed(true)}>
              Hiện nghĩa
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <div className="text-lg font-medium">{current.meaningVi}</div>
            <div className="text-text-muted mt-1">{current.meaningEn}</div>
            {current.exampleEn && (
              <div className="mt-3 p-3 bg-(--surface) rounded-lg">
                <div className="italic">{current.exampleEn}</div>
                {current.exampleVi && (
                  <div className="text-text-muted text-[13px] mt-1">{current.exampleVi}</div>
                )}
              </div>
            )}
            <div className="grid gap-2 mt-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              <Button danger disabled={submitting} onClick={() => submit("again")}>
                Again
              </Button>
              <Button disabled={submitting} onClick={() => submit("hard")}>
                Hard
              </Button>
              <Button type="primary" disabled={submitting} onClick={() => submit("good")}>
                Good
              </Button>
              <Button disabled={submitting} onClick={() => submit("easy")}>
                Easy
              </Button>
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
      <div className="p-4 flex-1">
        <Suspense fallback={<div>Loading…</div>}>
          <LearnRunner />
        </Suspense>
      </div>
    </div>
  );
}
