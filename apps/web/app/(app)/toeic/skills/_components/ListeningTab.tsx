"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Trophy, BarChart2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { useListeningExercise } from "@/hooks/useListeningExercise";
import { useExamMode } from "@/components/shared/ExamModeProvider";
import { LevelSelector } from "@/app/(app)/listening/_components/LevelSelector";
import { AudioPlayer } from "@/app/(app)/listening/_components/AudioPlayer";
import { QuestionCards } from "@/app/(app)/listening/_components/QuestionCards";
import { Results } from "@/app/(app)/listening/_components/Results";
import { DialogueGenerator } from "@/app/(app)/listening/_components/DialogueGenerator";
import { SpeakerLegend } from "@/app/(app)/listening/_components/SpeakerLegend";
import { ScriptPanel } from "@/app/(app)/listening/_components/ScriptPanel";
import type { CefrLevel } from "@/lib/listening/types";
import { motion } from "motion/react";

export function ListeningTab() {
  const {
    state, exercise, result, error, selectedAnswers,
    replaysUsed, maxReplays, selectedSpeed, allAnswered,
    scriptRevealed, revealScript, generate, generateDialogue,
    selectAnswer, submit, useReplay, cycleSpeed, reset,
  } = useListeningExercise();

  const { examMode } = useExamMode();
  const [profileRecommendedLevel, setProfileRecommendedLevel] = useState<CefrLevel | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("austin");

  const skillLevelUp = result?.skill ? { cefr: result.skill.cefr, levelUp: result.skill.levelUp } : null;

  useEffect(() => {
    api.get<{ cefr?: string }>("/skill-profile", { params: { module: "listening" } })
      .then((data) => { if (data?.cefr) setProfileRecommendedLevel(data.cefr as CefrLevel); })
      .catch(() => {});
  }, []);

  const recommendedLevel = (result?.skill?.cefr as CefrLevel | undefined) ?? profileRecommendedLevel;
  const [mode, setMode] = useState<"free" | "parts">("free");

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Mode toggle */}
      <div className="flex gap-2 py-2 pb-3.5 flex-wrap">
        {[
          { key: "free" as const, label: "🎧 Luyện nghe tự do" },
          { key: "parts" as const, label: "📋 TOEIC Parts 1–4" },
        ].map(m => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all duration-150 active:scale-97 ${
              mode === m.key
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-slate-400 hover:border-slate-800 hover:text-slate-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* TOEIC Parts overview */}
      {mode === "parts" && (
        <div className="flex flex-col gap-3 pb-5 animate-in fade-in duration-200">
          {[
            { part: "Part 1", title: "Photographs", desc: "Nghe 4 mô tả, chọn mô tả đúng nhất cho bức hình", questions: 6, tips: "Nhìn hình trước khi audio bắt đầu. Chú ý chủ ngữ + hành động." },
            { part: "Part 2", title: "Question-Response", desc: "Nghe câu hỏi, chọn câu trả lời phù hợp nhất", questions: 25, tips: "Nghe kỹ Wh-word đầu câu. Loại bỏ đáp án lặp từ (trap)." },
            { part: "Part 3", title: "Conversations", desc: "Nghe hội thoại 2-3 người, trả lời 3 câu hỏi", questions: 39, tips: "Đọc câu hỏi + đáp án TRƯỚC khi audio phát. Chú ý intent & detail." },
            { part: "Part 4", title: "Talks", desc: "Nghe bài nói/thông báo, trả lời 3 câu hỏi", questions: 30, tips: "Tập trung vào purpose, audience, next step. Đọc câu hỏi trước." },
          ].map((p, i) => (
            <div
              key={p.part}
              className="p-4.5 rounded-2xl border border-border bg-surface relative overflow-hidden shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-accent rounded-l-2xl" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-100">{p.part} — {p.title}</span>
                <span className="text-[10px] font-extrabold text-accent px-2.5 py-0.5 rounded-full bg-accent/10">{p.questions} câu</span>
              </div>
              <p className="text-xs text-slate-400 mb-2 leading-relaxed">{p.desc}</p>
              <div className="text-[11px] text-slate-500 p-2 rounded-xl bg-slate-900/40 border border-slate-850/60 leading-relaxed">
                💡 <strong className="text-slate-350">Tip:</strong> {p.tips}
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={() => setMode("free")}
            className="px-6 py-2.5 rounded-xl border-none text-xs font-bold bg-accent text-white hover:bg-accent-hover cursor-pointer self-center mt-3 shadow-sm active:scale-95 transition-all"
          >
            Bắt đầu luyện nghe →
          </button>
        </div>
      )}

      {/* Free practice mode */}
      {mode === "free" && (
        <>
          {error && (
            <div className="flex gap-2 items-center bg-red-950/20 border border-red-900/30 rounded-2xl p-4 text-xs text-red-400 mb-4 animate-in fade-in duration-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Idle: Level Selector */}
          {(state === "idle" || state === "loading") && (
            <div className="space-y-4">
              <LevelSelector
                onStart={(level, type) => generate(level, type, examMode)}
                isLoading={state === "loading"}
                recommendedLevel={recommendedLevel}
              />
              <DialogueGenerator
                isLoading={state === "loading"}
                onStart={({ topic, level, turns, speakers }) =>
                  generateDialogue({ topic, level, turns, speakers, examMode })
                }
              />
            </div>
          )}

          {/* Active: Audio + Questions */}
          {(state === "active" || state === "submitting") && exercise && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              {exercise.turns && exercise.turns.length > 0 && <SpeakerLegend turns={exercise.turns} />}
              
              {(!exercise.turns || exercise.turns.length === 0) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Giọng đọc:</span>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-350 outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="austin">🇺🇸 US Male</option>
                    <option value="autumn">🇺🇸 US Female</option>
                    <option value="daniel">🇬🇧 UK Male</option>
                    <option value="diana">🇬🇧 UK Female</option>
                    <option value="troy">🇦🇺 AU Male</option>
                    <option value="hannah">🇬🇧 AU Female</option>
                  </select>
                </div>
              )}
              
              <AudioPlayer
                audioUrl={`${exercise.audioUrl}?voice=${selectedVoice}`}
                speed={selectedSpeed}
                replaysUsed={replaysUsed}
                maxReplays={maxReplays}
                onReplay={useReplay}
                onCycleSpeed={cycleSpeed}
              />
              
              {exercise.passage && (
                <ScriptPanel
                  passage={exercise.passage}
                  keyPhrases={exercise.keyPhrases}
                  isRevealed={scriptRevealed}
                  onReveal={revealScript}
                />
              )}
              
              <QuestionCards
                questions={exercise.questions}
                selectedAnswers={selectedAnswers}
                onSelectAnswer={selectAnswer}
                onSubmit={submit}
                allAnswered={allAnswered}
                isSubmitting={state === "submitting"}
              />
            </div>
          )}

          {/* Submitted: Results */}
          {state === "submitted" && result && (
            <div className="space-y-4">
              <Results
                result={result}
                onNewExercise={reset}
                dialogueTurns={exercise?.turns}
                scriptRevealed={scriptRevealed}
              />
              
              {skillLevelUp && (
                <div className={`p-4 rounded-2xl border text-center text-xs font-semibold flex items-center justify-center gap-2 ${
                  skillLevelUp.levelUp
                    ? "bg-emerald-950/10 border-emerald-950/20 text-emerald-450"
                    : "bg-amber-950/10 border-amber-950/20 text-amber-450"
                }`}>
                  {skillLevelUp.levelUp ? (
                    <>
                      <Trophy className="h-4 w-4 text-emerald-400 fill-current animate-bounce" />
                      <span>Trình độ nghe được nâng lên: {skillLevelUp.cefr}!</span>
                    </>
                  ) : (
                    <>
                      <BarChart2 className="h-4 w-4 text-amber-400" />
                      <span>Trình độ hiện tại: {skillLevelUp.cefr}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
