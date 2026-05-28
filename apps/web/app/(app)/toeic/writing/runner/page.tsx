"use client";

import { toast } from "sonner";

import { ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";

type Prompt = {
  id: string;
  questionNumber: number;
  type: "q1_5_picture" | "q6_7_email" | "q8_opinion";
  imageUrl: string | null;
  mandatoryWords: string[] | null;
  emailSubject: string | null;
  emailBody: string | null;
  emailRequirements: string[] | null;
  topic: string | null;
  topicVi: string | null;
  prepSeconds: number;
  writeSeconds: number;
  maxScore: number;
};

const TYPE_LABEL: Record<Prompt["type"], string> = {
  q1_5_picture: "Q1-5 · Describe a Picture",
  q6_7_email: "Q6-7 · Respond to an Email Request",
  q8_opinion: "Q8 · Opinion essay",
};

export default function WritingRunnerPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    (async () => {
      try {
        const r = await api.post<{ sessionId: string; prompts: Prompt[] }>(
          "/toeic-writing/start",
          {},
        );
        setSessionId(r.sessionId);
        setPrompts(r.prompts);
        startedAt.current = Date.now();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to start");
      }
    })();
  }, []);

  useEffect(() => {
    startedAt.current = Date.now();
    setText("");
    setElapsed(0);
  }, [idx]);

  useEffect(() => {
    if (prompts.length === 0) return;
    const tick = () => setElapsed(Date.now() - startedAt.current);
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [prompts.length]);

  const current = prompts[idx];
  const remaining = current ? Math.max(0, current.writeSeconds * 1000 - elapsed) : 0;

  useEffect(() => {
    if (current && elapsed >= current.writeSeconds * 1000 && !submitting) {
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  const submit = async () => {
    if (!sessionId || !current || submitting) return;
    setSubmitting(true);
    try {
      await api.post("/toeic-writing/submit-response", {
        sessionId,
        promptId: current.id,
        text,
        durationMs: elapsed,
      });
      if (idx + 1 >= prompts.length) {
        setCompleting(true);
        await api.post("/toeic-writing/complete", { sessionId });
        router.push(`/toeic/writing/${sessionId}/result`);
      } else {
        setIdx(idx + 1);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    }
    setSubmitting(false);
  };

  const skipQuestion = () => {
    if (
      window.confirm(
        "Skip this question?\n\nYou will receive 0 points for this question. Continue?",
      )
    ) {
      void submit();
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive mb-3">{error}</div>
        <button
          className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm"
          onClick={() => router.push("/toeic/writing")}
        >
          Back to Hub
        </button>
      </div>
    );
  }
  if (!current) {
    return <div className="p-6">{completing ? "Scoring essay..." : "Loading..."}</div>;
  }

  const minRemaining = Math.floor(remaining / 60000);
  const secRemaining = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 grid gap-3 w-[800px]">
        <div className="flex justify-between items-center">
          <span className="bg-red-500/15 text-red-600 py-0.5 px-2 inline-block">
            ⏱ {minRemaining}:{String(secRemaining).padStart(2, "0")}
          </span>
          <span className="text-text-muted">Max {current.maxScore} points</span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.round((elapsed / (current.writeSeconds * 1000)) * 100)}%`,
              background: remaining < 60000 ? "var(--error)" : "var(--accent)",
            }}
          />
        </div>

        {current.type === "q1_5_picture" && (
          <>
            {current.imageUrl && (
              <img
                loading="lazy"
                decoding="async"
                src={current.imageUrl}
                alt=""
                className="h-[300px] rounded-lg"
                style={{ maxWidth: "100%" }}
              />
            )}
            <Card
              shadowSize="sm"
              className="border-2 border-border"
              style={{ background: "color-mix(in srgb, var(--accent) 8%, var(--surface))" }}
            >
              <div className="text-[13px] text-text-muted">
                Write ONE sentence describing the picture, using both of these words:
              </div>
              <div className="mt-1.5">
                {(current.mandatoryWords ?? []).map((w) => (
                  <span
                    key={w}
                    className="text-sm bg-amber-500/15 text-amber-600 py-0.5 px-2 inline-block"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </Card>
          </>
        )}

        {current.type === "q6_7_email" && (
          <Card shadowSize="sm" className="p-4">
            <div className="text-[13px] text-text-muted">Subject</div>
            <div className="font-semibold mb-2">{current.emailSubject}</div>
            <div className="mb-3" style={{ whiteSpace: "pre-wrap" }}>
              {current.emailBody}
            </div>
            <div className="text-[13px] text-text-muted mb-1">Requirements:</div>
            <ul style={{ marginTop: 0 }}>
              {(current.emailRequirements ?? []).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Card>
        )}

        {current.type === "q8_opinion" && (
          <Card shadowSize="sm" className="p-4">
            <div className="text-[13px] text-text-muted">Topic</div>
            <div className="text-base font-medium mt-1">{current.topic}</div>
            {current.topicVi && (
              <div className="text-text-muted text-[13px] mt-1">{current.topicVi}</div>
            )}
            <div className="mt-2 text-xs text-text-muted">
              Goal: ≥300 words · clear structure (intro / body arguments / conclusion)
            </div>
          </Card>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            void toast.warning(
              "Pasting is disabled — please type your response manually to practice writing.",
            );
          }}
          rows={current.type === "q8_opinion" ? 14 : current.type === "q6_7_email" ? 8 : 3}
          placeholder="Type your answer here..."
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button
            className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm"
            onClick={skipQuestion}
            disabled={submitting}
          >
            Skip
          </button>
          <button
            className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm"
            disabled={!text.trim()}
            onClick={submit}
          >
            {idx + 1 === prompts.length ? "Submit Test" : "Next Question"}
          </button>
        </div>
      </div>
    </div>
  );
}
