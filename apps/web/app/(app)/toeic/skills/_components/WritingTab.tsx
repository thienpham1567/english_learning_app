"use client";

import { Flex, Skeleton, Tabs } from "antd";
import { FormOutlined, HighlightOutlined, AimOutlined } from "@ant-design/icons";

import { useWritingPractice } from "@/hooks/useWritingPractice";
import { PromptGallery } from "./writing/PromptGallery";
import { WritingEditor } from "./writing/WritingEditor";
import { FeedbackPanel } from "./writing/FeedbackPanel";
import { SubmissionHistory } from "./writing/SubmissionHistory";
import { RewritePanel } from "./writing/RewritePanel";
import { GuidedWritingPanel } from "./writing/GuidedWritingPanel";

export function WritingTab() {
  const {
    state, category, prompt, hints, writtenText, feedback,
    error, history, loadingCategory,
    generatePrompt, submitWriting, viewSubmission, startNew,
  } = useWritingPractice();

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
      <Tabs
        defaultActiveKey="practice"
        style={{ marginTop: 4 }}
        items={[
          {
            key: "practice",
            label: <><FormOutlined /> Luyện viết</>,
            children: (
              <div>
                {error && (
                  <div style={{ marginBottom: 16, border: "1px solid color-mix(in srgb, var(--error) 20%, transparent)", borderRadius: 10, background: "var(--error-bg)", color: "var(--error)", padding: "10px 16px", fontSize: 13 }}>{error}</div>
                )}
                {state === "prompt-selection" && (
                  <div style={{ width: "100%" }}>
                    <PromptGallery onSelect={generatePrompt} isLoading={false} loadingCategory={null} />
                    <SubmissionHistory submissions={history} onView={viewSubmission} />
                  </div>
                )}
                {state === "generating-prompt" && (
                  <div style={{ width: "100%" }}>
                    <PromptGallery onSelect={generatePrompt} isLoading={true} loadingCategory={loadingCategory} />
                  </div>
                )}
                {state === "writing" && category && (
                  <div style={{ width: "100%" }}>
                    <WritingEditor prompt={prompt} category={category} hints={hints} onSubmit={submitWriting} isSubmitting={false} />
                  </div>
                )}
                {state === "reviewing" && (
                  <Flex vertical align="center" gap={16} style={{ paddingTop: 48 }}>
                    <Skeleton active paragraph={{ rows: 5 }} style={{ maxWidth: 500 }} />
                    <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Christine Ho đang chấm bài...</p>
                  </Flex>
                )}
                {state === "feedback" && feedback && (
                  <div style={{ width: "100%" }}>
                    <FeedbackPanel text={writtenText} feedback={feedback} onNewWriting={startNew} />
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "rewrite",
            label: <><HighlightOutlined /> Cải thiện câu</>,
            children: <div style={{ paddingTop: 8 }}><RewritePanel /></div>,
          },
          {
            key: "guided",
            label: <><AimOutlined /> Viết có hướng dẫn</>,
            children: <div style={{ paddingTop: 8 }}><GuidedWritingPanel /></div>,
          },
        ]}
      />
    </div>
  );
}
