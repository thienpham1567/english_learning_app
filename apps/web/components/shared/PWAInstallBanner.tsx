"use client";

import { Download, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function PWAInstallBanner() {
  const { canInstall, install, dismiss } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 py-3 px-5 rounded-2xl text-[var(--text-on-accent)] max-w-[calc(100vw-32px)] w-auto animate-[slideUp_0.4s_ease-out]"
      style={{
        background: "linear-gradient(135deg, var(--accent), var(--accent-hover, var(--accent)))",
        boxShadow: "0 8px 32px color-mix(in srgb, var(--accent) 40%, transparent)",
      }}
    >
      <Download className="text-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold">Install TOEIC Master</div>
        <div className="text-xs opacity-85">Faster access</div>
      </div>
      <button
        onClick={install}
        className="py-2 px-4 border-none text-[13px] font-bold cursor-pointer rounded-[10px] bg-white/20 text-[var(--text-on-accent)] whitespace-nowrap"
      >
        Install
      </button>
      <button
        onClick={dismiss}
        aria-label="Close"
        className="bg-none border-none cursor-pointer p-1 text-sm leading-none text-white/70"
      >
        <X />
      </button>

      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
