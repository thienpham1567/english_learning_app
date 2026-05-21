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
  StarFilled,
} from "@ant-design/icons";
import { authClient } from "@/lib/auth-client";

/* ── Shared animation variants ── */
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const fadeIn = { hidden: { opacity: 0 }, show: { opacity: 1 } };

/* ── Google icon ── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
  </svg>
);

/* ── Floating skill badges with contextual details ── */
const BADGES = [
  { 
    icon: <CustomerServiceOutlined />, 
    label: "Listening", 
    info: "Part 1–4 · Lvl 92", 
    top: "16%", 
    right: "6%", 
    delay: 0.2, 
    glow: "rgba(200, 75, 49, 0.15)" 
  },
  { 
    icon: <ReadOutlined />, 
    label: "Reading", 
    info: "Part 5–7 · Lvl 88", 
    top: "32%", 
    right: "18%", 
    delay: 0.4, 
    glow: "rgba(251, 188, 5, 0.12)" 
  },
  { 
    icon: <AudioOutlined />, 
    label: "Speaking", 
    info: "AI Pronunciation 4.9★", 
    bottom: "38%", 
    left: "6%", 
    delay: 0.6, 
    glow: "rgba(200, 75, 49, 0.15)" 
  },
  { 
    icon: <FormOutlined />, 
    label: "Writing", 
    info: "ETS Standard Essay", 
    bottom: "24%", 
    right: "10%", 
    delay: 0.3, 
    glow: "rgba(251, 188, 5, 0.12)" 
  },
];

/* ── Interactive Score Gauge Widget ── */
function ScoreGauge() {
  return (
    <m.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
      style={{
        position: "absolute",
        bottom: "8%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 280,
        padding: "20px 24px",
        borderRadius: 24,
        background: "rgba(255, 255, 255, 0.02)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ position: "relative", width: 140, height: 80, display: "flex", justifyContent: "center" }}>
        <svg viewBox="0 0 100 60" style={{ width: "100%", height: "100%" }}>
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <m.path
            d="M 10 50 A 40 40 0 0 1 90 50"
            stroke="url(#accent-gradient)"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="125.6"
            initial={{ strokeDashoffset: 125.6 }}
            animate={{ strokeDashoffset: 125.6 * 0.15 }}
            transition={{ delay: 1.1, duration: 1.8, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="accent-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#92400E" />
              <stop offset="100%" stopColor="#D4963A" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: "absolute", bottom: -2, textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "var(--font-display)", color: "#F0E8DC", lineHeight: 1 }}>945</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 2 }}>ESTIMATED</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, width: "100%", borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: 10, justifyContent: "space-between", fontSize: 11 }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ color: "rgba(255, 255, 255, 0.3)", fontWeight: 500 }}>LISTENING</div>
          <div style={{ color: "#F0E8DC", fontWeight: 700, marginTop: 2 }}>485 / 495</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "rgba(255, 255, 255, 0.3)", fontWeight: 500 }}>READING</div>
          <div style={{ color: "#F0E8DC", fontWeight: 700, marginTop: 2 }}>460 / 495</div>
        </div>
      </div>
    </m.div>
  );
}

