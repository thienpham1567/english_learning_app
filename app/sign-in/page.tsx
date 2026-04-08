"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";

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
    <motion.div
      className="flex w-full max-w-[380px] flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
    >
      {/* Logo + heading */}
      <div className="flex flex-col items-center text-center">
        <Image
          src="/english-logo-app.svg"
          alt="English logo app"
          width={250}
          height={150}
          className="h-14 w-auto rounded-xl"
          priority
          unoptimized
        />

        <h1 className="mt-5 text-4xl italic [font-family:var(--font-display)] text-(--ink)">
          Xin chào
        </h1>
        <p className="mt-2 text-sm text-(--text-secondary)">
          Đăng nhập để bắt đầu luyện tiếng Anh
        </p>
      </div>

      <div className="mt-8" />

      {/* Google sign-in */}
      <motion.button
        className="flex w-full items-center justify-center gap-3 rounded-(--radius) border border-(--border) bg-transparent py-3 text-sm font-medium text-(--ink) transition-colors hover:bg-(--surface) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:cursor-not-allowed disabled:opacity-60"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        whileTap={{ scale: 0.97 }}
      >
        <GoogleIcon />
        Đăng nhập bằng Google
      </motion.button>

      {/* Error banner */}
      {error && (
        <motion.div
          role="alert"
          className="mt-4 rounded-(--radius) border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[rgb(153,27,27)]"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left editorial panel — hidden on mobile */}
      <div className="relative hidden w-[45%] flex-col items-center justify-center overflow-hidden bg-(--ink) lg:flex">
        {/* Grain overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />
        {/* Warm radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 75% 15%, rgba(196,109,46,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Editorial content */}
        <div className="relative z-10 mx-auto max-w-[340px] px-10 text-center">
          <motion.p
            className="text-[2.25rem] font-light italic leading-[1.35] text-white/90 [font-family:var(--font-display)]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
          >
            &quot;Học tiếng Anh mỗi ngày, một câu chuyện mới mỗi ngày.&quot;
          </motion.p>

          <motion.div
            className="mx-auto mt-6 h-px w-12 bg-[rgba(196,109,46,0.4)]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          />

          <motion.p
            className="mt-4 text-xs uppercase tracking-[0.22em] text-white/40"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.5, ease: "easeOut" }}
          >
            Trợ lý học tập tiếng Anh
          </motion.p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-(--bg) px-8 py-16">
        <Suspense fallback={null}>
          <SignInContent />
        </Suspense>
      </div>
    </div>
  );
}
