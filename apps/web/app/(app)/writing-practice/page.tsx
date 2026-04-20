"use client";

import { Flex, Spin, Typography, Tabs } from "antd";
import { EditOutlined } from "@ant-design/icons";

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
      <Flex
        align="center"
        gap={12}
        style={{
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "16px 24px",
        }}
      >
        <Flex
          align="center"
          justify="center"
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius)",
            background: "linear-gradient(135deg, #9AB17A, #C3CC9B)",
            color: "#fff",
          }}
        >
          <EditOutlined style={{ fontSize: 20 }} />
        </Flex>
        <Flex vertical style={{ flex: 1 }}>
          <Title level={5} style={{ margin: 0 }}>
            Luyện viết ✍️
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            TOEIC Writing Practice · Chấm bài theo tiêu chí TOEIC
          </Text>
        </Flex>
      </Flex>

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
                label: "📝 Luyện viết",
                children: (
                  <div>
                    {error && (
                      <div
                        style={{
                          marginBottom: 16,
                          border: "1px solid #fecaca",
                          borderRadius: 10,
                          background: "#fef2f2",
                          color: "#b91c1c",
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
                label: "✨ Cải thiện câu",
                children: (
                  <div style={{ paddingTop: 8 }}>
                    <RewritePanel />
                  </div>
                ),
              },
              {
                key: "guided",
                label: "🎯 Viết có hướng dẫn",
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
