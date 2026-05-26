"use client";

import type { DialogueTurnPayload, ListeningSubmitResponse } from "@/lib/listening/types";
import { DialogueTranscript } from "@/app/(app)/listening/_components/SpeakerLegend";
import {
  CheckCircle,
  FileText,
  Lightbulb,
  RefreshCw,
  Trophy,
  XCircle,
} from "lucide-react";

type Props = {
  result: ListeningSubmitResponse;
  onNewExercise: () => void;
  dialogueTurns?: DialogueTurnPayload[];
  scriptRevealed?: boolean;
};

export function Results({ result, onNewExercise, dialogueTurns, scriptRevealed }: Props) {
  const percentage = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const isGood = percentage >= 75;

  return (
    <div className="flex flex-col gap-5" >
      {/* Score Card */}
      <div className="rounded-(--radius-lg) p-6 text-center" style={{background: isGood
            ? "color-mix(in srgb, var(--success) 8%, var(--surface))"
            : "color-mix(in srgb, var(--error) 8%, var(--surface))", border: `2px solid ${isGood ? "var(--success)" : "var(--error)"}`}} >
        <div className="font-extrabold" style={{fontSize: 48, color: isGood ? "var(--success)" : "var(--error)"}} >
          {percentage}%
        </div>
        <div className="text-base font-semibold mt-1" style={{color: "var(--text)"}} >
          {result.correct}/{result.total} câu đúng
        </div>
        <div className="items-center gap-1.5 mt-3 py-1.5 px-3.5 rounded-(--radius-sm) text-accent text-[13px] font-bold" style={{display: "inline-flex", background: "var(--accent-surface)"}} >
          <Trophy /> +{result.xpEarned} XP
        </div>
        {scriptRevealed && (
          <div className="items-center gap-1 mt-1.5 rounded-(--radius-sm) text-[11px] font-semibold" style={{display: "inline-flex", padding: "3px 10px", background: "color-mix(in srgb, var(--warning) 10%, transparent)", color: "var(--warning)"}} >
            📖 Đã xem script (-30% XP)
          </div>
        )}
      </div>

      {/* Detailed Results */}
      <div>
        <div className="text-[13px] font-semibold text-text-muted mb-2.5 uppercase" style={{letterSpacing: 1}} >
          Chi tiết kết quả
        </div>
        <div className="flex flex-col gap-2.5" >
          {result.results.map((r, i) => (
            <div
              key={i} className="bg-(--surface)" style={{border: `1px solid ${r.correct ? "color-mix(in srgb, var(--success) 25%, transparent)" : "color-mix(in srgb, var(--error) 25%, transparent)"}`, borderRadius: "var(--radius-md)", padding: 14}} >
              <div className="flex items-center gap-2 mb-2" >
                {r.correct ? (
                  <CheckCircle className="text-emerald-500 text-base" />
                ) : (
                  <XCircle className="text-destructive text-base" />
                )}
                <span className="text-[13px] font-semibold" style={{color: "var(--text)"}} >
                  {i + 1}. {r.question}
                </span>
              </div>
              {!r.correct && (
                <div className="text-xs text-text-muted" style={{marginLeft: 24}} >
                  <span className="text-destructive" style={{textDecoration: "line-through"}} >
                    {r.options[r.userAnswer]}
                  </span>
                  {" → "}
                  <span className="text-emerald-500 font-semibold" >
                    {r.options[r.correctIndex]}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transcript */}
      <div>
        <div className="text-[13px] font-semibold text-text-muted mb-2.5 uppercase" style={{letterSpacing: 1}} >
          <FileText style={{ marginRight: 6 }} /> Nguyên văn
        </div>
        <div className="bg-(--surface) border-2 border-border p-4 text-sm italic" style={{borderRadius: "var(--radius-md)", lineHeight: 1.7, color: "var(--text)"}} >
          {dialogueTurns && dialogueTurns.length > 0 ? (
            <DialogueTranscript turns={dialogueTurns} />
          ) : (
            result.passage
          )}
        </div>
      </div>

      {/* New Exercise Button */}
      <button
        onClick={onNewExercise} className="flex items-center justify-center gap-2.5 border-none text-[15px] font-bold cursor-pointer" style={{padding: "14px 24px", borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "var(--text-on-accent)", transition: "all 0.2s ease"}} >
        <RefreshCw /> Bài mới
      </button>
    </div>
  );
}
