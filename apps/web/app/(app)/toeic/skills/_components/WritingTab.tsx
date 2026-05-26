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
    { key: "practice" as const, label: "Luyện viết", icon: <PenTool className="h-4 w-4" /> },
    { key: "rewrite" as const, label: "Cải thiện câu", icon: <Highlighter className="h-4 w-4" /> },
    { key: "guided" as const, label: "Viết có hướng dẫn", icon: <Target className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Custom Tabs */}
      <div className="flex gap-2 py-2 pb-3.5 border-b-2 border-border mb-4 overflow-x-auto scrollbar-none">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all duration-150 active:scale-97 ${
                isActive
                  ? "border-accent bg-accent/10 text-accent font-bold"
                  : "border-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-ink hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-(--shadow-sm) transition-all duration-100"
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
              <div className="mb-4 rounded-xl border border-red-900/30 bg-red-950/20 px-4 py-2.5 text-xs text-red-400 text-center">
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
                  Christine Ho đang chấm bài...
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
