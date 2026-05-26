"use client";

import { useState } from "react";

import type { GrammarQuestion } from "@/lib/grammar-quiz/types";
import * as m from "motion/react-client";
import {
  Check,
  CircleCheckBig,
  Flame,
  Languages,
  Lightbulb,
  X,
  XCircle,
} from "lucide-react";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  question: GrammarQuestion;
  questionNumber: number;
  total: number;
  selectedAnswer: number | null;
  isRevealed: boolean;
  combo: number;
  onAnswer: (index: number) => void;
  onNext: () => void;
};

export function QuestionCard({
  question,
  questionNumber,
  total,
  selectedAnswer,
  isRevealed,
  combo,
  onAnswer,
  onNext,
}: Props) {
  const isLastQuestion = questionNumber === total;
  const [lang, setLang] = useState<"en" | "vi">("vi");
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="mx-auto w-full w-[580px]" >
      {/* Progress track */}
      <div className="mb-4" >
        <div className="flex items-center justify-between mb-2" >
          <span className="font-bold text-text-secondary" style={{fontSize: 12.5}} >
            Câu hỏi {questionNumber} / {total}
          </span>
          <span className="rounded-md bg-surface-alt border border-(--border) font-bold text-accent" style={{padding: "3px 8px", fontSize: 11.5}} >
            {question.grammarTopic}
          </span>
        </div>
        {/* Visual progress track */}
        <div className="h-[6px] rounded-full relative overflow-hidden" style={{background: "var(--border)"}} >
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }} className="absolute rounded-full" style={{left: 0, top: 0, bottom: 0, background: "linear-gradient(90deg, var(--accent), var(--secondary))"}} />
        </div>
      </div>

      {/* Combo badge */}
      {combo >= 2 && (
        <m.div
          key={`combo-${combo}`}
          initial={{ scale: 0.5, y: -10 }}
          animate={{ scale: [1, 1.1, 1], y: 0 }} className="flex justify-center" style={{marginBottom: 14}} >
          <span className="items-center gap-1.5 rounded-full font-black" style={{display: "inline-flex", background: "linear-gradient(135deg, var(--fire), var(--xp))", padding: "6px 18px", fontSize: 13.5, color: "var(--text-on-accent)", boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)"}} >
            <Flame /> {combo} COMBO! 🔥
          </span>
        </m.div>
      )}

      {/* Stem Card */}
      <div className="rounded-(--radius-xl) border border-(--border) bg-(--surface) p-6 relative overflow-hidden" style={{boxShadow: "var(--shadow-sm)"}} >
        <div className="absolute w-[4px]" style={{left: 0, top: 0, bottom: 0, background: "var(--accent)"}} />

        <p className="text-text-primary font-bold m-0" style={{fontSize: 16.5, lineHeight: 1.65}} >
          {renderStem(question.stem)}
        </p>

        {/* MCQ Options */}
        <div className="mt-6 flex flex-col gap-2" >
          {question.options.map((option, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === question.correctIndex;

            let bg = "var(--surface)";
            let borderColor = "var(--border)";
            let color = "var(--text-primary)";
            let opacity = 1;

            if (isRevealed) {
              if (isCorrect) {
                bg = "rgba(16, 185, 129, 0.08)";
                borderColor = "var(--success)";
                color = "var(--success)";
              } else if (isSelected && !isCorrect) {
                bg = "rgba(239, 68, 68, 0.08)";
                borderColor = "var(--error)";
                color = "var(--error)";
              } else {
                opacity = 0.4;
                bg = "var(--surface-alt)";
              }
            } else if (isSelected) {
              bg = "var(--accent-light)";
              borderColor = "var(--accent)";
              color = "var(--accent)";
            }

            return (
              <m.button
                key={i}
                whileHover={isRevealed ? {} : { scale: 1.005, x: 2 }}
                whileTap={isRevealed ? {} : { scale: 0.995 }}
                
                onClick={() => onAnswer(i)}
                disabled={isRevealed} className="flex w-full items-center gap-3 rounded-(--radius-lg) py-3 px-4 text-left text-sm" style={{border: `1.5px solid ${borderColor}`, fontWeight: isSelected || (isRevealed && isCorrect) ? 800 : 500, background: bg, color, opacity, cursor: isRevealed ? "default" : "pointer", boxShadow: "var(--shadow-sm)", transition: "all 0.15s"}} >
                <span className="flex w-[28px] h-[28px] shrink-0 items-center justify-center rounded-lg font-extrabold" style={{background: isRevealed && isCorrect
                      ? "var(--success)"
                      : isRevealed && isSelected && !isCorrect
                      ? "var(--error)"
                      : isSelected
                      ? "var(--accent)"
                      : "var(--surface-alt)", fontSize: 11.5, color: (isRevealed && (isCorrect || (isSelected && !isCorrect))) || isSelected
                      ? "var(--text-on-accent)"
                      : "var(--text-secondary)", transition: "all 0.2s"}} >
                  {isRevealed && isCorrect ? (
                    <Check size={12} />
                  ) : isRevealed && isSelected && !isCorrect ? (
                    <X size={12} />
                  ) : (
                    OPTION_LABELS[i]
                  )}
                </span>
                <span className="flex-1" >{option}</span>
              </m.button>
            );
          })}
        </div>

        {/* Collapsible explanations */}
        {isRevealed && (
          <div className="anim-fade-up mt-5" >
            {/* Result Header Tag */}
            <div className="flex items-center gap-2 rounded-(--radius-lg) py-2.5 px-4" style={{border: `1px solid ${selectedAnswer === question.correctIndex ? "var(--success)" : "var(--error)"}`, background: selectedAnswer === question.correctIndex ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)"}} >
              <span className="text-base flex" >
                {selectedAnswer === question.correctIndex ? <CircleCheckBig className="text-emerald-500" /> : <XCircle className="text-destructive" />}
              </span>
              <span className="text-sm font-extrabold" style={{color: selectedAnswer === question.correctIndex ? "var(--success)" : "var(--error)"}} >
                {selectedAnswer === question.correctIndex ? "Đúng chính xác!" : "Chưa chính xác!"} Đáp án đúng:{" "}
                <span style={{ textDecoration: "underline" }}>
                  {OPTION_LABELS[question.correctIndex]} — {question.options[question.correctIndex]}
                </span>
              </span>
            </div>

            {/* Toggle button */}
            <button
              type="button"
              onClick={() => setShowExplanation((v) => !v)} className="mt-2.5 items-center gap-1.5 bg-none border-none cursor-pointer text-[13px] font-bold text-accent" style={{display: "inline-flex", padding: "4px 0"}} >
              {showExplanation ? "▾ Ẩn lời giải thích" : "▸ Xem lời giải thích chi tiết"}
            </button>

            {/* Explanations block */}
            {showExplanation && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }} className="mt-1.5 rounded-(--radius-lg) bg-surface-alt p-4" style={{border: "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))"}} >
                <div className="flex items-center justify-between" >
                  <span className="text-[11px] font-extrabold uppercase text-accent flex items-center gap-1" style={{letterSpacing: "0.1em"}} >
                    <Lightbulb /> Lý do đáp án
                  </span>
                  <div className="flex overflow-hidden rounded-md border border-(--border)" >
                    {(["vi", "en"] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)} className="text-[10.5px] font-extrabold border-none cursor-pointer" style={{padding: "2px 10px", background: lang === l ? "var(--accent)" : "var(--surface)", color: lang === l ? "var(--text-on-accent)" : "var(--accent)"}} >
                        {l === "vi" ? "VIE" : "ENG"}
                      </button>
                    ))}
                  </div>
                </div>
                
                <p className="mt-2.5 text-text-secondary font-medium" style={{marginBottom: 0, fontSize: 13.5, lineHeight: 1.65}} >
                  {lang === "en" ? question.explanationEn : question.explanationVi}
                </p>

                {question.examples && question.examples.length > 0 && (
                  <div className="pt-3" style={{marginTop: 14, borderTop: "1.5px dashed var(--border)"}} >
                    <span className="text-[11px] font-extrabold uppercase text-text-muted block mb-1.5" style={{letterSpacing: "0.1em"}} >
                      Ví dụ thực tế
                    </span>
                    {question.examples.map((ex, idx) => (
                      <p
                        key={idx} className="text-[13px] italic text-text-secondary font-medium" style={{margin: "4px 0 0"}} >
                        • {ex}
                      </p>
                    ))}
                  </div>
                )}
              </m.div>
            )}
          </div>
        )}
      </div>

      {/* Next button */}
      {isRevealed && (
        <m.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onNext} className="mt-4 w-full rounded-(--radius-xl) font-extrabold border-none cursor-pointer flex items-center justify-center gap-1.5" style={{background: "linear-gradient(135deg, var(--accent), var(--accent-hover, var(--accent)))", padding: "12px 0", fontSize: 14.5, color: "var(--text-on-accent)", boxShadow: "0 4px 12px var(--accent-muted)"}} >
          {isLastQuestion ? "Hoàn thành và xem kết quả" : "Câu tiếp theo →"}
        </m.button>
      )}
    </div>
  );
}

function renderStem(stem: string) {
  const parts = stem.split("_____");
  if (parts.length < 2) return stem;
  return (
    <>
      {parts[0]}
      <span className="inline-block rounded-md font-extrabold text-accent" style={{background: "var(--accent-light)", padding: "2px 10px"}} >
        _____
      </span>
      {parts[1]}
    </>
  );
}
