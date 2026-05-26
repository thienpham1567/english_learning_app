"use client";

import { Button, Card, Input, Tag } from "antd";
import { Headphones, PauseCircle, PlayCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
        <Card>
          <div className="flex items-center gap-3">
            <Button
              icon={playing ? <PauseCircle /> : <PlayCircle />}
              onClick={togglePlay}
              size="large"
            >
              {playing ? "Pause" : `Phát (${playCount})`}
            </Button>
            <span className="text-text-muted text-[13px]">Nghe nhiều lần tùy ý</span>
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
          <Card title="Chép lại đoạn nghe được">
            <Input.TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              autoFocus
              placeholder="Type what you hear…"
            />
            <Button
              type="primary"
              size="large"
              loading={submitting}
              disabled={!text.trim()}
              onClick={submit}
              className="mt-3"
            >
              Nộp bài
            </Button>
          </Card>
        ) : (
          <>
            <Card>
              <div className="text-3xl font-bold">
                {result.score}/100 ({result.matched}/{result.total} từ đúng)
              </div>
            </Card>
            <Card title="So sánh từng từ" size="small">
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
                <span className="text-emerald-500">● đúng</span> ·{" "}
                <span className="text-destructive">● thiếu</span> ·{" "}
                <span style={{ color: "var(--warning)" }}>● thừa</span>
              </div>
            </Card>
            <Card title="Bản gốc" size="small">
              <div className="text-base">{result.transcript}</div>
              {result.vocabHints && result.vocabHints.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {result.vocabHints.map((h) => (
                    <Tag key={h.word} color="blue">
                      {h.word} = {h.vi}
                    </Tag>
                  ))}
                </div>
              )}
            </Card>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/toeic/dictation")}>Về danh sách</Button>
              <Button
                type="primary"
                onClick={() => {
                  setText("");
                  setResult(null);
                  setPlayCount(0);
                  startTime.current = Date.now();
                }}
              >
                Làm lại câu này
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
