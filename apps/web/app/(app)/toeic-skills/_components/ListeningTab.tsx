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

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", width: "100%" }}>
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
    </div>
  );
}
