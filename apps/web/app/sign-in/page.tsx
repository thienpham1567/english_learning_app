"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import * as m from "motion/react-client";

import { authClient } from "@/lib/auth-client";
import {
  BookOpenText,
  Bot,
  CheckCircle,
  ClipboardList,
  Headphones,
  Mic,
  ShieldCheck,
  Star,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

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

/* ── Interactive Dashboard Mock Component for Left Panel ── */
function DashboardMockup() {
  // Activity Heatmap Mock
  const days = Array.from({ length: 28 }, (_, i) => ({
    level: i % 7 === 0 ? 0 : i % 5 === 0 ? 3 : i % 3 === 0 ? 4 : i % 2 === 0 ? 2 : 1,
  }));

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      style={{
        position: "absolute",
        right: "-10%",
        top: "12%",
        width: 420,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      {/* Target Progress Card */}
      <m.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "rgba(30, 41, 59, 0.55)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 24,
          padding: 24,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div style={{ position: "relative", width: 70, height: 70, flexShrink: 0 }}>
          {/* Progress circle */}
          <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%" }}>
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="3.5"
            />
            <m.path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#D4963A"
              strokeDasharray="85, 100"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: "85, 100" }}
              transition={{ delay: 1.2, duration: 2, ease: "easeOut" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "grid", placeItems: "center",
            fontSize: 15, fontWeight: 800, color: "#F8FAFC", fontFamily: "var(--font-display)"
          }}>
            85%
          </div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Trophy style={{ color: "#D4963A", fontSize: 14 }} />
            <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Mục tiêu thi</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#F8FAFC", fontFamily: "var(--font-display)" }}>TOEIC Target 850+</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <TrendingUp style={{ color: "#10B981" }} />
            <span style={{ color: "#10B981", fontWeight: 600 }}>+125 Điểm</span> so với tuần trước
          </div>
        </div>
      </m.div>

      {/* Dynamic Activity Heatmap */}
      <m.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{
          background: "rgba(30, 41, 59, 0.45)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: 24,
          padding: "20px 24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 700, letterSpacing: "0.05em" }}>TẦN SUẤT HỌC TẬP</span>
          <span style={{ fontSize: 11, color: "#D4963A", fontWeight: 700 }}>24 NGÀY LIÊN TỤC 🔥</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {days.map((day, idx) => (
            <div
              key={idx}
              style={{
                aspectRatio: "1",
                borderRadius: 6,
                background:
                  day.level === 0 ? "rgba(255, 255, 255, 0.04)" :
                  day.level === 1 ? "rgba(192, 125, 43, 0.15)" :
                  day.level === 2 ? "rgba(192, 125, 43, 0.35)" :
                  day.level === 3 ? "rgba(212, 150, 58, 0.6)" :
                  "rgba(212, 150, 58, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.02)",
              }}
            />
          ))}
        </div>
      </m.div>

      {/* Floating AI Feedback Notification */}
      <m.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(192, 125, 43, 0.25)",
          borderRadius: 20,
          padding: 16,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          display: "flex",
          gap: 12,
          alignItems: "center",
          maxWidth: 320,
          alignSelf: "flex-end",
          marginRight: 40,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(192, 125, 43, 0.15)",
          display: "grid", placeItems: "center", color: "#D4963A", fontSize: 18
        }}>
          <Bot />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#F8FAFC" }}>AI Phản Hồi Phát Âm</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Phát âm từ &quot;negotiation&quot; đã cải thiện vượt bậc! Đạt 94% chuẩn Mỹ.</div>
        </div>
      </m.div>
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
            boxShadow: "var(--shadow-md)",
            borderColor: "var(--accent)",
            background: "var(--surface-hover)"
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
            boxShadow: "var(--shadow-sm)",
            opacity: isLoading ? 0.7 : 1,
            transition: "all 0.25s",
            fontFamily: "var(--font-body)",
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
        background: "var(--surface-alt)", 
        border: "1px solid var(--border)", 
        display: "flex", 
        flexDirection: "column", 
        gap: 12 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle style={{ color: "var(--success)", fontSize: 13 }} />
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>ETS 2024 & Kho đề cập nhật liên tục</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Zap style={{ color: "var(--accent)", fontSize: 13 }} />
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>Phân tích sửa lỗi & gợi ý bằng AI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <ShieldCheck style={{ fontSize: 13, color: "var(--text-muted)" }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Hệ thống bảo mật & riêng tư tối đa</span>
        </div>
      </m.div>

      {error && (
        <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{
          marginTop: 20, padding: "14px 18px", borderRadius: 16,
          border: "1px solid color-mix(in srgb, var(--error) 20%, transparent)",
          background: "var(--error-bg)",
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
          position: "relative", width: "50%", flexShrink: 0,
          display: "flex", flexDirection: "column",
          alignItems: "flex-start", justifyContent: "center",
          overflow: "hidden", 
          background: "linear-gradient(145deg, #0F172A 0%, #0F1419 100%)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Grain Overlay */}
        <div className="grain-overlay" />

        {/* Dynamic ambient glows */}
        <div style={{
          pointerEvents: "none", position: "absolute", inset: 0,
          background: "radial-gradient(circle at 10% 20%, rgba(192, 125, 43, 0.15) 0%, transparent 60%), radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 60%)",
        }} />

        {/* Hero Content */}
        <m.div
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } } }}
          style={{ position: "relative", zIndex: 3, padding: "0 64px", maxWidth: 520 }}
        >
          {/* Star review bar */}
          <m.div variants={fadeUp} style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} style={{ color: "#D4963A", fontSize: 14, opacity: 0.85 }} />
            ))}
          </m.div>
          
          <m.h2 variants={fadeUp} style={{
            margin: 0, fontSize: 52, fontWeight: 900,
            fontFamily: "var(--font-display)",
            lineHeight: 1.15, letterSpacing: "-0.04em", color: "#F8FAFC",
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
            background: "linear-gradient(90deg, #D4963A, transparent)",
            margin: "32px 0",
          }} />

          <m.p variants={fadeUp} style={{
            margin: "0 0 48px", fontSize: 16, lineHeight: 1.8,
            color: "#94A3B8", maxWidth: 365, fontWeight: 400,
          }}>
            Hệ thống học tập thông minh tích hợp trợ lý AI để thông dịch, chỉnh phát âm và chấm bài viết chuẩn đề thi ETS mới nhất.
          </m.p>

          {/* Stats Metrics */}
          <m.div variants={fadeUp} style={{ display: "flex", gap: 40 }}>
            {[
              { value: "10K+", label: "Học Viên" },
              { value: "990", label: "Điểm Tối Đa" },
              { value: "4.9★", label: "Đánh Giá" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-display)", color: "#F8FAFC", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
              </div>
            ))}
          </m.div>
        </m.div>

        {/* Dashboard Showcase Mockup elements */}
        <DashboardMockup />
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
          background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          pointerEvents: "none", position: "absolute",
          bottom: "10%", left: "10%", width: 250, height: 250,
          background: "radial-gradient(circle, color-mix(in srgb, var(--info) 4%, transparent) 0%, transparent 75%)",
          filter: "blur(30px)",
        }} />

        {/* Translucent glass container card */}
        <div style={{
          width: "100%",
          maxWidth: 440,
          background: "color-mix(in srgb, var(--surface) 75%, transparent)",
          backdropFilter: "blur(24px)",
          border: "1px solid var(--border)",
          borderRadius: 28,
          padding: "48px 40px",
          boxShadow: "var(--shadow-xl)",
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
          background-image: radial-gradient(color-mix(in srgb, var(--border) 15%, transparent) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .grain-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.015;
          pointer-events: none;
        }
        @media (max-width: 1180px) {
          .desktop-only { display: none; }
        }
      `}</style>
    </div>
  );
}
