"use client";

import { Headphones, PauseCircle, PlayCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";

type Item = {
  id: string;
  audioUrl: string;
  level: string;
  topic: string;
  voice: string;
};

type SubmitResult = {
  score: number;
  matched: number;
  total: number;
  diff: Array<{ type: "match" | "missing" | "extra"; ref?: string; user?: string }>;
  transcript: string;
  vocabHints: Array<{ word: string; vi: string }>;
};

export default function DictationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    void api
      .get<Item>(`/toeic-dictation/${params.id}`)
      .then((data) => {
        setItem(data);
        startTime.current = Date.now();
      })
      .catch(() => router.push("/toeic/dictation"));
  }, [params.id, router]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
      setPlayCount((n) => n + 1);
    } else {
      a.pause();
    }
  };

  const submit = async () => {
    if (!item) return;
    setSubmitting(true);
    try {
      const res = await api.post<SubmitResult>("/toeic-dictation/submit", {
        exerciseId: item.id,
        userTranscript: text,
        durationMs: Date.now() - startTime.current,
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  if (!item) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 grid gap-3 w-[720px]">
        <Card shadowSize="sm" className="p-4">
          <div className="flex items-center gap-3">
            <button className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm flex items-center gap-2"
              onClick={togglePlay}
            >
              {playing ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
              {playing ? "Pause" : `Play (${playCount})`}
            </button>
            <span className="text-text-muted text-[13px]">Listen as many times as you want</span>
          </div>
          <audio
            ref={audioRef}
            src={item.audioUrl}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
        </Card>

        {!result ? (
          <Card shadowSize="sm" className="p-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              autoFocus
              placeholder="Type what you hear…"
             />
            <button
              disabled={!text.trim()}
              onClick={submit}
              className="mt-3"
            >
              Submit
            </button>
          </Card>
        ) : (
          <>
            <Card shadowSize="sm" className="p-4">
              <div className="text-3xl font-bold">
                {result.score}/100 ({result.matched}/{result.total} words correct)
              </div>
            </Card>
            <Card shadowSize="sm" className="p-4">
              <div style={{ lineHeight: 2 }}>
                {result.diff.map((e, i) => (
                  <span
                    key={i}
                    className="mr-1 rounded"
                    style={{
                      padding: "2px 6px",
                      background:
                        e.type === "match"
                          ? "color-mix(in srgb, var(--success) 15%, var(--surface))"
                          : e.type === "missing"
                            ? "color-mix(in srgb, var(--error) 15%, var(--surface))"
                            : "color-mix(in srgb, var(--warning) 15%, var(--surface))",
                      color:
                        e.type === "match"
                          ? "var(--success)"
                          : e.type === "missing"
                            ? "var(--error)"
                            : "var(--warning)",
                      textDecoration: e.type === "extra" ? "line-through" : undefined,
                    }}
                  >
                    {e.ref ?? e.user}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-xs text-text-muted">
                <span className="text-emerald-500">● correct</span> ·{" "}
                <span className="text-destructive">● missing</span> ·{" "}
                <span style={{ color: "var(--warning)" }}>● extra</span>
              </div>
            </Card>
            <Card shadowSize="sm" className="p-4">
              <div className="text-base">{result.transcript}</div>
              {result.vocabHints && result.vocabHints.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {result.vocabHints.map((h) => (
                    <span key={h.word} className="bg-blue-500/15 text-blue-600 py-0.5 px-2 inline-block">
                      {h.word} = {h.vi}
                    </span>
                  ))}
                </div>
              )}
            </Card>
            <div className="flex gap-2">
              <button className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm" onClick={() => router.push("/toeic/dictation")}>Back to List</button>
              <button className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm"
                onClick={() => {
                  setText("");
                  setResult(null);
                  setPlayCount(0);
                  startTime.current = Date.now();
                }}
              >
                Retry
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
