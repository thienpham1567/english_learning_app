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
      style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column" }}
    >
      {/* Logo */}
      <m.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
        <m.div
          whileHover={{ scale: 1.05, rotate: -3 }}
          transition={{ type: "spring", stiffness: 400 }}
          style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 50%, black))",
            boxShadow: "0 8px 24px color-mix(in srgb, var(--accent) 25%, transparent)",
            display: "grid", placeItems: "center",
          }}
        >
          <TranslationOutlined style={{ fontSize: 22, color: "#fff" }} />
        </m.div>
        <div>
          <div style={{
            fontSize: 22, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em",
            color: "var(--ink)", fontFamily: "var(--font-display)",
          }}>
            TOEIC<span style={{ color: "var(--accent)" }}> Master</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 4 }}>
            Ultimate 4-Skills Hub
          </div>
        </div>
      </m.div>

      {/* Heading */}
      <m.h1 variants={fadeUp} style={{
        margin: "0 0 10px", fontSize: 36, fontWeight: 800,
        fontStyle: "italic", fontFamily: "var(--font-display)",
        color: "var(--ink)", lineHeight: 1.1, letterSpacing: "-0.03em",
      }}>
        Bắt đầu thôi
      </m.h1>
      <m.p variants={fadeUp} style={{ margin: "0 0 40px", fontSize: 16, color: "var(--text-muted)", lineHeight: 1.6, fontWeight: 500 }}>
        Gia nhập cộng đồng 10,000+ học viên đang chinh phục TOEIC mỗi ngày.
      </m.p>

      {/* Google button */}
      <m.div variants={fadeUp}>
        <m.button
          whileHover={{ y: -3, boxShadow: "0 12px 32px color-mix(in srgb, var(--accent) 18%, transparent)" }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
            width: "100%", height: 64, borderRadius: 20,
            fontSize: 17, fontWeight: 700,
            border: "1px solid var(--border)",
            background: "var(--surface)", color: "var(--ink)",
            cursor: isLoading ? "wait" : "pointer",
            boxShadow: "var(--shadow-lg)",
            opacity: isLoading ? 0.7 : 1,
            transition: "background 0.2s, border-color 0.2s",
          }}
        >
          {isLoading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Đang kết nối...
            </span>
          ) : (
            <><GoogleIcon /> Tiếp tục với Google</>
          )}
        </m.button>
      </m.div>

      {/* Security & Trust Footer */}
      <m.div variants={fadeIn} style={{ marginTop: 32, padding: "20px", borderRadius: 20, background: "var(--bg-deep)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircleFilled style={{ color: "var(--success)", fontSize: 14 }} />
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Truy cập đầy đủ kho đề ETS 2024</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThunderboltOutlined style={{ color: "var(--accent)", fontSize: 14 }} />
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>AI chấm điểm Speaking & Writing tức thì</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <SafetyCertificateOutlined style={{ fontSize: 14, color: "var(--text-muted)" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Bảo mật dữ liệu bởi Google Cloud Platform</span>
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

/* ── Score ring decoration ── */
function ScoreRing() {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.35, scale: 1 }}
      transition={{ delay: 1, duration: 1, ease: "easeOut" }}
      style={{
        position: "absolute", bottom: "8%", left: "50%", transform: "translateX(-50%)",
        width: 240, height: 140,
      }}
    >
      <svg viewBox="0 0 220 130" fill="none" style={{ width: "100%", height: "100%" }}>
        <m.path
          d="M20 120 A90 90 0 0 1 200 120"
          stroke="rgba(200,75,49,0.4)" strokeWidth="2" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ delay: 1.2, duration: 2, ease: "easeInOut" }}
        />
        <m.path
          d="M20 120 A90 90 0 0 1 180 35"
          stroke="rgba(200,75,49,0.9)" strokeWidth="5" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ delay: 1.5, duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
      <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Predicted</div>
        <div style={{ fontSize: 64, fontWeight: 900, fontFamily: "var(--font-display)", fontStyle: "italic", color: "rgba(255,255,255,0.2)", lineHeight: 0.9, letterSpacing: "-0.04em" }}>990</div>
      </div>
    </m.div>
  );
}

