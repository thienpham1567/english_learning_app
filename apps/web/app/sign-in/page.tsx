"use client";

import { Bot, CheckCircle, ShieldCheck, Star, TrendingUp, Trophy, Zap } from "lucide-react";
import * as m from "motion/react-client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authClient } from "@/lib/auth-client";

/* ── Shared animation variants ── */
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const fadeIn = { hidden: { opacity: 0 }, show: { opacity: 1 } };

/* ── Google icon ── */
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

/* ── Interactive Dashboard Mock Component for Left Panel ── */
function DashboardMockup() {
  const days = Array.from({ length: 28 }, (_, i) => ({
    level: i % 7 === 0 ? 0 : i % 5 === 0 ? 3 : i % 3 === 0 ? 4 : i % 2 === 0 ? 2 : 1,
  }));

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      className="absolute w-[420px] flex flex-col gap-4 right-[-10%] top-[12%] pointer-events-none z-[2]"
    >
      {/* Target Progress Card */}
      <m.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="p-6 flex items-center gap-5 bg-black border-2 border-border rounded-xl shadow-(--shadow-md)"
      >
        <div className="relative w-[70px] h-[70px] shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="rgba(var(--white-rgb), 0.06)"
              strokeWidth="3.5"
            />
            <m.path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="var(--accent)"
              strokeDasharray="85, 100"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: "85, 100" }}
              transition={{ delay: 1.2, duration: 2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-[15px] font-extrabold font-display text-(--mockup-text)">
            85%
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="text-sm text-accent" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-(--mockup-text-muted)">
              Mục tiêu thi
            </span>
          </div>
          <div className="text-lg font-extrabold font-display text-(--mockup-text)">
            TOEIC Target 850+
          </div>
          <div className="text-xs mt-1 flex items-center gap-1 text-(--mockup-text-muted-dark)">
            <TrendingUp className="text-(--success)" />
            <span className="font-semibold text-(--success)">+125 Điểm</span> so với tuần trước
          </div>
        </div>
      </m.div>

      {/* Dynamic Activity Heatmap */}
      <m.div
        animate={{ y: [0, 6, 0] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="p-5 flex flex-col bg-black border-2 border-border rounded-xl shadow-(--shadow-md)"
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold tracking-wider text-(--mockup-text-muted)">
            TẦN SUẤT HỌC TẬP
          </span>
          <span className="text-[11px] font-bold text-accent">24 NGÀY LIÊN TỤC 🔥</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => (
            <div
              key={idx}
              className="aspect-square rounded-md border border-black/30"
              style={{
                background:
                  day.level === 0
                    ? "rgba(var(--white-rgb), 0.04)"
                    : day.level === 1
                      ? "color-mix(in srgb, var(--accent) 20%, transparent)"
                      : day.level === 2
                        ? "color-mix(in srgb, var(--accent) 45%, transparent)"
                        : day.level === 3
                          ? "color-mix(in srgb, var(--accent) 70%, transparent)"
                          : "var(--accent)",
              }}
            />
          ))}
        </div>
      </m.div>

      {/* Floating AI Feedback Notification */}
      <m.div
        animate={{ y: [0, -5, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="p-4 flex gap-3 items-center w-[320px] bg-black border-2 border-border rounded-xl shadow-(--shadow-md) self-end mr-10"
      >
        <div className="w-9 h-9 shrink-0 grid place-items-center rounded-lg border-2 border-border bg-accent-muted text-accent">
          <Bot />
        </div>
        <div>
          <div className="text-xs font-bold text-(--mockup-text)">AI Phản Hồi Phát Âm</div>
          <div className="text-[11px] text-(--mockup-text-muted) mt-0.5">
            Phát âm từ &quot;negotiation&quot; đã cải thiện vượt bậc! Đạt 94% chuẩn Mỹ.
          </div>
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
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch {
      setError("Không thể kết nối đến Google. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <m.div
      initial="hidden"
      animate="show"
      variants={{
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
      }}
      className="w-full flex flex-col"
    >
      {/* Logo */}
      <m.div variants={fadeUp} className="flex items-center gap-3 mb-9">
        <m.div
          whileHover={{
            scale: 1.05,
            rotate: -3,
            boxShadow: "var(--shadow-md)",
            y: -1,
            x: -1,
          }}
          whileTap={{
            scale: 0.98,
            boxShadow: "1px 1px 0 var(--border)",
            y: 1,
            x: 1,
          }}
          transition={{ type: "spring", stiffness: 400 }}
          className="w-[46px] h-[46px] shrink-0 grid place-items-center rounded-(--radius) border-2 border-border bg-accent text-(--text-on-accent) shadow-(--shadow-sm) cursor-pointer transition-all duration-150"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M16 8C12.5 6.5 8.5 6 4 7v17c4.5-1 8.5-0.5 12 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M16 8c3.5-1.5 7.5-2 12-1v17c-4.5-1-8.5-0.5-12 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M16 8v17"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.4"
            />
            <circle cx="16" cy="4" r="1.8" fill="currentColor" opacity="0.9" />
            <path
              d="M16 7V5.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.5"
            />
          </svg>
        </m.div>
        <div>
          <div className="text-2xl font-black text-ink font-display leading-[1.1] tracking-[-0.03em]">
            TOEIC<span className="text-accent"> Master</span>
          </div>
          <div className="text-[10px] font-bold uppercase text-text-muted tracking-[0.15em] mt-0.5">
            AI Study Hub
          </div>
        </div>
      </m.div>

      {/* Heading */}
      <m.h1
        variants={fadeUp}
        className="mb-2.5 text-4xl font-extrabold font-display text-ink leading-[1.2] tracking-[-0.03em]"
      >
        Bắt đầu học ngay
      </m.h1>
      <m.p variants={fadeUp} className="text-sm text-text-muted leading-normal font-medium mb-8">
        Đăng nhập nhanh để lưu tiến độ học tập và nhận phân tích sửa lỗi từ Trợ lý AI.
      </m.p>

      {/* Google button */}
      <m.div variants={fadeUp}>
        <m.button
          whileHover={{ y: -2, x: -2, boxShadow: "var(--shadow-lg)" }}
          whileTap={{ y: 2, x: 2, boxShadow: "1px 1px 0 var(--shadow-color)" }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 w-full h-14 text-[15px] font-extrabold border-2 border-border bg-(--surface) text-ink font-body rounded-lg cursor-pointer shadow-(--shadow) transition-all duration-150"
        >
          {isLoading ? (
            <span className="items-center gap-2 inline-flex">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin">
                <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="3" />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
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
      <m.div
        variants={fadeIn}
        className="mt-7 p-[18px_20px] bg-surface-alt border-2 border-border rounded-lg flex flex-col gap-3 shadow-(--shadow-sm)"
      >
        <div className="flex items-center gap-2.5">
          <CheckCircle className="text-(--success) text-[13px]" />
          <span className="text-[13px] text-text-secondary font-extrabold">
            ETS 2024 & Kho đề cập nhật liên tục
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Zap className="text-accent text-[13px]" />
          <span className="text-[13px] text-text-secondary font-extrabold">
            Phân tích sửa lỗi & gợi ý bằng AI
          </span>
        </div>
        <div className="flex items-center gap-2.5 mt-1 pt-3 border-t-2 border-dashed border-border">
          <ShieldCheck className="text-[13px] text-text-muted" />
          <span className="text-[11px] text-text-muted font-bold">
            Hệ thống bảo mật & riêng tư tối đa
          </span>
        </div>
      </m.div>

      {error && (
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-5 p-[14px_18px] text-(--error) border-2 border-border bg-(--error-bg) rounded-lg text-sm font-bold text-center shadow-(--shadow-sm)"
        >
          {error}
        </m.div>
      )}
    </m.div>
  );
}

/* ── Main page ── */
export default function SignInPage() {
  return (
    <div className="flex bg-(--bg) min-h-screen relative overflow-hidden">
      {/* ── Left editorial panel (desktop only) ── */}
      <div className="hidden min-[1181px]:flex w-1/2 relative shrink-0 flex flex-col items-start justify-center overflow-hidden border-r-2 border-border bg-(--mockup-bg-start)">
        {/* Grain Overlay */}
        <div className="grain-overlay" />

        {/* Dynamic ambient glows */}
        <div className="absolute pointer-events-none inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(var(--accent-rgb),0.15)_0%,transparent_60%),radial-gradient(circle_at_90%_80%,rgba(var(--info-rgb),0.1)_0%,transparent_60%)]" />

        {/* Hero Content */}
        <m.div
          initial="hidden"
          animate="show"
          variants={{
            show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
          }}
          className="relative z-10 px-16 max-w-[520px]"
        >
          {/* Star review bar */}
          <m.div variants={fadeUp} className="flex gap-1.5 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="text-sm text-accent opacity-85" />
            ))}
          </m.div>

          <m.h2
            variants={fadeUp}
            className="m-0 font-black font-display text-[52px] leading-[1.15] tracking-[-0.04em] text-(--mockup-text)"
          >
            Chinh Phục
            <br />
            Điểm Số
            <br />
            <span className="bg-gradient-to-r from-accent to-accent bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(var(--accent-rgb),0.25)]">
              TOEIC 4 Kỹ Năng
            </span>
          </m.h2>

          <m.div variants={fadeUp} className="w-20 h-1 bg-accent border border-black my-8" />

          <m.p
            variants={fadeUp}
            className="text-base max-w-[365px] font-normal mb-12 leading-[1.8] text-(--mockup-text-muted)"
          >
            Hệ thống học tập thông minh tích hợp trợ lý AI để thông dịch, chỉnh phát âm và chấm bài
            viết chuẩn đề thi ETS mới nhất.
          </m.p>

          {/* Stats Metrics */}
          <m.div variants={fadeUp} className="flex gap-10">
            {[
              { value: "10K+", label: "Học Viên" },
              { value: "990", label: "Điểm Tối Đa" },
              { value: "4.9★", label: "Đánh Giá" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[28px] font-extrabold font-display leading-none text-(--mockup-text)">
                  {s.value}
                </div>
                <div className="text-[10px] font-bold mt-1.5 uppercase text-(--mockup-text-muted-dark) tracking-widest">
                  {s.label}
                </div>
              </div>
            ))}
          </m.div>
        </m.div>

        {/* Dashboard Showcase Mockup elements */}
        <DashboardMockup />
      </div>

      {/* ── Right form panel ── */}
      <div className="grid-bg flex-1 flex items-center justify-center bg-(--bg) p-[48px_24px] overflow-y-auto relative">
        {/* Grain overlay */}
        <div className="grain-overlay" />

        {/* Translucent glass container card */}
        <div className="w-full max-w-[440px] bg-(--surface) border-2 border-border rounded-xl p-[48px_40px] shadow-(--shadow-lg) relative z-10">
          <Suspense
            fallback={
              <div className="text-text-muted p-6 text-center">Đang tải form đăng nhập…</div>
            }
          >
            <SignInContent />
          </Suspense>
        </div>
      </div>

      <style>{`
        .grid-bg {
          background-image: radial-gradient(color-mix(in srgb, var(--border) 15%, transparent) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}
