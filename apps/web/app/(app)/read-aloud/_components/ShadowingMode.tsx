"use client";

import { MicOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useShadowing } from "../_hooks/useShadowing";
import { ShadowingProgress } from "./shadowing/ShadowingProgress";
import { ShadowingStage } from "./shadowing/ShadowingStage";
import { ShadowingSummary } from "./shadowing/ShadowingSummary";
import { ShadowingTextPicker } from "./shadowing/ShadowingTextPicker";

interface ShadowingModeProps {
  text: string;
  onTextChange: (text: string) => void;
  onClear: () => void;
  voiceRole: string;
  speed: number;
}

/**
 * Shadowing practice: listen to a native model sentence, repeat it, and get
 * AI pronunciation feedback. Awards XP + updates the listening skill on
 * completion. Thin container — flow lives in useShadowing, UI in subcomponents.
 */
export function ShadowingMode({
  text,
  onTextChange,
  onClear,
  voiceRole,
  speed,
}: ShadowingModeProps) {
  const s = useShadowing({ text, voiceRole, speed });

  /* No passage yet → let the learner add one inline. */
  if (s.sentences.length === 0) {
    return <ShadowingTextPicker text={text} onTextChange={onTextChange} />;
  }

  if (!s.voiceSupported) {
    return (
      <Card shadowSize="sm" className="text-center py-10 px-6">
        <div className="flex justify-center mb-4">
          <MicOff size={44} className="text-text-muted" />
        </div>
        <h3 className="mb-2 text-text-primary">Microphone not supported</h3>
        <span className="text-text-muted block max-w-[400px] mx-auto">
          Your browser doesn't support audio recording. Try the latest Chrome, Edge, or Safari to
          practice shadowing.
        </span>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ShadowingProgress
        sentences={s.sentences}
        currentIdx={s.currentIdx}
        progress={s.progress}
        sentenceResults={s.sentenceResults}
        onSelect={s.goToIndex}
        onChangePassage={onClear}
      />

      <ShadowingStage
        step={s.step}
        currentSentence={s.currentSentence}
        currentIdx={s.currentIdx}
        total={s.sentences.length}
        evalResult={s.evalResult}
        onPlayReference={s.playReference}
        onStartRecording={s.startRecording}
        onStopAndEvaluate={s.stopAndEvaluate}
        onRetry={s.retry}
        onNext={s.goToNext}
      />

      {s.isComplete && (
        <ShadowingSummary
          avgScore={s.avgScore}
          sentenceResults={s.sentenceResults}
          completion={s.completion}
          isSubmitting={s.isSubmitting}
          onRestart={s.restart}
        />
      )}
    </div>
  );
}
