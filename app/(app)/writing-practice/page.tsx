"use client";

import { Card, Flex, Spin, Typography } from "antd";
import { EditOutlined } from "@ant-design/icons";

import { useWritingPractice } from "@/hooks/useWritingPractice";
import { PromptGallery } from "@/components/app/writing-practice/PromptGallery";
import { WritingEditor } from "@/components/app/writing-practice/WritingEditor";
import { FeedbackPanel } from "@/components/app/writing-practice/FeedbackPanel";
import { SubmissionHistory } from "@/components/app/writing-practice/SubmissionHistory";

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
    <Card
      style={{
        height: "100%",
        minHeight: 0,
        flex: 1,
        overflow: "hidden",
        boxShadow: "var(--shadow-md)",
      }}
      styles={{ body: { display: "flex", flexDirection: "column", height: "100%", padding: 0 } }}
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

      {/* Content */}
      <Flex
        vertical
        align="center"
        justify="center"
        style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "24px 16px" }}
      >
        <div style={{ width: "100%", maxWidth: 800 }}>
          {error && (
            <Card
              size="small"
              style={{
                marginBottom: 16,
                maxWidth: 480,
                margin: "0 auto 16px",
                textAlign: "center",
                borderColor: "#fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
              }}
            >
              {error}
            </Card>
          )}

          {state === "prompt-selection" && (
            <div style={{ width: "100%" }}>
              <PromptGallery onSelect={generatePrompt} isLoading={false} loadingCategory={null} />
              <SubmissionHistory submissions={history} onView={viewSubmission} />
            </div>
          )}

          {state === "generating-prompt" && (
            <div style={{ width: "100%" }}>
              <PromptGallery
                onSelect={generatePrompt}
                isLoading={true}
                loadingCategory={loadingCategory}
              />
            </div>
          )}

          {state === "writing" && category && (
            <div style={{ width: "100%" }}>
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
            <Flex vertical align="center" gap={16}>
              <Spin size="large" tip="Christine Ho đang chấm bài..." />
            </Flex>
          )}

          {state === "feedback" && feedback && (
            <div style={{ width: "100%" }}>
              <FeedbackPanel text={writtenText} feedback={feedback} onNewWriting={startNew} />
            </div>
          )}
        </div>
      </Flex>
    </Card>
  );
}
