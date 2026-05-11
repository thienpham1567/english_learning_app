"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import * as m from "motion/react-client";
import {
  SafetyCertificateOutlined,
  CheckCircleFilled,
  CustomerServiceOutlined,
  ReadOutlined,
  AudioOutlined,
  FormOutlined,
  ThunderboltOutlined,
  FireOutlined,
  AimOutlined,
  TranslationOutlined,
} from "@ant-design/icons";
import { authClient } from "@/lib/auth-client";

/* ── Shared animation variants ── */
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const fadeIn = { hidden: { opacity: 0 }, show: { opacity: 1 } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

/* ── Google icon ── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
  </svg>
);

/* ── Floating skill badge ── */
const BADGES = [
  { icon: <CustomerServiceOutlined />, label: "Listening", top: "18%", right: "10%", delay: 0.3 },
  { icon: <ReadOutlined />, label: "Reading", top: "34%", right: "22%", delay: 0.5 },
  { icon: <AudioOutlined />, label: "Speaking", bottom: "38%", left: "8%", delay: 0.7 },
  { icon: <FormOutlined />, label: "Writing", bottom: "28%", right: "14%", delay: 0.4 },
];

/* ── Feature row ── */
function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <m.div variants={fadeUp} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: "color-mix(in srgb, var(--accent) 10%, var(--surface))",
        border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)",
        display: "grid", placeItems: "center",
        color: "var(--accent)", fontSize: 17,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, marginTop: 2 }}>{desc}</div>
      </div>
    </m.div>
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
      await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
    } catch {
      setError("Không thể kết nối đến Google. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <m.div
      initial="hidden" animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
      style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column" }}
    >
      {/* Logo */}
      <m.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
        <m.div
          whileHover={{ scale: 1.05, rotate: -3 }}
          transition={{ type: "spring", stiffness: 400 }}
          style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 50%, black))",
            boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)",
            display: "grid", placeItems: "center",
          }}
        >
          <TranslationOutlined style={{ fontSize: 21, color: "#fff" }} />
        </m.div>
        <div>
          <div style={{
            fontSize: 20, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.025em",
            color: "var(--ink)", fontFamily: "var(--font-display)",
          }}>
            TOEIC<span style={{ color: "var(--accent)" }}> Master</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 2 }}>
            Luyện thi TOEIC 4 Skills
          </div>
        </div>
      </m.div>

      {/* Heading */}
      <m.h1 variants={fadeUp} style={{
        margin: "0 0 6px", fontSize: 32, fontWeight: 700,
        fontStyle: "italic", fontFamily: "var(--font-display)",
        color: "var(--ink)", lineHeight: 1.15, letterSpacing: "-0.02em",
      }}>
        Chào mừng bạn
      </m.h1>
      <m.p variants={fadeUp} style={{ margin: "0 0 32px", fontSize: 15, color: "var(--text-muted)", lineHeight: 1.5 }}>
        Đăng nhập để bắt đầu chinh phục TOEIC
      </m.p>

      {/* Features */}
      <m.div variants={stagger} style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 36 }}>
        <Feature icon={<ThunderboltOutlined />} title="AI chấm điểm thông minh" desc="Đánh giá chính xác Speaking, Writing và dự đoán điểm TOEIC" />
        <Feature icon={<AimOutlined />} title="Luyện đủ 4 kỹ năng" desc="Listening · Reading · Speaking · Writing — đúng format TOEIC" />
        <Feature icon={<FireOutlined />} title="Streak & thử thách mỗi ngày" desc="Duy trì động lực học với thử thách hàng ngày và XP tích lũy" />
      </m.div>

      {/* Google button */}
      <m.button
        variants={fadeUp}
        whileHover={{ y: -2, boxShadow: "0 8px 28px color-mix(in srgb, var(--accent) 22%, transparent)" }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          width: "100%", height: 56, borderRadius: 16,
          fontSize: 16, fontWeight: 600,
          border: "1.5px solid var(--border)",
          background: "var(--surface)", color: "var(--ink)",
          cursor: isLoading ? "wait" : "pointer",
          boxShadow: "var(--shadow-md)",
          opacity: isLoading ? 0.7 : 1,
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
          <><GoogleIcon /> Đăng nhập bằng Google</>
        )}
      </m.button>

      {/* Security */}
      <m.div variants={fadeIn} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 }}>
        <SafetyCertificateOutlined style={{ fontSize: 12, color: "var(--text-muted)" }} />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Bảo mật bởi Google OAuth 2.0</span>
      </m.div>

      {error && (
        <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{
          marginTop: 16, padding: "12px 16px", borderRadius: 12,
          border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)",
          background: "color-mix(in srgb, var(--error) 8%, transparent)",
          color: "var(--error)", fontSize: 13,
        }}>
          {error}
        </m.div>
      )}
    </m.div>
  );
}

/* ── Score ring decoration ── */
function ScoreRing() {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.25, scale: 1 }}
      transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
      style={{
        position: "absolute", bottom: "6%", left: "50%", transform: "translateX(-50%)",
        width: 220, height: 130,
      }}
    >
      <svg viewBox="0 0 220 130" fill="none" style={{ width: "100%", height: "100%" }}>
        <m.path
          d="M20 120 A90 90 0 0 1 200 120"
          stroke="rgba(200,75,49,0.5)" strokeWidth="3" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ delay: 1.2, duration: 1.5, ease: "easeInOut" }}
        />
        <m.path
          d="M20 120 A90 90 0 0 1 170 40"
          stroke="rgba(200,75,49,0.8)" strokeWidth="4" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ delay: 1.4, duration: 1.2, ease: "easeInOut" }}
        />
      </svg>
      <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Score</div>
        <div style={{ fontSize: 52, fontWeight: 800, fontFamily: "var(--font-display)", fontStyle: "italic", color: "rgba(255,255,255,0.15)", lineHeight: 1, letterSpacing: "-0.03em" }}>990</div>
      </div>
    </m.div>
  );
}

