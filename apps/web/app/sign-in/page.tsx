"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  SafetyCertificateOutlined,
  StarFilled,
  CheckCircleFilled,
  MessageOutlined,
  FireOutlined,
  ReadOutlined,
  AudioOutlined,
} from "@ant-design/icons";
import { authClient } from "@/lib/auth-client";

/* ── Google icon ── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
  </svg>
);

/* ── Logo (right panel) ── */
function SignInLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, userSelect: "none" }}>
      <div style={{
        display: "grid",
        placeItems: "center",
        width: 40,
        height: 40,
        borderRadius: 12,
        background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, black))",
        boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)",
        flexShrink: 0,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div>
        <div style={{
          fontSize: 18,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: "-0.025em",
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
        }}>
          THIEN<span style={{ color: "var(--accent)" }}>GLISH</span>
        </div>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 1 }}>
          English Learning
        </div>
      </div>
    </div>
  );
}

/* ── Value prop row ── */
function ValueRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: "var(--accent-muted)",
        color: "var(--accent)",
        display: "grid", placeItems: "center",
        fontSize: 13,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

/* ── Sign-in form ── */
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
      await authClient.signIn.social({ provider: "google", callbackURL: "/english-chatbot" });
    } catch {
      setError("Không thể kết nối đến Google. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="anim-fade-up"
      style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 0 }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <SignInLogo />
      </div>

      {/* Heading */}
      <h1 style={{
        margin: "0 0 6px",
        fontSize: 30,
        fontWeight: 700,
        fontStyle: "italic",
        fontFamily: "var(--font-display)",
        color: "var(--text-primary)",
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
      }}>
        Chào mừng bạn
      </h1>
      <p style={{ margin: "0 0 28px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
        Đăng nhập để bắt đầu hành trình học tiếng Anh
      </p>

      {/* Value props */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginBottom: 28,
        padding: "16px 18px",
        borderRadius: 14,
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        <ValueRow icon={<MessageOutlined />} text="Luyện IELTS & TOEIC với gia sư AI" />
        <ValueRow icon={<AudioOutlined />} text="Luyện phát âm, nghe, đọc, viết toàn diện" />
        <ValueRow icon={<FireOutlined />} text="Thử thách mỗi ngày, giữ vững streak" />
      </div>

      {/* Google button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          width: "100%",
          height: 52,
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 600,
          border: "1.5px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text-primary)",
          cursor: isLoading ? "wait" : "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          transition: "all 0.2s ease",
          opacity: isLoading ? 0.7 : 1,
          marginBottom: 10,
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px color-mix(in srgb, var(--accent) 18%, transparent)";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        }}
      >
        {isLoading ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Đang đăng nhập...
          </span>
        ) : (
          <>
            <GoogleIcon />
            Đăng nhập bằng Google
          </>
        )}
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <SafetyCertificateOutlined style={{ fontSize: 11, color: "var(--text-muted)" }} />
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Bảo mật bởi Google OAuth 2.0</span>
      </div>

      {error && (
        <div style={{
          marginTop: 16,
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)",
          background: "color-mix(in srgb, var(--error) 8%, transparent)",
          color: "var(--error)",
          fontSize: 13,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

/* ── IPA watermark decorations ── */
const IPA_MARKS = [
  { symbol: "/iː/", top: "8%", left: "10%", size: 88, rotation: -12, delay: 0.1 },
  { symbol: "/æ/", top: "22%", right: "8%", size: 72, rotation: 8, delay: 0.2 },
  { symbol: "/θ/", top: "52%", left: "5%", size: 96, rotation: -6, delay: 0.3 },
  { symbol: "/ʃ/", bottom: "28%", right: "12%", size: 80, rotation: 14, delay: 0.15 },
  { symbol: "/aʊ/", bottom: "10%", left: "18%", size: 70, rotation: -10, delay: 0.25 },
  { symbol: "/ŋ/", top: "38%", left: "52%", size: 64, rotation: 5, delay: 0.35 },
];

/* ── Main page ── */
export default function SignInPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ── Left editorial panel ── */}
      <div
        className="desktop-only"
        style={{
          position: "relative",
          width: "46%",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "var(--sidebar-gradient)",
        }}
      >
        {/* Ambient glows */}
        <div style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 80% 50% at 60% 10%, color-mix(in srgb, var(--accent) 20%, transparent) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 20% 90%, color-mix(in srgb, var(--secondary, #4A7C6F) 14%, transparent) 0%, transparent 60%)",
        }} />

        {/* Grain */}
        <div className="grain-overlay" style={{ opacity: 0.04 }} />

        {/* Floating IPA watermarks */}
        {IPA_MARKS.map((m) => (
          <div
            key={m.symbol}
            style={{
              position: "absolute",
              top: m.top,
              bottom: (m as { bottom?: string }).bottom,
              left: (m as { left?: string }).left,
              right: (m as { right?: string }).right,
              fontSize: m.size,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontStyle: "italic",
              color: "var(--sidebar-text-active)",
              opacity: 0.04,
              transform: `rotate(${m.rotation}deg)`,
              lineHeight: 1,
              userSelect: "none",
              pointerEvents: "none",
              animation: `anim-fade-in 1s ease-out ${m.delay}s both`,
            }}
          >
            {m.symbol}
          </div>
        ))}

        {/* Content */}
        <div style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 380,
          padding: "0 44px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}>
          {/* Logo */}
          <div className="anim-fade-up" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, black))",
              display: "grid", placeItems: "center",
              boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 40%, transparent)",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--sidebar-text-active)",
            }}>
              THIEN<span style={{ color: "var(--accent)" }}>GLISH</span>
            </span>
          </div>

          {/* Hero quote */}
          <div className="anim-fade-up anim-delay-1">
            <blockquote style={{
              margin: 0,
              fontSize: 26,
              fontStyle: "italic",
              fontFamily: "var(--font-display)",
              fontWeight: 300,
              lineHeight: 1.45,
              color: "var(--sidebar-text-active)",
              letterSpacing: "-0.01em",
            }}>
              "Học tiếng Anh mỗi ngày, một câu chuyện mới mỗi ngày."
            </blockquote>
            <div style={{
              marginTop: 18,
              width: 40,
              height: 2,
              borderRadius: 99,
              background: "var(--accent)",
              opacity: 0.7,
            }} />
          </div>

          {/* Tagline */}
          <p className="anim-fade-up anim-delay-2" style={{
            margin: 0,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "var(--sidebar-text)",
            opacity: 0.6,
          }}>
            Trợ lý học tập tiếng Anh
          </p>

          {/* Stats */}
          <div className="anim-fade-up anim-delay-3" style={{ display: "flex", gap: 28 }}>
            {[
              { value: "10K+", label: "người dùng" },
              { value: "50K+", label: "bài luyện tập" },
              { value: "4.9 ★", label: "đánh giá" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  color: "var(--sidebar-text-active)",
                  lineHeight: 1.1,
                }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 10, color: "var(--sidebar-text)", opacity: 0.55, marginTop: 2, letterSpacing: "0.03em" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial card */}
          <div
            className="anim-fade-up anim-delay-4"
            style={{
              borderRadius: 16,
              border: "1px solid var(--sidebar-border)",
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(16px)",
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
              {[1,2,3,4,5].map((i) => (
                <StarFilled key={i} style={{ fontSize: 11, color: "#F59E0B" }} />
              ))}
            </div>
            <p style={{
              margin: "0 0 14px",
              fontSize: 13,
              fontStyle: "italic",
              lineHeight: 1.65,
              color: "var(--sidebar-text-active)",
              opacity: 0.85,
            }}>
              "App rất tiện, AI sửa lỗi phát âm giúp mình tự tin hơn khi nói tiếng Anh."
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, var(--accent), var(--secondary, #4A7C6F))",
                display: "grid", placeItems: "center",
                fontSize: 13, fontWeight: 700, color: "white",
              }}>
                M
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sidebar-text-active)" }}>Minh Anh</div>
                <div style={{ fontSize: 10, color: "var(--sidebar-text)", opacity: 0.5, marginTop: 1 }}>
                  <CheckCircleFilled style={{ marginRight: 3, color: "#10b981" }} />
                  Đã dùng 6 tháng
                </div>
              </div>
            </div>
          </div>

          {/* Feature pills at bottom */}
          <div className="anim-fade-up anim-delay-5" style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {[
              { icon: <MessageOutlined />, label: "AI Chat" },
              { icon: <ReadOutlined />, label: "Từ điển" },
              { icon: <AudioOutlined />, label: "Phát âm" },
              { icon: <FireOutlined />, label: "Daily" },
            ].map((p) => (
              <div key={p.label} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 11px",
                borderRadius: 99,
                border: "1px solid var(--sidebar-border)",
                background: "rgba(255,255,255,0.05)",
                color: "var(--sidebar-text)",
                fontSize: 11,
                fontWeight: 500,
              }}>
                {p.icon} {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "48px 28px",
        overflowY: "auto",
        position: "relative",
      }}>
        {/* Subtle top-right glow */}
        <div style={{
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          right: 0,
          width: "60%",
          height: "45%",
          background: "radial-gradient(ellipse at top right, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 70%)",
        }} />

        <Suspense fallback={null}>
          <SignInContent />
        </Suspense>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
