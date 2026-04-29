"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Button, Divider, Flex, Typography } from "antd";
import {
  MessageOutlined,
  BookOutlined,
  ThunderboltOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  StarFilled,
  CheckCircleFilled,
  SoundOutlined,
  TranslationOutlined,
} from "@ant-design/icons";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/shared/Logo";

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
    icon: <MessageOutlined style={{ fontSize: 18 }} />,
    title: "Gia sư AI thông minh",
    desc: "Trò chuyện tự nhiên, sửa lỗi ngay, 3 phong cách dạy.",
    gradient: "linear-gradient(135deg, var(--accent), var(--secondary))",
  },
  {
    icon: <BookOutlined style={{ fontSize: 18 }} />,
    title: "Tra cứu từ điển",
    desc: "Tra từ, nghe phát âm, lưu vào bộ flashcard để ôn.",
    gradient: "linear-gradient(135deg, var(--tertiary), var(--accent))",
  },
  {
    icon: <ThunderboltOutlined style={{ fontSize: 18 }} />,
    title: "Thử thách hàng ngày",
    desc: "5 câu hỏi mỗi ngày, tích điểm XP và giữ streak.",
    gradient: "linear-gradient(135deg, var(--fire, var(--warning)), var(--error))",
  },
  {
    icon: <EditOutlined style={{ fontSize: 18 }} />,
    title: "Luyện viết & ngữ pháp",
    desc: "Viết bài, AI chấm điểm chi tiết theo từng tiêu chí.",
    gradient: "linear-gradient(135deg, var(--secondary), var(--tertiary))",
  },
];

const STATS = [
  { value: "10K+", label: "người dùng" },
  { value: "50K+", label: "bài luyện tập" },
  { value: "4.9", label: "đánh giá", icon: <StarFilled style={{ fontSize: 10 }} /> },
];