/* ── Main page ── */
export default function SignInPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Left editorial panel ── */}
      <div
        className="desktop-only"
        style={{
          position: "relative", width: "42%", flexShrink: 0,
          display: "flex", flexDirection: "column",
          alignItems: "flex-start", justifyContent: "center",
          overflow: "hidden", background: "#0f0d0c",
        }}
      >
        {/* Ambient glows */}
        <div style={{
          pointerEvents: "none", position: "absolute", inset: 0,
          background: "radial-gradient(circle at 20% 20%, rgba(200,75,49,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(200,75,49,0.1) 0%, transparent 50%)",
        }} />
        <div className="grain-overlay" style={{ opacity: 0.04 }} />

        {/* Floating skill badges with Motion */}
        {BADGES.map((b) => (
          <m.div
            key={b.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{
              opacity: { delay: b.delay, duration: 0.8 },
              scale: { delay: b.delay, duration: 0.8 },
              y: { delay: b.delay, duration: 5 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" },
            }}
            style={{
              position: "absolute",
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "12px 22px", borderRadius: 18,
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(240,232,220,0.9)", fontSize: 15, fontWeight: 600,
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              top: (b as any).top, right: (b as any).right,
              bottom: (b as any).bottom, left: (b as any).left,
            }}
          >
            <span style={{ fontSize: 18, color: "#C84B31" }}>{b.icon}</span>
            {b.label}
          </m.div>
        ))}

        <ScoreRing />

        {/* Content */}
        <m.div
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } } }}
          style={{ position: "relative", zIndex: 1, padding: "0 64px", maxWidth: 480 }}
        >
          <m.div variants={fadeUp} style={{ display: "flex", gap: 4, marginBottom: 20 }}>
            {[1,2,3,4,5].map(i => <CheckCircleFilled key={i} style={{ color: "#C84B31", fontSize: 14, opacity: 0.6 }} />)}
          </m.div>
          
          <m.h2 variants={fadeUp} style={{
            margin: 0, fontSize: 64, fontWeight: 800,
            fontStyle: "italic", fontFamily: "var(--font-display)",
            lineHeight: 1, letterSpacing: "-0.03em", color: "#F0E8DC",
          }}>
            Master<br />Your<br />
            <span style={{ color: "#C84B31" }}>TOEIC</span>
          </m.h2>

          <m.div variants={fadeUp} style={{
            width: 60, height: 4, borderRadius: 99,
            background: "linear-gradient(90deg, #C84B31, transparent)",
            margin: "32px 0",
          }} />

          <m.p variants={fadeUp} style={{
            margin: "0 0 40px", fontSize: 17, lineHeight: 1.8,
            color: "rgba(240,232,220,0.45)", maxWidth: 320, fontWeight: 400,
          }}>
            Hệ thống luyện thi thông minh tích hợp AI dành riêng cho người Việt.
          </m.p>

          {/* Stats */}
          <m.div variants={fadeUp} style={{ display: "flex", gap: 40 }}>
            {[
              { value: "10K+", label: "Học viên" },
              { value: "990", label: "Target" },
              { value: "4.9★", label: "Rating" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-display)", color: "#F0E8DC", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,232,220,0.3)", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
              </div>
            ))}
          </m.div>
        </m.div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", padding: "48px 40px",
        overflowY: "auto", position: "relative",
      }}>
        {/* Decorative elements */}
        <div style={{
          pointerEvents: "none", position: "absolute",
          top: "10%", right: "10%", width: 300, height: 300,
          background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 4%, transparent) 0%, transparent 70%)",
        }} />
        
        <Suspense fallback={null}>
          <SignInContent />
        </Suspense>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .desktop-only { display: flex; }
        @media (max-width: 1024px) {
          .desktop-only { display: none; }
        }
      `}</style>
    </div>
  );
}
