"use client";

import {
  Award,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle,
  Flame,
  Headphones,
  Mic,
  Pen,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import * as m from "motion/react-client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LogoMark } from "@/components/shared/Logo";
import { authClient } from "@/lib/auth-client";

/* ── Shared animation variants ── */
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
const fadeIn = { hidden: { opacity: 0 }, show: { opacity: 1 } };
const scaleUp = { hidden: { opacity: 0, scale: 0.92 }, show: { opacity: 1, scale: 1 } };

/* ── Google icon ── */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
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

/* ── 4 Skills Showcase ── */
const SKILLS = [
  { icon: Headphones, label: "Listening", color: "var(--module-listening)" },
  { icon: BookOpen, label: "Reading", color: "var(--module-reading)" },
  { icon: Pen, label: "Writing", color: "var(--module-writing)" },
  { icon: Mic, label: "Speaking", color: "var(--module-speaking)" },
] as const;

/* ── Heatmap Level Tailwind Mappings ── */
const HEATMAP_LEVELS = ["bg-white/5", "bg-accent/15", "bg-accent/35", "bg-accent/60", "bg-accent"];

/* ── Floating Feature Cards ── */
function FloatingCards() {
  return (
    <div className="absolute -right-[8%] top-[10%] w-[400px] flex flex-col gap-4 pointer-events-none z-10">
      {/* Score Progress Card */}
      <m.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" }}
        className="rounded-xl"
      >
        <m.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-4 p-5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl"
        >
          {/* Circular Progress */}
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="3"
              />
              <m.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: "85, 100" }}
                transition={{ delay: 1.2, duration: 2, ease: "easeOut" }}
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center font-display text-base font-extrabold text-mockup-text">
              850
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider uppercase text-accent">
              <Trophy size={12} />
              <span>TARGET SCORE</span>
            </div>
            <div className="font-display text-lg font-extrabold text-mockup-text">TOEIC 850+</div>
            <div className="flex items-center gap-1 text-xs text-mockup-text-muted-dark">
              <TrendingUp size={13} className="text-success" />
              <span className="text-success font-semibold">+125 pts</span>
              this month
            </div>
          </div>
        </m.div>
      </m.div>

      {/* Streak + Heatmap Card */}
      <m.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
        className="rounded-xl"
      >
        <m.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          className="flex flex-col gap-3 items-stretch p-5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider uppercase text-mockup-text-muted">
              <BarChart3 size={13} />
              ACTIVITY
            </div>
            <div className="flex items-center gap-1 text-xs font-extrabold text-accent">
              <Flame size={13} />
              24-day streak
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }, (_, i) => {
              const lv = i % 7 === 0 ? 0 : i % 5 === 0 ? 3 : i % 3 === 0 ? 4 : i % 2 === 0 ? 2 : 1;
              return (
                <div key={i} className={`aspect-square rounded-[3px] ${HEATMAP_LEVELS[lv]}`} />
              );
            })}
          </div>
        </m.div>
      </m.div>

      {/* AI Feedback Notification */}
      <m.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.7, ease: "easeOut" }}
        className="rounded-xl self-end mr-8 max-w-[320px]"
      >
        <m.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="flex items-center gap-4 p-5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl"
        >
          <div className="w-9 h-9 shrink-0 grid place-items-center rounded-lg bg-accent/12 border border-accent/20 text-accent">
            <Bot size={18} />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs font-extrabold text-mockup-text">
              <Sparkles size={11} className="text-accent" />
              AI Pronunciation Coach
            </div>
            <div className="text-[11px] text-mockup-text-muted leading-normal">
              &quot;negotiation&quot; improved to{" "}
              <strong className="text-success font-extrabold">94%</strong> native accuracy!
            </div>
          </div>
        </m.div>
      </m.div>
    </div>
  );
}

