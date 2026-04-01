"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  LoaderCircle,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";

import { useUser } from "@/components/app/shared/UserContext";
import type { FuelAssistantRun, FuelToolExecutionStep } from "@/lib/fuel-prices/types";

export function formatTime(value?: string) {
  try {
    return new Date(value ?? Date.now()).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function UserAvatar() {
  const user = useUser();
  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        className="size-10 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="grid size-10 place-items-center rounded-full bg-(--ink) text-xs font-semibold text-white">
      {initials}
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.button
      className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-1 text-xs text-(--text-secondary) transition hover:border-stone-300 hover:text-(--ink)"
      onClick={handleCopy}
      whileTap={{ scale: 0.92 }}
      aria-label="Sao chép"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span>{copied ? "Đã chép" : "Copy"}</span>
    </motion.button>
  );
}

export function FuelExecutionPanel({ run }: { run: FuelAssistantRun }) {
  if (run.tools.length === 0) {
    if (run.status === "error") {
      return (
        <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 shadow-[0_18px_40px_rgba(239,68,68,0.08)]">
          {run.error || "Có lỗi xảy ra khi thực thi function."}
        </div>
      );
    }

    return (
      <div className="rounded-[24px] border border-[#d7ccb9] bg-[linear-gradient(180deg,#fffdf9,#f9f3ea)] px-4 py-4 shadow-[0_22px_60px_rgba(111,78,55,0.12)]">
        <div className="flex items-center gap-2 text-sm text-[#7b6c5d]">
          <LoaderCircle size={16} className="animate-spin text-amber-600" />
          <span>Đang chuẩn bị gọi function...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {run.tools.map((tool) => (
        <FuelFunctionCard key={tool.id} step={tool} />
      ))}
    </div>
  );
}

function FuelFunctionCard({ step }: { step: FuelToolExecutionStep }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      className="overflow-hidden rounded-[24px] border border-[#d7ccb9] bg-[linear-gradient(180deg,#fffdf9,#f9f3ea)] shadow-[0_22px_60px_rgba(111,78,55,0.12)]"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        className="flex w-full items-center gap-3 border-b border-[#e6ddcf] bg-[#f4ede2]/90 px-4 py-3 text-left"
      >
        <StatusGlyph status={step.status} />
        <div className="min-w-0 flex-1 truncate text-[1.05rem] font-semibold text-[#7b6c5d]">
          {step.name}
        </div>
        <StatusPill status={step.status} />
        {isExpanded ? (
          <ChevronDown size={16} className="shrink-0 text-[#a18f77]" />
        ) : (
          <ChevronRight size={16} className="shrink-0 text-[#a18f77]" />
        )}
      </button>

      {isExpanded && (
        <div className="bg-[#fffaf2]">
          <PayloadSection label="INPUT" value={step.input} />
          <PayloadSection
            label="OUTPUT"
            value={
              step.output ??
              (step.status === "running"
                ? { status: "running", message: "Đang chờ kết quả..." }
                : step.error
                  ? { success: false, message: step.error }
                  : {})
            }
          />
        </div>
      )}
    </motion.div>
  );
}

function PayloadSection({
  label,
  value,
}: {
  label: "INPUT" | "OUTPUT";
  value: unknown;
}) {
  return (
    <div className="border-t border-[#ece3d5] first:border-t-0">
      <div className="flex items-center gap-2 bg-[#f3f0e6] px-4 py-3">
        <span className="inline-block h-7 w-1 rounded-full bg-[#97b878]" />
        <span className="text-[0.98rem] font-semibold uppercase tracking-[0.22em] text-[#4d8c37]">
          {label}
        </span>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words bg-[#fffaf5] px-5 py-5 text-[14px] leading-8 text-[#4d433b]">
        <code>{formatPayload(value)}</code>
      </pre>
    </div>
  );
}

function StatusGlyph({
  status,
}: {
  status: FuelToolExecutionStep["status"];
}) {
  if (status === "done") {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={15} />
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-700">
        <XCircle size={15} />
      </span>
    );
  }

  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
      <LoaderCircle size={15} className="animate-spin" />
    </span>
  );
}

function StatusPill({ status }: { status: FuelToolExecutionStep["status"] }) {
  const className =
    status === "done"
      ? "bg-emerald-100 text-emerald-700"
      : status === "error"
        ? "bg-rose-100 text-rose-700"
        : "bg-amber-100 text-amber-700";

  return (
    <span
      className={[
        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        className,
      ].join(" ")}
    >
      {status === "done" ? "success" : status}
    </span>
  );
}

function formatPayload(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2) ?? "{}";
}
