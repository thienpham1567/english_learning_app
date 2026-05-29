"use client";

import { ChevronRight, Clock, Info, PlayCircle, Trophy } from "lucide-react";
import * as m from "motion/react-client";
import { CEFR_COLORS } from "@/lib/constants/cefr";
import type { DiagnosticStatus } from "./types";
import { Card } from "@/components/ui/card";

const SKILL_LABELS: Record<string, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
  listening: "Listening",
};

type Props = {
  status: DiagnosticStatus | null;
  onStart: () => void;
};

export function WelcomeScreen({ status, onStart }: Props) {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg-deep">
      <div className="flex-1 overflow-y-auto py-6 px-5 pb-12">
        <div className="w-full max-w-[600px] mx-auto flex flex-col gap-5">
          {/* Test Info Cards Grid */}
          <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card shadowSize="default" className="bg-surface p-5 rounded-xl gap-4">
              <div className="flex items-center gap-2">
                <Info className="text-[13px] text-accent" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent">
                  Assessment Structure
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: "📝",
                    label: "30 Questions",
                    desc: "10 Grammar + 10 Vocabulary + 5 Reading + 5 Listening",
                  },
                  {
                    icon: "🎯",
                    label: "Smart Adaptive",
                    desc: "Difficulty auto-adjusts based on your answers",
                  },
                  {
                    icon: "⏱️",
                    label: "Approx. 15 Minutes",
                    desc: "No time limit for individual questions",
                  },
                  {
                    icon: "📈",
                    label: "CEFR Placement",
                    desc: "Detailed evaluation from A1 to C2 with reports",
                  },
                ].map((item, idx) => (
                  <Card
                    key={idx}
                    size="sm"
                    shadowSize="none"
                    bgType="alt"
                    className="flex flex-col gap-1 py-3 px-3.5 border-2 rounded-lg"
                  >
                    <span className="text-xl mb-0.5">{item.icon}</span>
                    <span className="text-[13px] font-extrabold text-text-primary">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-text-muted font-medium leading-snug">
                      {item.desc}
                    </span>
                  </Card>
                ))}
              </div>
            </Card>
          </m.div>

          {/* Previous result */}
          {status?.hasResult && status.lastResult && (
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card shadowSize="default" className="bg-surface p-5 rounded-xl gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="text-[13px] text-accent" />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent">
                    Latest Assessment Result
                  </span>
                </div>

                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="text-4xl font-black bg-surface-alt w-[58px] h-[58px] rounded-full grid font-display border-2 place-items-center"
                      style={{
                        color: CEFR_COLORS[status.lastResult.overallCefr] ?? "var(--accent)",
                        borderColor: CEFR_COLORS[status.lastResult.overallCefr] ?? "var(--accent)",
                        boxShadow: `4px 4px 0 ${CEFR_COLORS[status.lastResult.overallCefr]}33`,
                      }}
                    >
                      {status.lastResult.overallCefr}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-text-primary">
                        Level {status.lastResult.overallCefr}
                      </div>
                      <div className="text-[11px] text-text-muted font-medium mt-0.5">
                        Confidence: {Math.round(status.lastResult.confidence * 100)}% · Date:{" "}
                        {new Date(status.lastResult.completedAt).toLocaleDateString("en-US")}
                      </div>
                    </div>
                  </div>

                  {/* Previous skill breakdown */}
                  {status.lastResult.skillBreakdown && (
                    <Card
                      size="sm"
                      shadowSize="none"
                      bgType="alt"
                      className="grid grid-cols-2 gap-2 mt-1 p-3 border-2 rounded-lg"
                    >
                      {Object.entries(status.lastResult.skillBreakdown).map(([skill, sr]) => {
                        const skillColor = CEFR_COLORS[sr.cefr] ?? "var(--accent)";
                        return (
                          <div key={skill} className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-text-secondary">
                              {SKILL_LABELS[skill] ?? skill}
                            </span>
                            <span
                              className="text-[11px] font-extrabold bg-surface rounded-full py-0.5 px-2"
                              style={{
                                color: skillColor,
                                border: `2px solid ${skillColor}`,
                              }}
                            >
                              {sr.cefr} ({sr.correct}/{sr.total})
                            </span>
                          </div>
                        );
                      })}
                    </Card>
                  )}
                </div>
              </Card>
            </m.div>
          )}

          {/* Start button / Cooldown */}
          {status?.canRetake !== false ? (
            <m.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart}
              className="w-full h-[52px] rounded-xl border-2 border-border text-base font-extrabold cursor-pointer flex items-center justify-center gap-2 text-[var(--text-on-accent)] shadow-sm"
              style={{
                background: "var(--accent)",
              }}
            >
              <PlayCircle />
              {status?.hasResult ? "Retake Diagnostic Test" : "Start Diagnostic Test"}
              <ChevronRight size={12} />
            </m.button>
          ) : (
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card
                shadowSize="sm"
                bgType="alt"
                className="text-center p-5 rounded-xl border-2 gap-2"
              >
                <Clock className="text-3xl text-text-muted mx-auto" />
                <div className="text-[13px] text-text-secondary font-semibold">
                  You have recently completed this test. Please practice more and try again in{" "}
                  <span className="text-accent font-extrabold">{status?.daysUntilRetake}</span>{" "}
                  days!
                </div>
              </Card>
            </m.div>
          )}
        </div>
      </div>
    </div>
  );
}
