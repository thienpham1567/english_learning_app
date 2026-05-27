"use client";

import { AlertTriangle, BarChart2, ClipboardList, Headphones, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AudioPlayer } from "@/app/(app)/listening/_components/AudioPlayer";
import { DialogueGenerator } from "@/app/(app)/listening/_components/DialogueGenerator";
import { LevelSelector } from "@/app/(app)/listening/_components/LevelSelector";
import { QuestionCards } from "@/app/(app)/listening/_components/QuestionCards";
import { Results } from "@/app/(app)/listening/_components/Results";
import { ScriptPanel } from "@/app/(app)/listening/_components/ScriptPanel";
import { SpeakerLegend } from "@/app/(app)/listening/_components/SpeakerLegend";
import { useExamMode } from "@/components/shared/ExamModeProvider";
import { Button } from "@/components/ui/button";
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
    generateDialogue,
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
      {/* Mode toggle */}
      <div className="flex gap-2.5 py-2 pb-4 flex-wrap">
        {[
          { key: "free" as const, label: "Free Listening", icon: Headphones },
          { key: "parts" as const, label: "TOEIC Parts 1–4", icon: ClipboardList },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`px-4 py-2 rounded-lg text-xs font-black border-2 border-border cursor-pointer transition-all duration-100 flex items-center gap-1.5 ${
                mode === m.key
                  ? "bg-accent text-ink shadow-sm -translate-y-0.5"
                  : "bg-surface text-text-secondary hover:bg-surface-hover"
              }`}
            >
              <motion.span
                animate={mode === m.key ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center"
              >
                <Icon size={14} />
              </motion.span>
              {m.label}
            </button>
          );
        })}
      </div>

      {/* TOEIC Parts overview */}
      {mode === "parts" && (
        <div className="flex flex-col gap-4 pb-5 animate-in fade-in duration-200">
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
            <div
              key={p.part}
              className="p-5 rounded-xl border-2 border-border bg-surface relative overflow-hidden shadow transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-text-primary">
                  {p.part} — {p.title}
                </span>
                <span className="text-[10px] font-black text-ink px-2.5 py-0.5 border-2 border-border rounded-md bg-accent shadow-sm">
                  {p.questions} questions
                </span>
              </div>
              <p className="text-xs text-text-secondary mb-2.5 leading-relaxed">{p.desc}</p>
              <div className="text-[11px] text-text-muted p-3 rounded-lg bg-surface-alt border-2 border-border leading-relaxed">
                💡 <strong className="text-text-primary">Tip:</strong> {p.tips}
              </div>
            </div>
          ))}

          <Button
            onClick={() => setMode("free")}
            className="self-center mt-3 px-6 h-10 text-xs font-black"
          >
            Start Listening →
          </Button>
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
              {exercise.turns && exercise.turns.length > 0 && (
                <SpeakerLegend turns={exercise.turns} />
              )}

              {(!exercise.turns || exercise.turns.length === 0) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted font-bold">Voice Accent:</span>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="bg-surface-alt border-2 border-border rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink outline-none focus-visible:shadow-sm focus-visible:translate-x-[-1px] focus-visible:translate-y-[-1px] transition-all cursor-pointer"
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
                <div
                  className={`p-4 rounded-2xl border text-center text-xs font-semibold flex items-center justify-center gap-2 ${
                    skillLevelUp.levelUp
                      ? "bg-emerald-950/10 border-emerald-950/20 text-emerald-450"
                      : "bg-amber-950/10 border-amber-950/20 text-amber-450"
                  }`}
                >
                  {skillLevelUp.levelUp ? (
                    <>
                      <Trophy className="h-4 w-4 text-emerald-400 fill-current animate-bounce" />
                      <span>Listening proficiency level upgraded to: {skillLevelUp.cefr}!</span>
                    </>
                  ) : (
                    <>
                      <BarChart2 className="h-4 w-4 text-amber-400" />
                      <span>Current proficiency level: {skillLevelUp.cefr}</span>
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