/* ── Sign-in form content ── */
function SignInContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "Login failed. Please try again." : null,
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
      setError("Unable to connect to Google. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <m.div
      initial="hidden"
      animate="show"
      variants={{
        show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
      }}
      className="flex flex-col w-full"
    >
      {/* Logo */}
      <m.div variants={fadeUp} className="flex items-center gap-3 mb-8">
        <m.div
          whileHover={{
            scale: 1.06,
            rotate: -3,
            boxShadow: "4px 4px 0 var(--ink)",
            y: -2,
            x: -2,
          }}
          whileTap={{
            scale: 0.96,
            boxShadow: "1px 1px 0 var(--ink)",
            y: 1,
            x: 1,
          }}
          transition={{ type: "spring", stiffness: 400 }}
          className="w-11 h-11 shrink-0 grid place-items-center rounded-lg border-2 border-ink bg-accent text-ink shadow-[3px_3px_0px_var(--ink)] cursor-pointer"
        >
          <LogoMark size={22} />
        </m.div>
        <div className="flex flex-col">
          <div className="font-display text-xl font-black leading-none tracking-tight uppercase text-ink">
            TOEIC<span className="text-accent">Master</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mt-0.5">
            AI-Powered Study Hub
          </div>
        </div>
      </m.div>

      {/* Heading */}
      <m.h1
        variants={fadeUp}
        className="font-display text-3xl md:text-4xl font-black leading-[1.15] tracking-tight text-ink mb-3"
      >
        Your TOEIC Journey
        <br />
        <span className="bg-gradient-to-r from-accent to-amber-500 bg-clip-text text-transparent">
          Starts Here
        </span>
      </m.h1>

      <m.p variants={fadeUp} className="text-sm leading-relaxed text-text-muted font-medium mb-5">
        AI-driven practice for all 4 skills — Listening, Reading, Writing & Speaking. Track
        progress, get instant feedback, and hit your target score.
      </m.p>

      {/* 4 Skills Grid */}
      <m.div variants={fadeUp} className="flex flex-wrap gap-2 mb-7">
        {SKILLS.map((s) => (
          <m.div
            key={s.label}
            whileHover={{ y: -3, boxShadow: "3px 3px 0 var(--ink)" }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-transform duration-150 cursor-default"
            style={{
              color: s.color,
              backgroundColor: `color-mix(in srgb, ${s.color} 8%, transparent)`,
              borderColor: `color-mix(in srgb, ${s.color} 25%, transparent)`,
            }}
          >
            <s.icon size={14} />
            <span>{s.label}</span>
          </m.div>
        ))}
      </m.div>

      {/* Google button */}
      <m.div variants={scaleUp}>
        <m.button
          whileHover={{ y: -3, x: -3, boxShadow: "var(--shadow-lg)" }}
          whileTap={{ y: 2, x: 2, boxShadow: "1px 1px 0 var(--shadow-color)" }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 w-full h-14 text-sm font-extrabold font-body text-ink bg-card border-2 border-border rounded-xl cursor-pointer shadow transition-all duration-150 relative overflow-hidden"
          id="signin-google-button"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin">
                <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="3" />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              Connecting...
            </span>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </m.button>
      </m.div>

      {/* Trust Badges */}
      <m.div
        variants={fadeIn}
        className="mt-6 p-4 md:p-5 bg-surface-alt border-2 border-border rounded-xl flex flex-col gap-2.5 shadow-sm"
      >
        <div className="flex items-center gap-2.5 text-xs md:text-sm font-bold text-text-secondary">
          <Award size={14} className="text-accent shrink-0" />
          <span>ETS-aligned question bank — continuously updated</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs md:text-sm font-bold text-text-secondary">
          <Zap size={14} className="text-accent shrink-0" />
          <span>Real-time AI error analysis & smart suggestions</span>
        </div>
        <div className="border-t-2 border-dashed border-border my-0.5" />
        <div className="flex items-center gap-2.5 text-[11px] font-bold text-text-muted">
          <ShieldCheck size={13} />
          <span>Your data is encrypted & never shared</span>
        </div>
      </m.div>

      {error && (
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3.5 md:p-4 text-center text-xs md:text-sm font-bold text-error bg-error-bg border-2 border-border rounded-lg shadow-sm"
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
    <div className="flex min-h-screen bg-background overflow-hidden">
      {/* ── Left showcase panel (desktop) ── */}
      <div className="hidden min-[1080px]:flex relative w-[52%] shrink-0 flex-col items-start justify-center overflow-hidden bg-mockup-bg-start border-r-3 border-border">
        {/* Background effects */}
        <div className="grain-overlay" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_15%_25%,rgba(var(--accent-rgb),0.14)_0%,transparent_70%),radial-gradient(ellipse_50%_40%_at_85%_75%,rgba(var(--info-rgb),0.08)_0%,transparent_70%)]" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] bg-[size:60px_60px]" />

        {/* Hero Content */}
        <m.div
          initial="hidden"
          animate="show"
          variants={{
            show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
          }}
          className="relative z-10 px-16 max-w-[520px]"
        >
          {/* Eyebrow */}
          <m.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold tracking-wide text-accent bg-accent/10 border border-accent/20 rounded-full mb-7"
          >
            <CheckCircle size={14} />
            <span>Trusted by 10,000+ learners</span>
          </m.div>

          <m.h2
            variants={fadeUp}
            className="m-0 font-display text-[56px] font-black leading-[1.08] tracking-tight text-mockup-text"
          >
            Conquer
            <br />
            <span className="bg-gradient-to-r from-accent to-amber-500 bg-clip-text text-transparent filter drop-shadow-[0_4px_16px_rgba(var(--accent-rgb),0.3)]">
              TOEIC
            </span>
            <br />4 Skills
          </m.h2>

          <m.div
            variants={fadeUp}
            className="w-16 h-1 bg-accent border border-black/30 my-8 rounded-sm"
          />

          <m.p
            variants={fadeUp}
            className="text-sm leading-relaxed text-mockup-text-muted max-w-[380px] my-0 mb-10"
          >
            A complete AI learning platform — practice listening, reading, writing & speaking with
            real-time feedback, adaptive drills, and mock tests modeled after the latest ETS format.
          </m.p>

          {/* Stats */}
          <m.div variants={fadeUp} className="flex gap-10">
            {[
              { value: "990", label: "Max Score" },
              { value: "4.9★", label: "User Rating" },
              { value: "24/7", label: "AI Tutor" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display text-3xl font-extrabold leading-none text-mockup-text">
                  {s.value}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-mockup-text-muted-dark mt-1.5">
                  {s.label}
                </div>
              </div>
            ))}
          </m.div>
        </m.div>

        {/* Floating dashboard cards */}
        <FloatingCards />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center relative p-6 md:p-12 bg-background overflow-y-auto">
        <div className="grain-overlay" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(color-mix(in_srgb,var(--border)_15%,transparent)_1px,transparent_1px)] bg-[size:22px_22px]" />

        <div className="relative z-10 w-full max-w-[460px] bg-card border-2 border-border rounded-2xl p-8 md:p-10 shadow-lg shadow-lg">
          <Suspense fallback={<div className="text-text-muted text-center p-6">Loading...</div>}>
            <SignInContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
