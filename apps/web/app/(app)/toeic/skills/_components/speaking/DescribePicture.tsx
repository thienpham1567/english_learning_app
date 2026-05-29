"use client";

import {
  CheckCircle,
  Image as ImageIcon,
  Info,
  Loader2,
  Mic,
  Pause,
  RefreshCw,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Waveform } from "@/components/speaking/Waveform";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { api } from "@/lib/api-client";

const PICTURES = [
  {
    id: "photo-1497366216548-37526070297c",
    scene: "Office meeting room",
    tags: ["business", "meeting"],
    keyElements: ["people sitting around a table", "laptop computers", "presentation screen"],
  },
  {
    id: "photo-1555396273-367ea4eb4db5",
    scene: "Restaurant dining",
    tags: ["food", "restaurant"],
    keyElements: ["waitstaff serving food", "dining tables", "customers eating"],
  },
  {
    id: "photo-1517248135467-4c7edcad34c4",
    scene: "Restaurant interior",
    tags: ["dining", "indoor"],
    keyElements: ["wooden tables", "dim lighting", "wine glasses"],
  },
  {
    id: "photo-1573497019940-1c28c88b4f3e",
    scene: "Construction site",
    tags: ["construction", "outdoor"],
    keyElements: ["workers wearing helmets", "building framework", "construction equipment"],
  },
  {
    id: "photo-1436491865332-7a61a109db05",
    scene: "Airport terminal",
    tags: ["travel", "airport"],
    keyElements: ["passengers with luggage", "departure board", "check-in counters"],
  },
  {
    id: "photo-1441986300917-64674bd600d8",
    scene: "Retail store",
    tags: ["shopping", "indoor"],
    keyElements: ["shelves with products", "customer browsing", "store clerk"],
  },
  {
    id: "photo-1503676260728-1c00da094a0b",
    scene: "Classroom",
    tags: ["education", "indoor"],
    keyElements: ["students at desks", "teacher at whiteboard", "books and notebooks"],
  },
  {
    id: "photo-1571019613454-1cb2f99b2d8b",
    scene: "Gym workout",
    tags: ["fitness", "indoor"],
    keyElements: ["people exercising", "gym equipment", "weights and machines"],
  },
  {
    id: "photo-1506905925346-21bda4d32df4",
    scene: "Mountain landscape",
    tags: ["nature", "outdoor"],
    keyElements: ["snow-capped mountains", "hiking trail", "clear blue sky"],
  },
  {
    id: "photo-1544620347-c4fd4a3d5957",
    scene: "City bus",
    tags: ["transport", "urban"],
    keyElements: ["passengers sitting", "driver at wheel", "bus interior"],
  },
  {
    id: "photo-1559136555-9303baea8ebd",
    scene: "Farmers market",
    tags: ["outdoor", "food"],
    keyElements: [
      "fresh produce on display",
      "vendor and customers",
      "colorful fruits and vegetables",
    ],
  },
  {
    id: "photo-1521737711867-e3b97375f902",
    scene: "Team collaboration",
    tags: ["business", "teamwork"],
    keyElements: ["coworkers discussing", "sticky notes on board", "standing around table"],
  },
];

type FeedbackResult = {
  pronunciation: number;
  intonation: number;
  grammar: number;
  vocabulary: number;
  overall: number;
  transcript: string;
  summary: string;
  improvements: string[];
};
type PageState = "gallery" | "viewing" | "recording" | "evaluating" | "result";

function CircularProgress({
  percent,
  size = 100,
  strokeWidth = 8,
  color = "var(--accent)",
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-bg-deep"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset }}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-ink leading-none">{percent}</span>
        <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider mt-1">
          Overall
        </span>
      </div>
    </div>
  );
}

