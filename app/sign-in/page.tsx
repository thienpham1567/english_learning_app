"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
  </svg>
);

function SignInContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setError(null);

    const normalizedEmail = email.trim().includes("@")
      ? email.trim()
      : `${email.trim()}@local.app`;

    const result = await authClient.signIn.email({
      email: normalizedEmail,
      password,
    });

    if (result.error) {
      setError("Email hoặc mật khẩu không đúng.");
      setIsLoading(false);
      return;
    }

    window.location.href = "/english-chatbot";
  };

  return (
    <>
      <motion.div
        className="mb-5 grid size-14 place-items-center rounded-[var(--radius-lg)] bg-[var(--ink)] text-white"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.35, type: "spring", stiffness: 200 }}
      >
        <GraduationCap size={24} strokeWidth={2} />
      </motion.div>

      <h1 className="text-3xl [font-family:var(--font-display)] text-[var(--ink)]">
        Trợ lý học tập
      </h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Đăng nhập để bắt đầu luyện tiếng Anh
      </p>

      <form className="mt-6 space-y-3" onSubmit={handleEmailSignIn}>
        <input
          type="text"
          className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
          placeholder="Tên đăng nhập"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="username"
        />
        <input
          type="password"
          className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="current-password"
        />
        <motion.button
          type="submit"
          className="w-full rounded-[var(--radius)] bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading || !email.trim() || !password.trim()}
          whileTap={{ scale: 0.97 }}
        >
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </motion.button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span>hoặc</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <motion.button
        className="flex w-full items-center justify-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        whileTap={{ scale: 0.97 }}
      >
        <GoogleIcon />
        Đăng nhập bằng Google
      </motion.button>

      {error && (
        <motion.div
          className="mt-4 rounded-[var(--radius)] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[rgb(153,27,27)]"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <p className="mt-6 text-center text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
        Trợ lý học tập tiếng Anh
      </p>
    </>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(196,109,46,0.12),transparent_38%),linear-gradient(180deg,var(--bg),var(--bg-deep))] px-4 py-12">
      <Suspense fallback={null}>
        <motion.div
          className="w-full max-w-md rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[rgba(255,255,255,0.92)] p-8 shadow-[var(--shadow-lg)] backdrop-blur"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <SignInContent />
        </motion.div>
      </Suspense>
    </div>
  );
}
