"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, X } from "lucide-react";

export function PWAInstallBanner() {
  const { canInstall, install, dismiss } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <div className="fixed flex items-center gap-3 py-3 px-5 rounded-2xl" style={{bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "linear-gradient(135deg, var(--accent), var(--accent-hover, var(--accent)))", color: "var(--text-on-accent)", boxShadow: "0 8px 32px color-mix(in srgb, var(--accent) 40%, transparent)", maxWidth: "calc(100vw - 32px)", width: "auto", animation: "slideUp 0.4s ease-out"}} >
      <Download className="text-xl shrink-0" />
      <div className="flex-1 w-[0px]" >
        <div className="text-sm font-bold" >Cài đặt TOEIC Master</div>
        <div className="text-xs" style={{opacity: 0.85}} >Truy cập nhanh hơn</div>
      </div>
      <button
        onClick={install} className="py-2 px-4 border-none text-[13px] font-bold cursor-pointer" style={{borderRadius: 10, background: "rgba(255,255,255,0.2)", color: "var(--text-on-accent)", whiteSpace: "nowrap"}} >
        Cài đặt
      </button>
      <button
        onClick={dismiss}
        
        aria-label="Đóng" className="bg-none border-none cursor-pointer p-1 text-sm leading-none" style={{color: "rgba(255,255,255,0.7)"}} >
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
