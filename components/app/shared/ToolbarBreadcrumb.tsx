"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb, Flex, Typography } from "antd";

const { Text, Title } = Typography;

const BREADCRUMBS: Record<string, { eyebrow: string; title: string }> = {
  "/english-chatbot": { eyebrow: "Trợ lý học tập", title: "Trò chuyện" },
  "/dictionary": { eyebrow: "Từ điển", title: "Christine Ho" },
  "/my-vocabulary": { eyebrow: "Từ vựng của tôi", title: "Từ vựng" },
  "/flashcards": { eyebrow: "Ôn tập từ vựng", title: "Flashcards" },
  "/grammar-quiz": { eyebrow: "TOEIC Part 5", title: "Grammar Quiz" },
  "/writing-practice": { eyebrow: "TOEIC Writing", title: "Luyện viết" },
  "/daily-challenge": { eyebrow: "Thử thách mỗi ngày", title: "Daily Challenge" },
};

export function ToolbarBreadcrumb() {
  const pathname = usePathname();
  const crumb = BREADCRUMBS[pathname] ?? null;
  if (!crumb) return null;

  return (
    <Flex vertical justify="center">
      <Text
        type="secondary"
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          lineHeight: 1,
        }}
      >
        {crumb.eyebrow}
      </Text>
      <Title level={5} style={{ margin: "2px 0 0", fontSize: 14, lineHeight: 1.4 }}>
        {crumb.title}
      </Title>
    </Flex>
  );
}