/* ── Sign-in Logo (for right panel, adapts to page bg) ── */
function SignInLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, userSelect: "none" }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 50%, black))",
          boxShadow: "0 6px 20px color-mix(in srgb, var(--accent) 35%, transparent)",
          flexShrink: 0,
        }}
      >
        <TranslationOutlined style={{ fontSize: 24, color: "var(--text-on-accent)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span
          style={{
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          THIEN<span style={{ color: "var(--accent)" }}>GLISH</span>
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "var(--text-muted)",
            marginTop: 2,
          }}
        >
          English Learning
        </span>
      </div>
    </div>
  );
}

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

      {/* Logo */}
      <div className="anim-fade-up" style={{ marginBottom: 24 }}>
        <SignInLogo />
      </div>

      <Title
        level={2}
        className="anim-fade-up anim-delay-1"
        style={{
          marginTop: 8, marginBottom: 4,
          fontStyle: "italic",
          fontFamily: "var(--font-display)",
          fontSize: 28,
        }}
      >
        Chào mừng bạn
      </Title>
      <Text type="secondary" className="anim-fade-up anim-delay-1" style={{ fontSize: 14 }}>
        Đăng nhập để bắt đầu hành trình học tiếng Anh
      </Text>

      {/* Value props */}
      <div
        className="anim-fade-up anim-delay-2"
        style={{
          width: "100%", marginTop: 24, borderRadius: 18,
          background: "var(--surface)", border: "1px solid var(--border)",
          padding: "16px 20px",
        }}
      >
        <Flex vertical gap={12}>
          {[
            { icon: <RocketOutlined style={{ color: "var(--accent)" }} />, text: "Luyện IELTS & TOEIC với gia sư AI" },
            { icon: <SoundOutlined style={{ color: "var(--accent)" }} />, text: "Luyện phát âm, nghe, đọc, viết toàn diện" },
            { icon: <StarFilled style={{ color: "var(--accent)" }} />, text: "Thử thách mỗi ngày, giữ vững streak" },
          ].map((item) => (
            <Flex key={item.text} align="center" gap={12}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                display: "grid", placeItems: "center",
                flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <Text style={{ fontSize: 13, fontWeight: 500 }}>{item.text}</Text>
            </Flex>
          ))}
        </Flex>
      </div>

      {/* Sign in button */}
      <div className="anim-fade-up anim-delay-3" style={{ width: "100%", marginTop: 24 }}>
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            borderRadius: 14,
            height: 52,
            fontSize: 15,
            fontWeight: 600,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--ink)",
            cursor: isLoading ? "wait" : "pointer",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            transition: "all 0.2s ease",
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 4px 20px color-mix(in srgb, var(--accent) 15%, transparent)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
          }}
        >
          <GoogleIcon />
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập bằng Google"}
        </button>

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
      <Divider className="anim-fade-up anim-delay-3" style={{ margin: "28px 0 16px" }}>
        <Text type="secondary" style={{ fontSize: 11, letterSpacing: "0.08em", fontWeight: 600 }}>
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
          <div
            key={card.title}
            style={{
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              padding: "16px 16px",
              transition: "all 0.2s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 40%, transparent)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: card.gradient,
              display: "grid", placeItems: "center",
              marginBottom: 10,
              color: "var(--text-on-accent)",
            }}>
              {card.icon}
            </div>
            <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
              {card.title}
            </Text>
            <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.5 }}>
              {card.desc}
            </Text>
          </div>
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
          background: "var(--sidebar-bg, var(--bg-deep))",
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
              "radial-gradient(ellipse 70% 60% at 75% 15%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 85%, color-mix(in srgb, var(--secondary) 12%, transparent) 0%, transparent 60%)",
          }}
        />

        <Flex
          vertical
          align="center"
          gap={32}
          style={{ position: "relative", zIndex: 10, maxWidth: 380, padding: "0 40px" }}
        >
          {/* Logo on left panel */}
          <div className="anim-fade-up">
            <Logo collapsed={false} />
          </div>

          {/* Quote */}
          <div className="anim-fade-up anim-delay-1" style={{ textAlign: "center" }}>
            <Paragraph
              style={{
                fontSize: 28,
                fontWeight: 300,
                fontStyle: "italic",
                lineHeight: 1.4,
                color: "var(--sidebar-text-active, rgba(255,255,255,0.9))",
                fontFamily: "var(--font-display)",
                margin: 0,
              }}
            >
              &quot;Học tiếng Anh mỗi ngày, một câu chuyện mới mỗi ngày.&quot;
            </Paragraph>
          </div>

          <Divider
            className="anim-fade-up anim-delay-2"
            style={{ width: 48, minWidth: 48, borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)", margin: 0 }}
          />

          <Text
            className="anim-fade-up anim-delay-3"
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "var(--sidebar-text, rgba(255,255,255,0.4))",
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
                <Text style={{ fontSize: 22, fontWeight: 700, color: "var(--sidebar-text-active, rgba(255,255,255,0.9))", display: "block", fontFamily: "var(--font-display)" }}>
                  {s.value}
                </Text>
                <Text style={{ fontSize: 11, color: "var(--sidebar-text, rgba(255,255,255,0.4))", display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {s.icon} {s.label}
                </Text>
              </div>
            ))}
          </Flex>

          {/* Floating testimonial card */}
          <div
            className="anim-fade-up anim-delay-5"
            style={{
              borderRadius: 18,
              border: "1px solid var(--sidebar-border, rgba(255,255,255,0.1))",
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(12px)",
              padding: "18px 22px",
            }}
          >
            <Flex vertical gap={10}>
              <Flex gap={3}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarFilled key={i} style={{ fontSize: 12, color: "var(--xp)" }} />
                ))}
              </Flex>
              <Text style={{ fontSize: 13, color: "var(--sidebar-text-active, rgba(255,255,255,0.8))", fontStyle: "italic", lineHeight: 1.6 }}>
                &quot;App rất tiện, AI sửa lỗi phát âm giúp mình tự tin hơn khi nói tiếng Anh.&quot;
              </Text>
              <Flex align="center" gap={10}>
                <div style={{
                  width: 30, height: 30, borderRadius: 10,
                  background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                  display: "grid", placeItems: "center",
                }}>
                  <Text style={{ fontSize: 13, color: "var(--text-on-accent)", fontWeight: 700 }}>M</Text>
                </div>
                <div>
                  <Text style={{ fontSize: 12, color: "var(--sidebar-text-active, rgba(255,255,255,0.7))", fontWeight: 600 }}>Minh Anh</Text>
                  <br />
                  <Text style={{ fontSize: 10, color: "var(--sidebar-text, rgba(255,255,255,0.35))" }}>
                    <CheckCircleFilled style={{ marginRight: 3 }} /> Đã dùng 6 tháng
                  </Text>
                </div>
              </Flex>
            </Flex>
          </div>
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
