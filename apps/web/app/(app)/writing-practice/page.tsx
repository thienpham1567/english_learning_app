"use client";

import { Flex, Spin, Typography, Tabs } from "antd";
import { EditOutlined, FormOutlined, HighlightOutlined, AimOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

import { useWritingPractice } from "@/hooks/useWritingPractice";
import { PromptGallery } from "@/app/(app)/writing-practice/_components/PromptGallery";
import { WritingEditor } from "@/app/(app)/writing-practice/_components/WritingEditor";
import { FeedbackPanel } from "@/app/(app)/writing-practice/_components/FeedbackPanel";
import { SubmissionHistory } from "@/app/(app)/writing-practice/_components/SubmissionHistory";
import { RewritePanel } from "@/app/(app)/writing-practice/_components/RewritePanel";
import { GuidedWritingPanel } from "@/app/(app)/writing-practice/_components/GuidedWritingPanel";

const { Title, Text } = Typography;

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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <ModuleHeader
        icon={<EditOutlined />}
        gradient="linear-gradient(135deg, var(--accent), var(--secondary))"
        title="Luyện viết"
        subtitle="TOEIC Writing Practice · Chấm bài theo tiêu chí TOEIC"
      />

      {/* Tabs */}
      <Flex
        vertical
        align="center"
        style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "0 16px 24px" }}
      >
        <div style={{ width: "100%", maxWidth: 800 }}>
          <Tabs
            defaultActiveKey="practice"
            style={{ marginTop: 8 }}
            items={[
              {
                key: "practice",
                label: <><FormOutlined /> Luyện viết</>,
                children: (
                  <div>
                    {error && (
                      <div
                        style={{
                          marginBottom: 16,
                          border: "1px solid color-mix(in srgb, var(--error) 20%, transparent)",
                          borderRadius: 10,
                          background: "var(--error-bg)",
                          color: "var(--error)",
                          padding: "10px 16px",
                          fontSize: 13,
                        }}
                      >
                        {error}
                      </div>
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
                        <Spin size="large" tip="Christine Ho đang chấm bài..." />
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
                children: (
                  <div style={{ paddingTop: 8 }}>
                    <RewritePanel />
                  </div>
                ),
              },
              {
                key: "guided",
                label: <><AimOutlined /> Viết có hướng dẫn</>,
                children: (
                  <div style={{ paddingTop: 8 }}>
                    <GuidedWritingPanel />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Flex>
    </div>
  );
}
