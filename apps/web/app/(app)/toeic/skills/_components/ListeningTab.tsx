"use client";

import { AlertTriangle, BarChart2, Headphones, Trophy } from "lucide-react";
import * as m from "motion/react-client";
import { useEffect, useState } from "react";
import { AudioPlayer } from "@/app/(app)/listening/_components/AudioPlayer";
import { LevelSelector } from "@/app/(app)/listening/_components/LevelSelector";
import { QuestionCards } from "@/app/(app)/listening/_components/QuestionCards";
import { Results } from "@/app/(app)/listening/_components/Results";
import { ScriptPanel } from "@/app/(app)/listening/_components/ScriptPanel";
import { SpeakerLegend } from "@/app/(app)/listening/_components/SpeakerLegend";
import { useExamMode } from "@/components/shared/ExamModeProvider";
import { Card } from "@/components/ui/card";
import { useListeningExercise } from "@/hooks/useListeningExercise";
import { api } from "@/lib/api-client";
import type { CefrLevel } from "@/lib/listening/types";

/* ── TOEIC Part filter config ── */
type ToeicPart = "any" | "part1" | "part2" | "part3" | "part4";

const TOEIC_PARTS: { key: ToeicPart; label: string; subtitle: string }[] = [
  { key: "any", label: "Any", subtitle: "General" },
  { key: "part1", label: "Part 1", subtitle: "Photos" },
  { key: "part2", label: "Part 2", subtitle: "Q & R" },
  { key: "part3", label: "Part 3", subtitle: "Conversations" },
  { key: "part4", label: "Part 4", subtitle: "Talks" },
];

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
  const [toeicPart, setToeicPart] = useState<ToeicPart>("any");

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

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* ─── Error banner ─── */}
      {error && (
        <div className="flex gap-2 items-center bg-error/8 border-2 border-error/20 rounded-2xl p-4 text-xs text-error font-semibold mb-5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Idle: Part filter + Level Selector ─── */}
      {(state === "idle" || state === "loading") && (
        <div className="flex flex-col gap-5">
          {/* TOEIC Part filter */}
          <div>
            <div className="text-[11px] font-bold text-text-muted mb-2.5 uppercase tracking-widest flex items-center gap-2">
              <Headphones size={13} />
              TOEIC Listening Part
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {TOEIC_PARTS.map((p, i) => (
                <m.button
                  key={p.key}
                  type="button"
                  onClick={() => setToeicPart(p.key)}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex flex-col items-center px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-150 min-w-[72px] ${
                    toeicPart === p.key
                      ? "bg-accent text-ink font-black border-accent shadow-sm"
                      : "bg-surface border-border text-text-secondary font-bold hover:border-accent/40 hover:text-text-primary"
                  }`}
                >
                  <span className="text-xs leading-none">{p.label}</span>
                  <span
                    className={`text-[9px] leading-none mt-1 ${
                      toeicPart === p.key ? "text-ink/70" : "text-text-muted"
                    }`}
                  >
                    {p.subtitle}
                  </span>
                </m.button>
              ))}
            </div>
          </div>

          {/* Level + Exercise Type selector */}
          <LevelSelector
            onStart={(level, type) => generate(level, type, examMode, toeicPart)}
            isLoading={state === "loading"}
            recommendedLevel={recommendedLevel}
          />
        </div>
      )}

      {/* ─── Active: Audio + Questions ─── */}
      {(state === "active" || state === "submitting") && exercise && (
        <div className="flex flex-col gap-5">
          {exercise.turns && exercise.turns.length > 0 && (
            <SpeakerLegend turns={exercise.turns} />
          )}

          {(!exercise.turns || exercise.turns.length === 0) && (
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] text-text-muted font-extrabold uppercase tracking-widest">
                Voice:
              </span>
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
                <option value="hannah">🇦🇺 AU Female</option>
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

      {/* ─── Submitted: Results ─── */}
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
    </div>
  );
}
