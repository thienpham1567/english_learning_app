"use client";

import { AnimatePresence, motion } from "motion/react";
import { PenLine } from "lucide-react";

import { useWritingPractice } from "@/hooks/useWritingPractice";
import { PromptGallery } from "@/components/app/writing-practice/PromptGallery";
import { WritingEditor } from "@/components/app/writing-practice/WritingEditor";
import { FeedbackPanel } from "@/components/app/writing-practice/FeedbackPanel";
import { SubmissionHistory } from "@/components/app/writing-practice/SubmissionHistory";

export default function WritingPracticePage() {
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

  const isLoadingState =
    state === "generating-prompt" || state === "reviewing";

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-(--border) bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-(--shadow-md)">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-(--border) bg-white/60 px-6 py-4 backdrop-blur-sm">
        <div className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-teal-500 to-emerald-600 text-white shadow-(--shadow-sm)">
          <PenLine size={20} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold text-(--ink)">
            Luyện viết ✍️
          </h2>
          <p className="text-xs text-(--text-muted)">
            TOEIC Writing Practice · Chấm bài theo tiêu chí TOEIC
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(20,184,166,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center">
          {error && (
            <div className="mx-auto mb-4 max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {state === "prompt-selection" && (
              <motion.div
                key="gallery"
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PromptGallery
                  onSelect={generatePrompt}
                  isLoading={false}
                  loadingCategory={null}
                />
                <SubmissionHistory
                  submissions={history}
                  onView={viewSubmission}
                />
              </motion.div>
            )}

            {state === "generating-prompt" && (
              <motion.div
                key="generating"
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PromptGallery
                  onSelect={generatePrompt}
                  isLoading={true}
                  loadingCategory={loadingCategory}
                />
              </motion.div>
            )}

            {state === "writing" && category && (
              <motion.div
                key="editor"
                className="w-full"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <WritingEditor
                  prompt={prompt}
                  category={category}
                  hints={hints}
                  onSubmit={submitWriting}
                  isSubmitting={false}
                />
              </motion.div>
            )}

            {state === "reviewing" && (
              <motion.div
                key="reviewing"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="size-2.5 rounded-full bg-(--accent)"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-(--text-muted)">
                  Christine Ho đang chấm bài...
                </p>
              </motion.div>
            )}

            {state === "feedback" && feedback && (
              <motion.div
                key="feedback"
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FeedbackPanel
                  text={writtenText}
                  feedback={feedback}
                  onNewWriting={startNew}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
