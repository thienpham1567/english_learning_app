"use client";

import { Highlighter, PenTool, Target } from "lucide-react";
import { useState } from "react";

import { useWritingPractice } from "@/hooks/useWritingPractice";
import { FeedbackPanel } from "./writing/FeedbackPanel";
import { GuidedWritingPanel } from "./writing/GuidedWritingPanel";
import { PromptGallery } from "./writing/PromptGallery";
import { RewritePanel } from "./writing/RewritePanel";
import { SubmissionHistory } from "./writing/SubmissionHistory";
import { WritingEditor } from "./writing/WritingEditor";

type TabKey = "practice" | "rewrite" | "guided";

export function WritingTab() {
  const {
    state,
    category,
    prompt,
    hints,
    writtenText,
    feedback,
    error,
    history,
    loadingCategory,
    generatePrompt,
    submitWriting,
    viewSubmission,
    startNew,
  } = useWritingPractice();

  const [activeTab, setActiveTab] = useState<TabKey>("practice");

  const tabs = [
    { key: "practice" as const, label: "Practice Writing", icon: <PenTool className="h-4 w-4" /> },
    {
      key: "rewrite" as const,
      label: "Improve Sentences",
      icon: <Highlighter className="h-4 w-4" />,
    },
    { key: "guided" as const, label: "Guided Writing", icon: <Target className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-surface-alt border-2 border-border rounded-2xl mb-5 max-w-md">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs cursor-pointer transition-all duration-150 ${
                isActive
                  ? "bg-accent text-ink font-black shadow-sm"
                  : "bg-transparent text-text-secondary font-bold hover:text-text-primary"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="w-full animate-in fade-in duration-200">
        {activeTab === "practice" && (
          <div>
            {error && (
              <div className="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-xs text-error text-center">
                {error}
              </div>
            )}
            {state === "prompt-selection" && (
              <div className="w-full">
                <PromptGallery onSelect={generatePrompt} isLoading={false} loadingCategory={null} />
                <SubmissionHistory submissions={history} onView={viewSubmission} />
              </div>
            )}
            {state === "generating-prompt" && (
              <div className="w-full">
                <PromptGallery
                  onSelect={generatePrompt}
                  isLoading={true}
                  loadingCategory={loadingCategory}
                />
              </div>
            )}
            {state === "writing" && category && (
              <div className="w-full">
                <WritingEditor
                  prompt={prompt}
                  category={category}
                  hints={hints}
                  onSubmit={submitWriting}
                  isSubmitting={false}
                />
              </div>
            )}
            {state === "reviewing" && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="w-full max-w-md space-y-3 animate-pulse">
                  <div className="h-4 bg-bg-deep border border-border/20 rounded w-3/4 mx-auto"></div>
                  <div className="h-3 bg-bg-deep border border-border/20 rounded w-5/6 mx-auto"></div>
                  <div className="h-3 bg-bg-deep border border-border/20 rounded w-4/5 mx-auto"></div>
                  <div className="h-3 bg-bg-deep border border-border/20 rounded w-3/5 mx-auto"></div>
                </div>
                <p className="text-xs text-text-muted font-bold mt-2">
                  Christine Ho is grading your writing...
                </p>
              </div>
            )}
            {state === "feedback" && feedback && (
              <div className="w-full">
                <FeedbackPanel text={writtenText} feedback={feedback} onNewWriting={startNew} />
              </div>
            )}
          </div>
        )}

        {activeTab === "rewrite" && (
          <div className="pt-2">
            <RewritePanel />
          </div>
        )}

        {activeTab === "guided" && (
          <div className="pt-2">
            <GuidedWritingPanel />
          </div>
        )}
      </div>
    </div>
  );
}
