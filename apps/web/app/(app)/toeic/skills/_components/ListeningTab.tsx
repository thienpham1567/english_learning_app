"use client";

import { AlertTriangle, BarChart2, ClipboardList, Headphones, Trophy } from "lucide-react";
import * as m from "motion/react-client";
import { useEffect, useState } from "react";
import { AudioPlayer } from "@/app/(app)/listening/_components/AudioPlayer";
import { LevelSelector } from "@/app/(app)/listening/_components/LevelSelector";
import { QuestionCards } from "@/app/(app)/listening/_components/QuestionCards";
import { Results } from "@/app/(app)/listening/_components/Results";
import { ScriptPanel } from "@/app/(app)/listening/_components/ScriptPanel";
import { SpeakerLegend } from "@/app/(app)/listening/_components/SpeakerLegend";
import { useExamMode } from "@/components/shared/ExamModeProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useListeningExercise } from "@/hooks/useListeningExercise";
import { api } from "@/lib/api-client";
import type { CefrLevel } from "@/lib/listening/types";

export function ListeningTab() {
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
    scriptRevealed,
    revealScript,
    generate,
    selectAnswer,
    submit,
    useReplay,
    cycleSpeed,
    reset,
  } = useListeningExercise();

  const { examMode } = useExamMode();
  const [profileRecommendedLevel, setProfileRecommendedLevel] = useState<CefrLevel | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("austin");

  const skillLevelUp = result?.skill
    ? { cefr: result.skill.cefr, levelUp: result.skill.levelUp }
    : null;

  useEffect(() => {
    api
      .get<{ cefr?: string }>("/skill-profile", { params: { module: "listening" } })
      .then((data) => {
        if (data?.cefr) setProfileRecommendedLevel(data.cefr as CefrLevel);
      })
      .catch(() => {});
  }, []);

  const recommendedLevel =
    (result?.skill?.cefr as CefrLevel | undefined) ?? profileRecommendedLevel;
  const [mode, setMode] = useState<"free" | "parts">("free");

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* ─── Mode toggle ─── */}
      <Card shadowSize="sm" size="sm" className="flex flex-row gap-1 p-1 mb-5 max-w-sm">
        {[
          { key: "free" as const, label: "Free Listening", icon: Headphones },
          { key: "parts" as const, label: "TOEIC Parts 1–4", icon: ClipboardList },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <m.button
              key={tab.key}
              type="button"
              onClick={() => setMode(tab.key)}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-150 ${
                mode === tab.key
                  ? "bg-accent text-ink font-black shadow-sm"
                  : "bg-transparent text-text-secondary font-bold hover:text-text-primary"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </m.button>
          );
        })}
      </Card>

      {/* ─── TOEIC Parts overview ─── */}
      {mode === "parts" && (
        <div className="flex flex-col gap-3.5 pb-5">
          {[
            {
              part: "Part 1",
              title: "Photographs",
              desc: "Listen to 4 descriptions, choose the best one describing the photo",
              questions: 6,
              tips: "Look at the photo before the audio starts. Focus on subject + action.",
            },
            {
              part: "Part 2",
              title: "Question-Response",
              desc: "Listen to a question/statement, choose the best response",
              questions: 25,
              tips: "Listen carefully to the first Wh-word. Eliminate same-sound or repetitive word traps.",
            },
            {
              part: "Part 3",
              title: "Conversations",
              desc: "Listen to conversations between 2-3 people, answer 3 questions",
              questions: 39,
              tips: "Read the questions + answers BEFORE the audio plays. Focus on intent & detail.",
            },
            {
              part: "Part 4",
              title: "Talks",
              desc: "Listen to talks/announcements, answer 3 questions",
              questions: 30,
              tips: "Focus on purpose, audience, and next step. Read the questions first.",
            },
          ].map((p, i) => (
            <m.div
              key={p.part}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
            >
              <Card shadowSize="sm" className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent rounded-r" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-black text-ink">
                    {p.part} — {p.title}
                  </span>
                  <span className="text-[10px] font-black text-ink px-2.5 py-0.5 border-2 border-border rounded-lg bg-accent shadow-sm">
                    {p.questions} questions
                  </span>
                </div>
                <p className="text-xs text-text-secondary mb-2.5 leading-relaxed font-medium">{p.desc}</p>
                <div className="text-[11px] text-text-muted p-3 rounded-xl bg-bg-deep border-2 border-border/50 leading-relaxed">
                  💡 <strong className="text-text-primary">Tip:</strong> {p.tips}
                </div>
              </Card>
            </m.div>
          ))}

          <Button
            onClick={() => setMode("free")}
            className="self-center mt-3 px-6 h-10 text-xs font-black"
          >
            Start Listening →
          </Button>
        </div>
      )}

      {/* ─── Free practice mode ─── */}
      {mode === "free" && (
        <>
          {error && (
            <div className="flex gap-2 items-center bg-error/8 border-2 border-error/20 rounded-2xl p-4 text-xs text-error font-semibold mb-5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
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
            <div className="flex flex-col gap-5">
              {exercise.turns && exercise.turns.length > 0 && (
                <SpeakerLegend turns={exercise.turns} />
              )}

              {(!exercise.turns || exercise.turns.length === 0) && (
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-text-muted font-extrabold uppercase tracking-widest">Voice:</span>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="bg-surface-alt border-2 border-border rounded-xl px-3 py-1.5 text-xs font-bold text-ink outline-none focus-visible:border-accent transition-all cursor-pointer"
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
            <div className="flex flex-col gap-4">
              <Results
                result={result}
                onNewExercise={reset}
                dialogueTurns={exercise?.turns}
                scriptRevealed={scriptRevealed}
              />

              {skillLevelUp && (
                <Card
                  shadowSize="sm"
                  size="sm"
                  className={`text-center text-xs font-bold flex flex-row items-center justify-center gap-2 ${
                    skillLevelUp.levelUp
                      ? "bg-success/8 border-success/20 text-success"
                      : "bg-warning/8 border-warning/20 text-warning"
                  }`}
                >
                  {skillLevelUp.levelUp ? (
                    <>
                      <Trophy className="h-4 w-4 fill-current animate-bounce" />
                      <span>Listening proficiency level upgraded to: {skillLevelUp.cefr}!</span>
                    </>
                  ) : (
                    <>
                      <BarChart2 className="h-4 w-4" />
                      <span>Current proficiency level: {skillLevelUp.cefr}</span>
                    </>
                  )}
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