export function DescribePicture() {
  const [state, setState] = useState<PageState>("gallery");
  const [selectedPic, setSelectedPic] = useState<(typeof PICTURES)[0] | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const isEvaluatingRef = useRef(false);
  const voice = useVoiceInput({ autoTranscribe: false });

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const imgUrl = (id: string) =>
    `https://images.unsplash.com/${id}?w=600&h=400&fit=crop&auto=format&q=80`;

  const selectPicture = (pic: (typeof PICTURES)[0]) => {
    setSelectedPic(pic);
    setFeedback(null);
    setError(null);
    setState("viewing");
  };

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      await voice.start();
      setState("recording");
      setTimeLeft(45);
      timerRef.current = setInterval(() => {
        setTimeLeft((p) => {
          if (p <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    } catch {
      setError("Cannot access microphone.");
    }
  }, [voice]);

  const stopRecording = useCallback(() => {
    if (state !== "recording") return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    voice.stop();
  }, [voice, state]);

  useEffect(() => {
    if (state === "recording" && timeLeft === 0 && timerRef.current === null) stopRecording();
  }, [state, timeLeft, stopRecording]);

  useEffect(() => {
    if (state !== "recording" || !voice.blob || isEvaluatingRef.current || !selectedPic) return;
    isEvaluatingRef.current = true;
    setState("evaluating");
    const fd = new FormData();
    fd.append("audio", voice.blob, "recording.webm");
    fd.append("scene", selectedPic.scene);
    fd.append("keyElements", JSON.stringify(selectedPic.keyElements));
    fd.append("durationMs", String(Math.round(voice.durationMs)));
    api
      .post<FeedbackResult>("/toeic-speaking/describe-picture", fd)
      .then((r) => {
        if (isMountedRef.current) {
          setFeedback(r);
          setState("result");
        }
      })
      .catch(() => {
        if (isMountedRef.current) {
          setError("Error evaluating response.");
          setState("viewing");
        }
      })
      .finally(() => {
        isEvaluatingRef.current = false;
      });
  }, [state, voice.blob, voice.durationMs, selectedPic]);

  const retry = () => {
    setFeedback(null);
    setState("viewing");
  };
  const backToGallery = () => {
    setSelectedPic(null);
    setFeedback(null);
    setState("gallery");
  };
  const scoreColor = (s: number) =>
    s >= 80 ? "var(--success)" : s >= 50 ? "var(--warning)" : "var(--error)";
  const formatTime = (s: number) => `0:${String(s).padStart(2, "0")}`;

  return (
    <>
      {error && (
        <div className="mx-3.5 mb-4 rounded-xl border-2 border-error/30 bg-error/10 px-4 py-2.5 text-xs text-error">
          {error}
        </div>
      )}

      {/* GALLERY */}
      {state === "gallery" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-3 shadow-xs">
              <ImageIcon className="h-6 w-6" />
            </div>
            <h3 className="m-0 mb-1.5 text-lg font-bold font-display text-ink">
              Select an Image to Describe
            </h3>
            <p className="m-0 text-xs text-text-muted font-bold max-w-sm mx-auto leading-relaxed">
              You will have 45 seconds to describe the picture in English. The AI will evaluate your
              pronunciation, grammar, and content.
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            {PICTURES.map((pic, i) => (
              <button
                key={pic.id}
                onClick={() => selectPicture(pic)}
                className="p-0 border-2 border-border rounded-2xl bg-surface overflow-hidden cursor-pointer text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 shadow-xs active:scale-98 block group"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl(pic.id)}
                  alt={pic.scene}
                  className="w-full aspect-3/2 object-cover block transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="p-3">
                  <div className="text-xs font-bold text-ink">{pic.scene}</div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {pic.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-none text-[9px] font-black tracking-widest uppercase bg-surface-alt border-2 border-border text-text-secondary"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIEWING / RECORDING / EVALUATING */}
      {selectedPic && (state === "viewing" || state === "recording" || state === "evaluating") && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            className={`rounded-2xl overflow-hidden border ${
              state === "recording" ? "border-error ring-2 ring-error/20" : "border-border"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgUrl(selectedPic.id)}
              alt={selectedPic.scene}
              className="w-full aspect-3/2 object-cover block"
            />
          </div>
          {state === "recording" && (
            <>
              <div className="text-center">
                <div
                  className={`text-4xl font-extrabold font-display tabular-nums ${
                    timeLeft <= 10 ? "text-error" : "text-ink"
                  }`}
                >
                  {formatTime(timeLeft)}
                </div>
                <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider font-bold">
                  Time Remaining
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-surface border-2 border-border">
                <Waveform getStream={voice.getStream} active={true} />
              </div>
            </>
          )}
          {state === "viewing" && (
            <div className="p-4 rounded-xl bg-surface-alt border-2 border-border text-xs text-text-secondary leading-relaxed shadow-sm">
              <p className="m-0 mb-1.5 font-bold text-info flex items-center gap-1.5">
                <Info className="h-4 w-4 shrink-0" />
                <span>Image Description Tips:</span>
              </p>
              <ul className="m-0 pl-4.5 flex flex-col gap-1 list-disc">
                <li>Start: &ldquo;In this picture, I can see...&rdquo;</li>
                <li>Describe from overview to specific details</li>
                <li>Use present continuous for actions (e.g. &ldquo;people are talking&rdquo;)</li>
              </ul>
            </div>
          )}
          <div className="text-center flex flex-col items-center justify-center gap-2">
            {state === "viewing" && (
              <>
                <button
                  onClick={startRecording}
                  className="w-[72px] h-[72px] rounded-full border-none bg-linear-to-br from-red-500 to-red-600 text-white flex items-center justify-center text-2xl cursor-pointer shadow-lg shadow-red-500/20 hover:opacity-90 active:scale-95 transition-all"
                >
                  <Mic className="h-7 w-7" />
                </button>
                <p className="text-xs text-text-muted mt-1 font-semibold">
                  Press to start describing (45s)
                </p>
                <button
                  onClick={backToGallery}
                  className="mt-1 px-4 py-2 rounded-xl border-2 border-border bg-surface text-text-secondary hover:text-ink hover:bg-surface-hover hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-xs font-bold cursor-pointer"
                >
                  ← Choose another image
                </button>
              </>
            )}
            {state === "recording" && (
              <>
                <button
                  onClick={stopRecording}
                  className="w-[72px] h-[72px] rounded-full border-3 border-error bg-surface text-error flex items-center justify-center text-xl cursor-pointer animate-pulse hover:opacity-90 active:scale-95 transition-all"
                >
                  <Pause className="h-6 w-6 fill-current" />
                </button>
                <p className="text-xs text-error mt-1 font-bold">Recording...</p>
              </>
            )}
            {state === "evaluating" && (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 className="h-8 w-8 text-accent animate-spin" />
                <p className="text-xs text-text-muted mt-2 font-bold">Scoring and evaluating...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESULT */}
      {state === "result" && feedback && selectedPic && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="rounded-2xl overflow-hidden border-2 border-border max-h-[160px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgUrl(selectedPic.id)}
              alt={selectedPic.scene}
              className="w-full object-cover block"
            />
          </div>

          <div className="p-6 rounded-2xl bg-surface border-2 border-border text-center flex flex-col items-center shadow-xs">
            <CircularProgress percent={feedback.overall} color={scoreColor(feedback.overall)} />
            <div className="flex justify-center gap-6 mt-5 flex-wrap w-full border-t-2 border-border pt-4">
              {[
                { label: "Pronunciation", score: feedback.pronunciation },
                { label: "Intonation", score: feedback.intonation },
                { label: "Grammar", score: feedback.grammar },
                { label: "Vocabulary", score: feedback.vocabulary },
              ].map((s) => (
                <div key={s.label} className="flex-1 min-w-[70px]">
                  <p className="text-[10px] text-text-muted m-0 font-bold uppercase tracking-wider">
                    {s.label}
                  </p>
                  <p
                    className="text-base font-extrabold m-0 mt-1 font-display"
                    style={{ color: scoreColor(s.score) }}
                  >
                    {s.score}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {feedback.summary && (
            <div className="p-4.5 rounded-2xl bg-surface border-2 border-border">
              <p className="text-xs text-ink leading-relaxed m-0 font-medium">{feedback.summary}</p>
            </div>
          )}

          {feedback.improvements?.length > 0 && (
            <div className="p-4.5 rounded-2xl bg-surface border-2 border-border">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-accent m-0 mb-2.5 flex items-center gap-1.5">
                <Volume2 className="h-4 w-4 shrink-0" />
                <span>Areas to Improve</span>
              </p>
              <ul className="m-0 pl-4.5 text-xs text-text-secondary leading-relaxed flex flex-col gap-1 list-disc font-bold">
                {feedback.improvements.map((imp, i) => (
                  <li key={i}>{imp}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.transcript && (
            <div className="p-4.5 rounded-2xl bg-surface-alt border-2 border-border shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted m-0 mb-1.5">
                You said:
              </p>
              <p className="text-xs italic leading-relaxed text-text-secondary m-0">
                &ldquo;{feedback.transcript}&rdquo;
              </p>
            </div>
          )}

          <div className="flex gap-2.5 justify-center mt-2">
            <button
              onClick={retry}
              className="px-5 py-2.5 rounded-xl border-2 border-border bg-surface text-text-secondary hover:text-ink hover:bg-surface-hover hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-xs font-bold cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={backToGallery}
              className="px-5 py-2.5 rounded-xl border-2 border-border bg-accent text-ink shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-xs font-bold cursor-pointer flex items-center gap-1.5"
            >
              <span>Choose another</span>
              <CheckCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
