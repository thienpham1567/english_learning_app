"use client";

import { useState, useEffect } from "react";
import { Select } from "antd";
import {
  WarningOutlined,
  TrophyOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
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
    <div style={{ maxWidth: 600, margin: "0 auto", width: "100%" }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, padding: "8px 0 14px", flexWrap: "wrap" }}>
        {[
          { key: "free" as const, label: "🎧 Luyện nghe tự do" },
          { key: "parts" as const, label: "📋 TOEIC Parts 1–4" },
        ].map(m => (
          <button key={m.key} type="button" onClick={() => setMode(m.key)}
            style={{
              padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${mode === m.key ? "var(--accent)" : "var(--border)"}`,
              background: mode === m.key ? "color-mix(in srgb, var(--accent) 10%, var(--surface))" : "var(--surface)",
              color: mode === m.key ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer", transition: "all 0.15s",
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* TOEIC Parts overview */}
      {mode === "parts" && (
        <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 20 }}>
          {[
            { part: "Part 1", title: "Photographs", desc: "Nghe 4 mô tả, chọn mô tả đúng nhất cho bức hình", questions: 6, tips: "Nhìn hình trước khi audio bắt đầu. Chú ý chủ ngữ + hành động." },
            { part: "Part 2", title: "Question-Response", desc: "Nghe câu hỏi, chọn câu trả lời phù hợp nhất", questions: 25, tips: "Nghe kỹ Wh-word đầu câu. Loại bỏ đáp án lặp từ (trap)." },
            { part: "Part 3", title: "Conversations", desc: "Nghe hội thoại 2-3 người, trả lời 3 câu hỏi", questions: 39, tips: "Đọc câu hỏi + đáp án TRƯỚC khi audio phát. Chú ý intent & detail." },
            { part: "Part 4", title: "Talks", desc: "Nghe bài nói/thông báo, trả lời 3 câu hỏi", questions: 30, tips: "Tập trung vào purpose, audience, next step. Đọc câu hỏi trước." },
          ].map((p, i) => (
            <div key={p.part} className={`anim-fade-up anim-delay-${i + 1}`} style={{
              padding: "16px 18px", borderRadius: 14, border: "1px solid var(--border)",
              background: "var(--surface)", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "var(--accent)", borderRadius: "14px 0 0 14px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{p.part} — {p.title}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", padding: "2px 8px", borderRadius: 99, background: "color-mix(in srgb, var(--accent) 8%, var(--surface))" }}>{p.questions} câu</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 8px", lineHeight: 1.5 }}>{p.desc}</p>
              <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "6px 10px", borderRadius: 8, background: "var(--bg-deep)" }}>
                💡 <strong>Tip:</strong> {p.tips}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setMode("free")} style={{
            padding: "12px 20px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600,
            background: "var(--accent)", color: "var(--text-on-accent)", cursor: "pointer",
            alignSelf: "center", marginTop: 4,
          }}>
            Bắt đầu luyện nghe →
          </button>
        </div>
      )}

      {/* Free practice mode (existing) */}
      {mode === "free" && (
        <>
          {error && (
            <div style={{ background: "var(--error-bg)", border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)", borderRadius: "var(--radius-md)", padding: "12px 16px", color: "var(--error)", fontSize: 13, marginBottom: 16 }}>
              <WarningOutlined style={{ marginRight: 6 }} /> {error}
            </div>
          )}

          {/* Idle: Level Selector */}
          {(state === "idle" || state === "loading") && (
            <>
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
            </>
          )}

          {/* Active: Audio + Questions */}
          {(state === "active" || state === "submitting") && exercise && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {exercise.turns && exercise.turns.length > 0 && <SpeakerLegend turns={exercise.turns} />}
              {(!exercise.turns || exercise.turns.length === 0) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Giọng đọc:</span>
                  <Select value={selectedVoice} onChange={setSelectedVoice} size="small" style={{ width: 150 }}
                    options={[
                      { value: "austin", label: "🇺🇸 US Male" }, { value: "autumn", label: "🇺🇸 US Female" },
                      { value: "daniel", label: "🇬🇧 UK Male" }, { value: "diana", label: "🇬🇧 UK Female" },
                      { value: "troy", label: "🇦🇺 AU Male" }, { value: "hannah", label: "🇦🇺 AU Female" },
                    ]}
                  />
                </div>
              )}
              <AudioPlayer audioUrl={`${exercise.audioUrl}?voice=${selectedVoice}`} speed={selectedSpeed} replaysUsed={replaysUsed} maxReplays={maxReplays} onReplay={useReplay} onCycleSpeed={cycleSpeed} />
              {exercise.passage && <ScriptPanel passage={exercise.passage} keyPhrases={exercise.keyPhrases} isRevealed={scriptRevealed} onReveal={revealScript} />}
              <QuestionCards questions={exercise.questions} selectedAnswers={selectedAnswers} onSelectAnswer={selectAnswer} onSubmit={submit} allAnswered={allAnswered} isSubmitting={state === "submitting"} />
            </div>
          )}

          {/* Submitted: Results */}
          {state === "submitted" && result && (
            <>
              <Results result={result} onNewExercise={reset} dialogueTurns={exercise?.turns} scriptRevealed={scriptRevealed} />
              {skillLevelUp && (
                <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: "var(--radius-md)", background: skillLevelUp.levelUp ? "color-mix(in srgb, var(--success) 8%, var(--surface))" : "color-mix(in srgb, var(--warning) 8%, var(--surface))", border: `1px solid ${skillLevelUp.levelUp ? "color-mix(in srgb, var(--success) 25%, transparent)" : "color-mix(in srgb, var(--warning) 25%, transparent)"}`, fontSize: 13, textAlign: "center" }}>
                  {skillLevelUp.levelUp
                    ? <><TrophyOutlined style={{ marginRight: 6 }} /> Trình độ nghe nâng lên: {skillLevelUp.cefr}!</>
                    : <><BarChartOutlined style={{ marginRight: 6 }} /> Trình độ hiện tại: {skillLevelUp.cefr}</>}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
