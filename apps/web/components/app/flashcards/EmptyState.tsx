"use client";

import { useEffect, useState } from "react";
import { Button, Card, Flex, Result, Space, Typography } from "antd";
import { SmileOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

type Props = {
  nextReviewAt: string | null;
};

export function EmptyState({ nextReviewAt }: Props) {
  return (
    <Flex vertical align="center" className="anim-fade-in" style={{ margin: "auto" }}>
      <Result
        icon={<SmileOutlined style={{ color: "var(--accent)" }} />}
        title={
          <Title level={3} style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
            🎉 Bạn đã ôn xong!
          </Title>
        }
        subTitle="Không có thẻ nào cần ôn lúc này. Quay lại sau nhé!"
      />
      {nextReviewAt && <Countdown targetIso={nextReviewAt} />}
    </Flex>
  );
}

function Countdown({ targetIso }: { targetIso: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetIso).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Sẵn sàng ôn!");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setRemaining(`${h}h ${m}m`);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [targetIso]);

  return (
    <Card size="small" className="anim-fade-up anim-delay-4" style={{ borderRadius: 999 }}>
      <Space>
        <ClockCircleOutlined />
        <Text>
          Thẻ tiếp theo: <Text strong>{remaining}</Text>
        </Text>
      </Space>
    </Card>
  );
}
