"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api-client";
import { SoundOutlined, AudioOutlined, EditOutlined } from "@ant-design/icons";
import { Segmented } from "antd";

import { useListeningExercise } from "@/hooks/useListeningExercise";
import { useMiniDictionary } from "@/hooks/useMiniDictionary";
import { useExamMode } from "@/components/shared/ExamModeProvider";
import { LevelSelector } from "@/app/(app)/listening/_components/LevelSelector";
import { AudioPlayer } from "@/app/(app)/listening/_components/AudioPlayer";
import { QuestionCards } from "@/app/(app)/listening/_components/QuestionCards";
import { Results } from "@/app/(app)/listening/_components/Results";
import { MiniDictionary } from "@/components/shared";
import ShadowingMode from "@/app/(app)/listening/_components/ShadowingMode";
import DictationMode from "@/app/(app)/listening/_components/DictationMode";
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
    selectAnswer,
    submit,
    useReplay,
    cycleSpeed,
    reset,
  } = useListeningExercise();

  // MiniDictionary integration for transcript word lookup
  const miniDict = useMiniDictionary();
  const { examMode } = useExamMode();
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [profileRecommendedLevel, setProfileRecommendedLevel] = useState<CefrLevel | null>(null);
  const [mode, setMode] = useState<string>("listening");

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
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid var(--border)",
          padding: "14px 20px",
          background: "var(--surface)",
        }}
      >
        <SoundOutlined style={{ fontSize: 20, color: "var(--accent)" }} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
            {mode === "listening" ? "Luyện nghe" : mode === "shadowing" ? "Shadowing" : "Dictation"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {mode === "shadowing" && "Nghe → Lặp lại → So sánh phát âm"}
            {mode === "dictation" && "Nghe → Gõ lại → Kiểm tra từng từ"}
            {mode === "listening" && state === "idle" && "Chọn cấp độ để bắt đầu"}
            {mode === "listening" && state === "loading" && "Đang tạo bài nghe..."}
            {mode === "listening" && (state === "active" || state === "submitting") && exercise && `${exercise.level} • ${exercise.questions.length} câu hỏi`}
            {mode === "listening" && state === "submitted" && result && `Kết quả: ${result.correct}/${result.total}`}
          </div>
        </div>
        <Segmented
          value={mode}
          onChange={(val) => setMode(val as string)}
          options={[
            { value: "listening", icon: <SoundOutlined />, label: "Nghe" },
            { value: "shadowing", icon: <AudioOutlined />, label: "Shadow" },
            { value: "dictation", icon: <EditOutlined />, label: "Dictation" },
          ]}
          style={{ marginLeft: "auto" }}
          size="small"
        />
      </div>

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

        {/* Standard Listening Mode */}
        {mode === "listening" && (
          <>
        {/* Error */}
        {error && (
          <div
            style={{
              background: "#ff4d4f15",
              border: "1px solid #ff4d4f40",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              color: "#ff4d4f",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Idle: Level Selector */}
        {(state === "idle" || state === "loading") && (
          <LevelSelector
            onStart={(level, type) => generate(level, type, examMode)}
            isLoading={state === "loading"}
            recommendedLevel={recommendedLevel}
          />
        )}

        {/* Active: Audio + Questions */}
        {(state === "active" || state === "submitting") && exercise && (
          <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
            <AudioPlayer
              audioUrl={exercise.audioUrl}
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
            />
            {skillLevelUp && (
              <div
                style={{
                  marginTop: 12,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  background: skillLevelUp.levelUp ? "#52c41a15" : "#faad1415",
                  border: `1px solid ${skillLevelUp.levelUp ? "#52c41a40" : "#faad1440"}`,
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
