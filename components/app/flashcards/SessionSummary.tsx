"use client";

import { Card, Flex, Space, Statistic, Typography, Button } from "antd";
import {
  BarChartOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

type Props = {
  totalReviewed: number;
  averageQuality: number;
  forgottenCount: number;
  onRestart?: () => void;
};

export function SessionSummary({
  totalReviewed,
  averageQuality,
  forgottenCount,
  onRestart,
}: Props) {
  const emoji =
    averageQuality >= 4 ? "🎉" : averageQuality >= 3 ? "👏" : averageQuality >= 2 ? "👍" : "💪";

  return (
    <Flex
      vertical
      align="center"
      className="anim-scale-in"
      style={{ maxWidth: 480, margin: "0 auto" }}
    >
      <span className="anim-bounce-emoji" style={{ fontSize: 60 }}>
        {emoji}
      </span>

      <Title
        level={2}
        style={{ marginTop: 16, fontFamily: "var(--font-display)", fontStyle: "italic" }}
      >
        Hoàn thành!
      </Title>
      <Text type="secondary">Bạn đã ôn xong {totalReviewed} thẻ trong phiên này.</Text>

      <Space size={16} style={{ marginTop: 32, width: "100%" }}>
        {[
          { icon: <BarChartOutlined />, label: "Đã ôn", value: totalReviewed, delay: 1 },
          {
            icon: <ThunderboltOutlined />,
            label: "Điểm TB",
            value: averageQuality.toFixed(1),
            delay: 2,
          },
          { icon: <WarningOutlined />, label: "Quên", value: forgottenCount, delay: 3 },
        ].map((stat) => (
          <Card
            key={stat.label}
            size="small"
            className={`anim-fade-up anim-delay-${stat.delay}`}
            style={{ flex: 1, textAlign: "center" }}
          >
            <Statistic
              title={stat.label}
              value={stat.value}
              prefix={stat.icon}
              valueStyle={{ color: "var(--accent)", fontSize: 20 }}
            />
          </Card>
        ))}
      </Space>

      {onRestart && (
        <Button
          className="anim-fade-up anim-delay-5"
          icon={<ReloadOutlined />}
          onClick={onRestart}
          size="large"
          style={{ marginTop: 32 }}
        >
          Ôn lại
        </Button>
      )}
    </Flex>
  );
}