/* ── Sign-in form content ── */
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
      style={{ width: "100%", display: "flex", flexDirection: "column" }}
    >
      {/* Logo */}
      <m.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
        <m.div
          whileHover={{ scale: 1.05, rotate: -3 }}
          transition={{ type: "spring", stiffness: 400 }}
          style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: "linear-gradient(145deg, var(--accent), #D4963A)",
            boxShadow: "0 8px 24px color-mix(in srgb, var(--accent) 30%, transparent), inset 0 1px 1px rgba(255,255,255,0.15)",
            display: "grid", placeItems: "center",
            color: "#fff",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M16 8C12.5 6.5 8.5 6 4 7v17c4.5-1 8.5-0.5 12 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M16 8c3.5-1.5 7.5-2 12-1v17c-4.5-1-8.5-0.5-12 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M16 8v17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
            <circle cx="16" cy="4" r="1.8" fill="currentColor" opacity="0.9"/>
            <path d="M16 7V5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
          </svg>
        </m.div>
        <div>
          <div style={{
            fontSize: 22, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em",
            color: "var(--ink)", fontFamily: "var(--font-display)",
          }}>
            TOEIC<span style={{ color: "var(--accent)" }}> Master</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 2 }}>
            AI Study Hub
          </div>
        </div>
      </m.div>

      {/* Heading */}
      <m.h1 variants={fadeUp} style={{
        margin: "0 0 10px", fontSize: 32, fontWeight: 800,
        fontFamily: "var(--font-display)",
        color: "var(--ink)", lineHeight: 1.2, letterSpacing: "-0.03em",
      }}>
        Bắt đầu học ngay
      </m.h1>
      <m.p variants={fadeUp} style={{ margin: "0 0 32px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5, fontWeight: 500 }}>
        Đăng nhập nhanh để lưu tiến độ học tập và nhận phân tích sửa lỗi từ Trợ lý AI.
      </m.p>

      {/* Google button */}
      <m.div variants={fadeUp}>
        <m.button
          whileHover={{ 
            y: -2, 
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.3)",
            borderColor: "rgba(255, 255, 255, 0.15)",
            background: "color-mix(in srgb, var(--surface) 90%, var(--ink))"
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            width: "100%", height: 56, borderRadius: 18,
            fontSize: 15, fontWeight: 700,
            border: "1px solid var(--border)",
            background: "var(--surface)", color: "var(--ink)",
            cursor: isLoading ? "wait" : "pointer",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            opacity: isLoading ? 0.7 : 1,
            transition: "background 0.25s, border-color 0.25s",
          }}
        >
          {isLoading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Đang kết nối...
            </span>
          ) : (
            <>
              <GoogleIcon />
              Tiếp tục bằng Google
            </>
          )}
        </m.button>
      </m.div>

      {/* Security & Trust Info */}
      <m.div variants={fadeIn} style={{ 
        marginTop: 28, 
        padding: "18px 20px", 
        borderRadius: 20, 
        background: "rgba(255, 255, 255, 0.015)", 
        border: "1px solid var(--border)", 
        display: "flex", 
        flexDirection: "column", 
        gap: 12 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircleFilled style={{ color: "var(--success)", fontSize: 13 }} />
          <span style={{ fontSize: 13, color: "var(--ink)", opacity: 0.85, fontWeight: 600 }}>ETS 2024 & Kho đề cập nhật liên tục</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThunderboltOutlined style={{ color: "var(--accent)", fontSize: 13 }} />
          <span style={{ fontSize: 13, color: "var(--ink)", opacity: 0.85, fontWeight: 600 }}>Phân tích sửa lỗi & gợi ý bằng AI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <SafetyCertificateOutlined style={{ fontSize: 13, color: "var(--text-muted)" }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Hệ thống bảo mật & riêng tư tối đa</span>
        </div>
      </m.div>

      {error && (
        <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{
          marginTop: 20, padding: "14px 18px", borderRadius: 16,
          border: "1px solid color-mix(in srgb, var(--error) 20%, transparent)",
          background: "color-mix(in srgb, var(--error) 6%, transparent)",
          color: "var(--error)", fontSize: 14, fontWeight: 500, textAlign: "center",
        }}>
          {error}
        </m.div>
      )}
    </m.div>
  );
}

