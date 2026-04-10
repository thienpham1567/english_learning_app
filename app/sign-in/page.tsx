"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Alert, Button, Card, Divider, Flex, Typography } from "antd";
import { GoogleOutlined } from "@ant-design/icons";
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
    <Flex vertical align="center" className="anim-fade-up" style={{ width: "100%", maxWidth: 380 }}>
      <Image
        src="/english-logo-app.svg"
        alt="English logo app"
        width={250}
        height={150}
        style={{ height: 56, width: "auto", borderRadius: 12 }}
        priority
        unoptimized
      />

      <Title
        level={1}
        style={{
          marginTop: 20,
          fontStyle: "italic",
          fontFamily: "var(--font-display)",
        }}
      >
        Xin chào
      </Title>
      <Text type="secondary">Đăng nhập để bắt đầu luyện tiếng Anh</Text>

      <Divider />

      <Button
        block
        size="large"
        icon={<GoogleIcon />}
        onClick={handleGoogleSignIn}
        loading={isLoading}
        style={{ borderRadius: "var(--radius)" }}
      >
        Đăng nhập bằng Google
      </Button>

      {error && (
        <Alert
          className="anim-fade-up"
          type="error"
          message={error}
          showIcon
          style={{ marginTop: 16, width: "100%" }}
        />
      )}
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
        {/* Warm radial glow — using new palette warm */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 60% at 75% 15%, rgba(154,177,122,0.22) 0%, transparent 70%)",
          }}
        />

        <Flex
          vertical
          align="center"
          style={{ position: "relative", zIndex: 10, maxWidth: 340, padding: "0 40px" }}
        >
          <Paragraph
            className="anim-fade-up anim-delay-1"
            style={{
              fontSize: 36,
              fontWeight: 300,
              fontStyle: "italic",
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.9)",
              fontFamily: "var(--font-display)",
              textAlign: "center",
            }}
          >
            &quot;Học tiếng Anh mỗi ngày, một câu chuyện mới mỗi ngày.&quot;
          </Paragraph>

          <Divider
            className="anim-fade-up anim-delay-3"
            style={{ width: 48, minWidth: 48, borderColor: "rgba(154,177,122,0.4)" }}
          />

          <Text
            className="anim-fade-up anim-delay-4"
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Trợ lý học tập tiếng Anh
          </Text>
        </Flex>
      </Flex>

      {/* Right form panel */}
      <Flex
        flex={1}
        align="center"
        justify="center"
        style={{ background: "var(--bg)", padding: "64px 32px" }}
      >
        <Suspense fallback={null}>
          <SignInContent />
        </Suspense>
      </Flex>
    </Flex>
  );
}