/* ── Main page ── */
export default function SignInPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ── Left editorial panel ── */}
      <div
        className="desktop-only"
        style={{
          position: "relative", width: "44%", flexShrink: 0,
          display: "flex", flexDirection: "column",
          alignItems: "flex-start", justifyContent: "center",
          overflow: "hidden", background: "#1a1410",
        }}
      >
        {/* Ambient glows */}
        <div style={{
          pointerEvents: "none", position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 50% at 30% 20%, rgba(200,75,49,0.12) 0%, transparent 65%), radial-gradient(ellipse 70% 40% at 70% 85%, rgba(200,75,49,0.15) 0%, transparent 55%)",
        }} />
        <div className="grain-overlay" style={{ opacity: 0.06 }} />

        {/* Floating skill badges with Motion */}
        {BADGES.map((b) => (
          <m.div
            key={b.label}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
            transition={{
              opacity: { delay: b.delay, duration: 0.5 },
              scale: { delay: b.delay, duration: 0.5 },
              y: { delay: b.delay + 0.5, duration: 4, repeat: Infinity, ease: "easeInOut" },
            }}
            style={{
              position: "absolute",
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 14,
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 600,
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              top: (b as any).top, right: (b as any).right,
              bottom: (b as any).bottom, left: (b as any).left,
            }}
          >
            <span style={{ fontSize: 16, opacity: 0.8 }}>{b.icon}</span>
            {b.label}
          </m.div>
        ))}

        <ScoreRing />

        {/* Content */}
        <m.div
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }}
          style={{ position: "relative", zIndex: 1, padding: "0 48px", maxWidth: 420 }}
        >
          <m.h2 variants={fadeUp} style={{
            margin: 0, fontSize: 52, fontWeight: 700,
            fontStyle: "italic", fontFamily: "var(--font-display)",
            lineHeight: 1.1, letterSpacing: "-0.02em", color: "#F0E8DC",
          }}>
            Master<br />Your<br />
            <span style={{ color: "#C84B31" }}>TOEIC</span><br />Score
          </m.h2>

          <m.div variants={fadeUp} style={{
            width: 48, height: 3, borderRadius: 99,
            background: "linear-gradient(90deg, #C84B31, rgba(200,75,49,0.3))",
            margin: "24px 0",
          }} />

          <m.p variants={fadeUp} style={{
            margin: "0 0 32px", fontSize: 15, lineHeight: 1.7,
            color: "rgba(240,232,220,0.5)", maxWidth: 300,
          }}>
            Luyện thi TOEIC 4 Skills với AI — Listening, Reading, Speaking, Writing
          </m.p>

          {/* Stats */}
          <m.div variants={fadeUp} style={{ display: "flex", gap: 32 }}>
            {[
              { value: "10K+", label: "người dùng" },
              { value: "50K+", label: "bài tập" },
              { value: "4.9★", label: "đánh giá" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)", color: "#F0E8DC", lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(240,232,220,0.35)", marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </m.div>

          {/* Testimonial */}
          <m.div variants={fadeUp} style={{
            marginTop: 36, borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(16px)", padding: "18px 20px",
          }}>
            <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
              {[1,2,3,4,5].map((i) => <span key={i} style={{ fontSize: 11, color: "#F59E0B" }}>★</span>)}
            </div>
            <p style={{
              margin: "0 0 12px", fontSize: 13, fontStyle: "italic",
              lineHeight: 1.65, color: "rgba(240,232,220,0.7)",
            }}>
              "Nhờ app mà mình tăng 200 điểm TOEIC chỉ trong 3 tháng. AI chấm điểm rất chính xác!"
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 10,
                background: "linear-gradient(135deg, #C84B31, #D4B896)",
                display: "grid", placeItems: "center",
                fontSize: 12, fontWeight: 700, color: "white",
              }}>T</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(240,232,220,0.8)" }}>Thanh Trúc</div>
                <div style={{ fontSize: 10, color: "rgba(240,232,220,0.35)", marginTop: 1 }}>
                  <CheckCircleFilled style={{ marginRight: 3, color: "#10b981" }} />
                  TOEIC 850 · Đã dùng 4 tháng
                </div>
              </div>
            </div>
          </m.div>
        </m.div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", padding: "48px 32px",
        overflowY: "auto", position: "relative",
      }}>
        <div style={{
          pointerEvents: "none", position: "absolute",
          top: 0, right: 0, width: "50%", height: "40%",
          background: "radial-gradient(ellipse at top right, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 70%)",
        }} />
        <div style={{
          pointerEvents: "none", position: "absolute",
          bottom: 0, left: 0, width: "40%", height: "30%",
          background: "radial-gradient(ellipse at bottom left, color-mix(in srgb, var(--secondary) 4%, transparent) 0%, transparent 70%)",
        }} />

        <Suspense fallback={null}>
          <SignInContent />
        </Suspense>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
