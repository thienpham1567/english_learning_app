"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Alert, Button, Card, Divider, Flex, Typography } from "antd";
import {
  MessageOutlined,
  BookOutlined,
  ThunderboltOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  StarFilled,
  CheckCircleFilled,
} from "@ant-design/icons";
import { authClient } from "@/lib/auth-client";

const { Title, Text, Paragraph } = Typography;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      fill="#34A853"
    />
    <path
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      fill="#EA4335"
    />
  </svg>
);

const FEATURES = [
  {
    icon: <MessageOutlined style={{ fontSize: 20, color: "#52c41a" }} />,
    title: "Gia sư AI thông minh",
    desc: "Trò chuyện tự nhiên, sửa lỗi ngay, 3 phong cách dạy.",
    color: "#52c41a",
  },
  {
    icon: <BookOutlined style={{ fontSize: 20, color: "#1890ff" }} />,
    title: "Tra cứu từ điển",
    desc: "Tra từ, nghe phát âm, lưu vào bộ flashcard để ôn.",
    color: "#1890ff",
  },
  {
    icon: <ThunderboltOutlined style={{ fontSize: 20, color: "#faad14" }} />,
    title: "Thử thách hàng ngày",
    desc: "5 câu hỏi mỗi ngày, tích điểm XP và giữ streak.",
    color: "#faad14",
  },
  {
    icon: <EditOutlined style={{ fontSize: 20, color: "#722ed1" }} />,
    title: "Luyện viết & ngữ pháp",
    desc: "Viết bài, AI chấm điểm chi tiết theo từng tiêu chí.",
    color: "#722ed1",
  },
];

const STATS = [
  { value: "10K+", label: "người dùng" },
  { value: "50K+", label: "bài luyện tập" },
  { value: "4.9", label: "⭐ đánh giá" },
];

function SignInContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "Đăng nhập thất bại. Vui lòng thử lại." : null,
  );

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/english-chatbot",
      });
    } catch {
      setError("Không thể kết nối đến Google. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <Flex vertical align="center" className="anim-fade-up" style={{ width: "100%", maxWidth: 420 }}>

      {/* Logo + greeting */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <Image
          src="/english-logo-app.svg"
          alt="English logo app"
          width={250}
          height={150}
          style={{ height: 60, width: "auto", borderRadius: 14 }}
          priority
          unoptimized
        />
      </div>

      <Title
        level={2}
        className="anim-fade-up anim-delay-1"
        style={{
          marginTop: 20, marginBottom: 4,
          fontStyle: "italic",
          fontFamily: "var(--font-display)",
          fontSize: 28,
        }}
      >
        Chào mừng bạn 👋
      </Title>
      <Text type="secondary" className="anim-fade-up anim-delay-1" style={{ fontSize: 14 }}>
        Đăng nhập để bắt đầu hành trình học tiếng Anh
      </Text>

      {/* Value props */}
      <Card
        className="anim-fade-up anim-delay-2"
        style={{
          width: "100%", marginTop: 24, borderRadius: 16,
          background: "var(--surface)", border: "1px solid var(--border)",
        }}
        styles={{ body: { padding: "14px 18px" } }}
      >
        <Flex vertical gap={10}>
          {[
            { icon: <RocketOutlined style={{ color: "var(--accent)" }} />, text: "Luyện IELTS & TOEIC với gia sư AI" },
            { icon: <BookOutlined style={{ color: "var(--accent)" }} />, text: "Tra từ, lưu từ, ôn tập tự động" },
            { icon: <StarFilled style={{ color: "var(--accent)" }} />, text: "Thử thách mỗi ngày, giữ vững streak" },
          ].map((item) => (
            <Flex key={item.text} align="center" gap={10}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <Text style={{ fontSize: 13, fontWeight: 500 }}>{item.text}</Text>
            </Flex>
          ))}
        </Flex>
      </Card>

      {/* Sign in button */}
      <div className="anim-fade-up anim-delay-3" style={{ width: "100%", marginTop: 24 }}>
        <Button
          block
          size="large"
          icon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          loading={isLoading}
          style={{
            borderRadius: 14, height: 52, fontSize: 15, fontWeight: 600,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          Đăng nhập bằng Google
        </Button>

        <Flex align="center" justify="center" gap={6} style={{ marginTop: 12 }}>
          <SafetyCertificateOutlined style={{ fontSize: 12, color: "var(--text-muted)" }} />
          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Bảo mật bởi Google OAuth 2.0
          </Text>
        </Flex>
      </div>

      {error && (
        <Alert
          className="anim-fade-up"
          type="error"
          message={error}
          showIcon
          style={{ marginTop: 16, width: "100%", borderRadius: 12 }}
        />
      )}

      {/* Feature cards */}
      <Divider className="anim-fade-up anim-delay-3" style={{ margin: "24px 0 16px" }}>
        <Text type="secondary" style={{ fontSize: 12, letterSpacing: "0.06em", fontWeight: 600 }}>
          TÍNH NĂNG NỔI BẬT
        </Text>
      </Divider>

      <div
        className="anim-fade-up anim-delay-4"
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        {FEATURES.map((card) => (
          <Card
            key={card.title}
            hoverable
            style={{
              borderRadius: 14,
              transition: "all 0.2s ease",
            }}
            styles={{ body: { padding: "14px 16px" } }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${card.color}12`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 10,
            }}>
              {card.icon}
            </div>
            <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
              {card.title}
            </Text>
            <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.5 }}>
              {card.desc}
            </Text>
          </Card>
        ))}
      </div>
    </Flex>
  );
}

export default function SignInPage() {
  return (
    <Flex style={{ minHeight: "100vh" }}>
      {/* Left editorial panel — hidden on mobile */}
      <Flex
        vertical
        align="center"
        justify="center"
        className="desktop-only"
        style={{
          position: "relative",
          width: "45%",
          overflow: "hidden",
          background: "var(--ink)",
        }}
      >
        {/* Grain overlay */}
        <div className="grain-overlay" style={{ opacity: 0.04 }} />

        {/* Multi-layer gradient glow */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 60% at 75% 15%, rgba(116,196,201,0.22) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 85%, rgba(144,208,212,0.12) 0%, transparent 60%)",
          }}
        />

        <Flex
          vertical
          align="center"
          gap={32}
          style={{ position: "relative", zIndex: 10, maxWidth: 380, padding: "0 40px" }}
        >
          {/* Quote */}
          <div className="anim-fade-up anim-delay-1" style={{ textAlign: "center" }}>
            <Paragraph
              style={{
                fontSize: 32,
                fontWeight: 300,
                fontStyle: "italic",
                lineHeight: 1.4,
                color: "rgba(255,255,255,0.9)",
                fontFamily: "var(--font-display)",
                margin: 0,
              }}
            >
              &quot;Học tiếng Anh mỗi ngày, một câu chuyện mới mỗi ngày.&quot;
            </Paragraph>
          </div>

          <Divider
            className="anim-fade-up anim-delay-2"
            style={{ width: 48, minWidth: 48, borderColor: "rgba(116,196,201,0.4)", margin: 0 }}
          />

          <Text
            className="anim-fade-up anim-delay-3"
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Trợ lý học tập tiếng Anh
          </Text>

          {/* Floating stats on left panel */}
          <Flex
            gap={20}
            justify="center"
            className="anim-fade-up anim-delay-4"
          >
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <Text style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.9)", display: "block", fontFamily: "var(--font-display)" }}>
                  {s.value}
                </Text>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {s.label}
                </Text>
              </div>
            ))}
          </Flex>

          {/* Floating testimonial card */}
          <Card
            className="anim-fade-up anim-delay-5"
            style={{
              borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(12px)",
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Flex vertical gap={8}>
              <Flex gap={4}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarFilled key={i} style={{ fontSize: 12, color: "#faad14" }} />
                ))}
              </Flex>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontStyle: "italic", lineHeight: 1.6 }}>
                &quot;App rất tiện, AI sửa lỗi phát âm giúp mình tự tin hơn khi nói tiếng Anh.&quot;
              </Text>
              <Flex align="center" gap={8}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>M</Text>
                </div>
                <div>
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Minh Anh</Text>
                  <br />
                  <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                    <CheckCircleFilled style={{ marginRight: 3 }} /> Đã dùng 6 tháng
                  </Text>
                </div>
              </Flex>
            </Flex>
          </Card>
        </Flex>
      </Flex>

      {/* Right form panel */}
      <Flex
        flex={1}
        align="center"
        justify="center"
        style={{ background: "var(--bg)", padding: "48px 28px", overflowY: "auto" }}
      >
        <Suspense fallback={null}>
          <SignInContent />
        </Suspense>
      </Flex>
    </Flex>
  );
}
