"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api-client";
import { SoundOutlined, AudioOutlined, EditOutlined, FileTextOutlined, ImportOutlined } from "@ant-design/icons";
import { Segmented, Button, Select } from "antd";
import { useRouter } from "next/navigation";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

import { useListeningExercise } from "@/hooks/useListeningExercise";
import { useMiniDictionary } from "@/hooks/useMiniDictionary";
import { useExamMode } from "@/components/shared/ExamModeProvider";
import { LevelSelector } from "@/app/(app)/listening/_components/LevelSelector";
import { AudioPlayer } from "@/app/(app)/listening/_components/AudioPlayer";
import { QuestionCards } from "@/app/(app)/listening/_components/QuestionCards";
import { Results } from "@/app/(app)/listening/_components/Results";
import { DialogueGenerator } from "@/app/(app)/listening/_components/DialogueGenerator";
import { SpeakerLegend } from "@/app/(app)/listening/_components/SpeakerLegend";
import { MiniDictionary } from "@/components/shared";
import ShadowingMode from "@/app/(app)/listening/_components/ShadowingMode";
import DictationMode from "@/app/(app)/listening/_components/DictationMode";
import SummarizeMode from "@/app/(app)/listening/_components/SummarizeMode";
import type { CefrLevel } from "@/lib/listening/types";

export default function ListeningPage() {
  const {
    state,
    exercise,
    result,
    error,
    selectedAnswers,
    replaysUsed,
    maxReplays,
    selectedSpeed,
    allAnswered,
    generate,
    generateDialogue,
    selectAnswer,
    submit,
    useReplay,
    cycleSpeed,
    reset,
  } = useListeningExercise();

  // MiniDictionary integration for transcript word lookup
  const miniDict = useMiniDictionary();
  const { examMode } = useExamMode();
  const router = useRouter();
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [profileRecommendedLevel, setProfileRecommendedLevel] = useState<CefrLevel | null>(null);
  const [mode, setMode] = useState<string>("listening");
  const [selectedVoice, setSelectedVoice] = useState("austin");

  // Derive skill level-up from result (computed, not effect)
  const skillLevelUp = result?.skill
    ? { cefr: result.skill.cefr, levelUp: result.skill.levelUp }
    : null;

  // Fetch listening skill profile for adaptive level recommendation
  useEffect(() => {
    api.get<{ cefr?: string }>("/skill-profile", { params: { module: "listening" } })
      .then((data) => {
        if (data?.cefr) {
          setProfileRecommendedLevel(data.cefr as CefrLevel);
        }
      })
      .catch(() => {});
  }, []);

  const handleWordSaved = useCallback((word: string) => {
    setSavedWords((prev) => new Set(prev).add(word.toLowerCase()));
  }, []);

  const recommendedLevel =
    (result?.skill?.cefr as CefrLevel | undefined) ?? profileRecommendedLevel;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <ModuleHeader
        icon={<SoundOutlined />}
        gradient="var(--gradient-listening)"
        title={
          mode === "listening" ? "Luyện nghe 🎧" :
          mode === "shadowing" ? "Shadowing 🎯" :
          mode === "dictation" ? "Dictation ✍️" :
          "Listen & Summarize 📝"
        }
        subtitle={
          mode === "shadowing" ? "Nghe → Lặp lại → So sánh phát âm" :
          mode === "dictation" ? "Nghe → Gõ lại → Kiểm tra từng từ" :
          mode === "summarize" ? "Nghe → Tóm tắt → AI chấm ý chính" :
          state === "idle" ? "Chọn cấp độ để bắt đầu" :
          state === "loading" ? "Đang tạo bài nghe..." :
          (state === "active" || state === "submitting") && exercise ? `${exercise.level} • ${exercise.questions.length} câu hỏi` :
          state === "submitted" && result ? `Kết quả: ${result.correct}/${result.total}` :
          "Luyện nghe tiếng Anh"
        }
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Segmented
              value={mode}
              onChange={(val) => setMode(val as string)}
              options={[
                { value: "listening", icon: <SoundOutlined />, label: "Nghe" },
                { value: "shadowing", icon: <AudioOutlined />, label: "Shadow" },
                { value: "dictation", icon: <EditOutlined />, label: "Dictation" },
                { value: "summarize", icon: <FileTextOutlined />, label: "Tóm tắt" },
              ]}
              size="small"
            />
            <Button
              type="text"
              icon={<ImportOutlined style={{ fontSize: 16 }} />}
              onClick={() => router.push("/listening/import")}
              title="Import Podcast / YouTube"
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.8)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            />
          </div>
        }
      />

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "20px",
        }}
      >
        {/* Shadowing Mode */}
        {mode === "shadowing" && (
          <ShadowingMode examMode={examMode} />
        )}

        {/* Dictation Mode */}
        {mode === "dictation" && (
          <DictationMode examMode={examMode} />
        )}

        {/* Summarize Mode (19.3.3) */}
        {mode === "summarize" && (
          <SummarizeMode examMode={examMode} />
        )}

        {/* Standard Listening Mode */}
        {mode === "listening" && (
          <>
        {/* Error */}
        {error && (
          <div
            style={{
              background: "var(--error-bg)",
              border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              color: "var(--error)",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            ⚠️ {error}
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
          <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
            {exercise.turns && exercise.turns.length > 0 && (
              <SpeakerLegend turns={exercise.turns} />
            )}

            {/* Voice selector — only for single-speaker (non-dialogue) exercises */}
            {(!exercise.turns || exercise.turns.length === 0) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Giọng đọc:</span>
                <Select
                  value={selectedVoice}
                  onChange={setSelectedVoice}
                  size="small"
                  style={{ width: 150 }}
                  options={[
                    { value: "austin", label: "🇺🇸 US Male" },
                    { value: "autumn", label: "🇺🇸 US Female" },
                    { value: "daniel", label: "🇬🇧 UK Male" },
                    { value: "diana", label: "🇬🇧 UK Female" },
                    { value: "troy", label: "🇦🇺 AU Male" },
                    { value: "hannah", label: "🇦🇺 AU Female" },
                  ]}
                />
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
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <Results
              result={result}
              onNewExercise={reset}
              onWordClick={miniDict.openForWord}
              savedWords={savedWords}
              dialogueTurns={exercise?.turns}
            />
            {skillLevelUp && (
              <div
                style={{
                  marginTop: 12,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  background: skillLevelUp.levelUp ? "color-mix(in srgb, var(--success) 8%, var(--surface))" : "color-mix(in srgb, var(--warning) 8%, var(--surface))",
                  border: `1px solid ${skillLevelUp.levelUp ? "color-mix(in srgb, var(--success) 25%, transparent)" : "color-mix(in srgb, var(--warning) 25%, transparent)"}`,
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                {skillLevelUp.levelUp
                  ? `🎉 Trình độ nghe nâng lên: ${skillLevelUp.cefr}!`
                  : `📊 Trình độ hiện tại: ${skillLevelUp.cefr}`}
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* MiniDictionary floating popup */}
      <MiniDictionary
        word={miniDict.word}
        anchorRect={miniDict.anchorRect}
        visible={miniDict.visible}
        onClose={miniDict.close}
        onSave={handleWordSaved}
      />
    </div>
  );
}