/* ── Main page ── */
export default function SignInPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", position: "relative", overflow: "hidden" }}>

      {/* ── Left editorial panel (desktop only) ── */}
      <div
        className="desktop-only"
        style={{
          position: "relative", width: "42%", flexShrink: 0,
          display: "flex", flexDirection: "column",
          alignItems: "flex-start", justifyContent: "center",
          overflow: "hidden", 
          background: "linear-gradient(145deg, #0d0c0b 0%, #171412 100%)",
          borderRight: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Grain Overlay */}
        <div className="grain-overlay" />

        {/* Dynamic ambient glows */}
        <div style={{
          pointerEvents: "none", position: "absolute", inset: 0,
          background: "radial-gradient(circle at 20% 20%, rgba(200,75,49,0.14) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(251,188,5,0.06) 0%, transparent 60%)",
        }} />

        {/* Floating skill badges with interactive animations */}
        {BADGES.map((b) => (
          <m.div
            key={b.label}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{
              opacity: { delay: b.delay, duration: 0.8 },
              scale: { delay: b.delay, duration: 0.8 },
              y: { delay: b.delay, duration: 5 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" },
            }}
            whileHover={{ 
              scale: 1.05, 
              boxShadow: `0 15px 35px ${b.glow}`,
              borderColor: "rgba(255, 255, 255, 0.15)",
              background: "rgba(255, 255, 255, 0.08)"
            }}
            style={{
              position: "absolute",
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 20px", borderRadius: 20,
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              color: "#F0E8DC", 
              boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
              top: (b as any).top, right: (b as any).right,
              bottom: (b as any).bottom, left: (b as any).left,
              cursor: "pointer",
              transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "rgba(200, 75, 49, 0.15)",
              display: "grid", placeItems: "center",
              color: "var(--accent)", fontSize: 16,
            }}>
              {b.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{b.label}</div>
              <div style={{ fontSize: 10, color: "rgba(240, 232, 220, 0.4)", marginTop: 2, fontWeight: 500 }}>{b.info}</div>
            </div>
          </m.div>
        ))}

        <ScoreGauge />

        {/* Hero Content */}
        <m.div
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } } }}
          style={{ position: "relative", zIndex: 1, padding: "0 64px", maxWidth: 480 }}
        >
          {/* Star review bar */}
          <m.div variants={fadeUp} style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <StarFilled key={i} style={{ color: "#C84B31", fontSize: 14, opacity: 0.85 }} />
            ))}
          </m.div>
          
          <m.h2 variants={fadeUp} style={{
            margin: 0, fontSize: 52, fontWeight: 900,
            fontFamily: "var(--font-display)",
            lineHeight: 1.1, letterSpacing: "-0.04em", color: "#F0E8DC",
          }}>
            Chinh Phục<br />
            Điểm Số<br />
            <span style={{ 
              background: "linear-gradient(135deg, var(--accent) 0%, #D4963A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 4px 12px rgba(192,125,43,0.25))"
            }}>
              TOEIC 4 Kỹ Năng
            </span>
          </m.h2>

          <m.div variants={fadeUp} style={{
            width: 80, height: 4, borderRadius: 99,
            background: "linear-gradient(90deg, #C84B31, transparent)",
            margin: "32px 0",
          }} />

          <m.p variants={fadeUp} style={{
            margin: "0 0 48px", fontSize: 16, lineHeight: 1.8,
            color: "rgba(240, 232, 220, 0.45)", maxWidth: 340, fontWeight: 400,
          }}>
            Hệ thống luyện thi thông minh tích hợp trợ lý AI thông dịch và chấm điểm chuẩn chỉnh cho học viên Việt Nam.
          </m.p>

          {/* Stats Metrics */}
          <m.div variants={fadeUp} style={{ display: "flex", gap: 40 }}>
            {[
              { value: "10K+", label: "Học Viên" },
              { value: "990", label: "Điểm Tối Đa" },
              { value: "4.9★", label: "Đánh Giá" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-display)", color: "#F0E8DC", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(240,232,220,0.3)", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
              </div>
            ))}
          </m.div>
        </m.div>
      </div>

      {/* ── Right form panel ── */}
      <div 
        className="grid-bg"
        style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--bg)", padding: "48px 24px",
          overflowY: "auto", position: "relative",
        }}
      >
        {/* Grain overlay */}
        <div className="grain-overlay" />
        
        {/* Spotlights and glows */}
        <div style={{
          pointerEvents: "none", position: "absolute",
          top: "15%", right: "10%", width: 350, height: 350,
          background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          pointerEvents: "none", position: "absolute",
          bottom: "10%", left: "10%", width: 250, height: 250,
          background: "radial-gradient(circle, rgba(251, 188, 5, 0.03) 0%, transparent 75%)",
          filter: "blur(30px)",
        }} />

        {/* Translucent glass container card */}
        <div style={{
          width: "100%",
          maxWidth: 440,
          background: "color-mix(in srgb, var(--surface) 60%, transparent)",
          backdropFilter: "blur(24px)",
          border: "1px solid var(--border)",
          borderRadius: 28,
          padding: "48px 40px",
          boxShadow: "0 30px 70px rgba(0, 0, 0, 0.25)",
          position: "relative",
          zIndex: 2,
        }}>
          <Suspense fallback={<div style={{ color: "var(--text-muted)", padding: 24, textAlign: "center" }}>Đang tải form đăng nhập…</div>}>
            <SignInContent />
          </Suspense>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .desktop-only { display: flex; }
        .grid-bg {
          background-image: radial-gradient(rgba(240, 232, 220, 0.02) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .grain-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.012;
          pointer-events: none;
        }
        @media (max-width: 1024px) {
          .desktop-only { display: none; }
        }
      `}</style>
    </div>
  );
}
