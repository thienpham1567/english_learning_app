"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Fuel,
  LoaderCircle,
} from "lucide-react";
import { motion } from "motion/react";

import { useUser } from "@/components/app/UserContext";
import type { FuelFunctionCall } from "@/lib/fuel-prices/types";

/* ── Tool Config ── */
const TOOL_CONFIG: Record<
  string,
  { calling: string; done: string; icon: string }
> = {
  get_fuel_prices: {
    calling: "Đang phân tích dữ liệu thị trường",
    done: "Đã cập nhật dữ liệu",
    icon: "⛽",
  },
  send_discord_report: {
    calling: "Đang gửi báo cáo lên Discord",
    done: "Đã gửi lên Discord",
    icon: "📤",
  },
  compare_fuel_prices: {
    calling: "Đang so sánh giá xăng",
    done: "Đã so sánh xong",
    icon: "📊",
  },
  calculate_fuel_cost: {
    calling: "Đang tính chi phí xăng",
    done: "Đã tính xong",
    icon: "🧮",
  },
};

function getToolInfo(tool: string, status: "calling" | "done") {
  const config = TOOL_CONFIG[tool];
  if (!config)
    return { label: `${tool}: ${status}`, icon: "🔧" };
  return { label: config[status], icon: config.icon };
}

/* ── Time formatter ── */
export function formatTime() {
  try {
    return new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/* ── User Avatar ── */
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

/* ── Copy Button ── */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <motion.button
      className="rounded-full p-1 text-(--text-muted) transition hover:text-(--text-primary)"
      onClick={handleCopy}
      whileTap={{ scale: 0.85 }}
      aria-label="Sao chép"
    >
      {copied ? "✓" : "📋"}
    </motion.button>
  );
}

/* ── Tool Status Card ── */
export function ToolStatusCard({
  tool,
  status,
}: {
  tool: string;
  status: "calling" | "done";
}) {
  const info = getToolInfo(tool, status);
  const isCalling = status === "calling";

  return (
    <motion.div
      className={[
        "flex items-center gap-2.5 text-sm",
        isCalling ? "text-amber-800" : "text-emerald-800",
      ].join(" ")}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <span className="text-base">{info.icon}</span>
      <span className="font-medium">{info.label}</span>

      {isCalling && (
        <span className="flex items-center gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="inline-block size-1.5 rounded-full bg-amber-500"
              animate={{
                y: [0, -4, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </span>
      )}

      {!isCalling && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          ✅
        </motion.span>
      )}
    </motion.div>
  );
}

export function FuelExecutionTimeline({
  calls,
}: {
  calls: FuelFunctionCall[];
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (calls.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      {calls.map((call) => {
        const isExpanded = expanded[call.id] ?? true;

        return (
          <motion.div
            key={call.id}
            className="overflow-hidden rounded-[24px] border border-[#d7ccb9] bg-[linear-gradient(180deg,#fffdf9,#f9f3ea)] shadow-[0_22px_60px_rgba(111,78,55,0.12)]"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 border-b border-[#e6ddcf] bg-[#f4ede2]/90 px-4 py-3 text-left"
              onClick={() =>
                setExpanded((current) => ({
                  ...current,
                  [call.id]: !isExpanded,
                }))
              }
            >
              <StatusGlyph status={call.status} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[1.05rem] font-semibold text-[#7b6c5d]">
                  {call.name}
                </div>
              </div>
              <StatusPill status={call.status} />
              {isExpanded ? (
                <ChevronDown
                  size={16}
                  className="shrink-0 text-[#a18f77]"
                  aria-hidden="true"
                />
              ) : (
                <ChevronRight
                  size={16}
                  className="shrink-0 text-[#a18f77]"
                  aria-hidden="true"
                />
              )}
            </button>

            {isExpanded && (
              <div className="bg-[#fffaf2]">
                <FunctionPayloadSection label="INPUT" value={call.input} />
                <FunctionPayloadSection
                  label="OUTPUT"
                  value={
                    call.output ??
                    (call.status === "running"
                      ? { status: "running", message: "Đang chờ kết quả..." }
                      : call.error
                        ? { success: false, message: call.error }
                        : {})
                  }
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function FunctionPayloadSection({
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
  status: FuelFunctionCall["status"];
}) {
  if (status === "success") {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={15} />
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-700">
        <AlertTriangle size={15} />
      </span>
    );
  }

  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
      <LoaderCircle size={15} className="animate-spin" />
    </span>
  );
}

function StatusPill({ status }: { status: FuelFunctionCall["status"] }) {
  const className =
    status === "success"
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
      {status}
    </span>
  );
}

function formatPayload(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2) ?? "{}";
}

/* ── Typing Indicator ── */
export function TypingIndicator() {
  return (
    <motion.div
      className="mt-7 flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-(--shadow-sm)">
        <Fuel size={14} strokeWidth={2} />
      </div>
      <div className="rounded-2xl rounded-bl-md border border-(--border) bg-white px-4 py-3 shadow-(--shadow-sm)">
        <span className="flex items-center gap-1.5">
          <span className="mr-1 text-xs text-(--text-muted)">Đang xử lý</span>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="inline-block size-1.5 rounded-full bg-(--text-muted)"
              animate={{
                y: [0, -4, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );
}

/* ── Assistant Avatar (small) ── */
export function AssistantAvatar({ size = 8 }: { size?: number }) {
  return (
    <div
      className={`grid size-${size} shrink-0 place-items-center rounded-full bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-(--shadow-sm)`}
    >
      <Fuel size={size === 8 ? 14 : 20} strokeWidth={2} />
    </div>
  );
}
