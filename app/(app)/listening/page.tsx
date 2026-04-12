"use client";

import { useState, useCallback } from "react";
import { SoundOutlined } from "@ant-design/icons";

import { useListeningExercise } from "@/hooks/useListeningExercise";
import { useMiniDictionary } from "@/hooks/useMiniDictionary";
import { LevelSelector } from "@/components/app/listening/LevelSelector";
import { AudioPlayer } from "@/components/app/listening/AudioPlayer";
import { QuestionCards } from "@/components/app/listening/QuestionCards";
import { Results } from "@/components/app/listening/Results";
import { MiniDictionary } from "@/components/app/shared";

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
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  const handleWordSaved = useCallback((word: string) => {
    setSavedWords((prev) => new Set(prev).add(word.toLowerCase()));
  }, []);

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
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        background: "linear-gradient(180deg, var(--surface), var(--bg))",
        boxShadow: "var(--shadow-md)",
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
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Luyện nghe</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {state === "idle" && "Chọn cấp độ để bắt đầu"}
            {state === "loading" && "Đang tạo bài nghe..."}
            {(state === "active" || state === "submitting") && exercise && `${exercise.level} • ${exercise.questions.length} câu hỏi`}
            {state === "submitted" && result && `Kết quả: ${result.correct}/${result.total}`}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "20px",
        }}
      >
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
          <LevelSelector onStart={generate} isLoading={state === "loading"} />
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
          </div>
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
