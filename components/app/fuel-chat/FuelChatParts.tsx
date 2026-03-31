"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Fuel,
  LoaderCircle,
  Wrench,
} from "lucide-react";
import { motion } from "motion/react";

import { useUser } from "@/components/app/UserContext";
import type { FuelExecutionStep } from "@/lib/fuel-prices/types";

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
  steps,
}: {
  steps: FuelExecutionStep[];
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const agents = steps.filter((step) => step.kind === "agent");
  const tools = steps.filter((step) => step.kind === "tool");
  const orphanTools = tools.filter(
    (tool) => tool.parentId && !agents.some((agent) => agent.id === tool.parentId),
  );
  const hasRunningWork = steps.some(
    (step) => step.status === "running" || step.status === "pending",
  );

  if (steps.length === 0) return null;

  return (
    <div className="w-full space-y-2.5">
      {agents.map((agent) => {
        const isExpanded = expanded[agent.id] ?? true;
        const nestedTools = tools.filter((tool) => tool.parentId === agent.id);

        return (
          <motion.div
            key={agent.id}
            className="overflow-hidden rounded-[20px] border border-emerald-300/70 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
              onClick={() =>
                setExpanded((current) => ({
                  ...current,
                  [agent.id]: !isExpanded,
                }))
              }
            >
              <StatusGlyph status={agent.status} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
                  <span>Call Agent</span>
                  <span className="text-emerald-400">→</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] tracking-[0.08em] text-emerald-700 normal-case">
                    <Bot size={12} />
                    {agent.name}
                  </span>
                </div>
                {agent.summary && (
                  <p className="mt-1 text-sm text-(--text-secondary)">
                    {agent.summary}
                  </p>
                )}
              </div>
              {isExpanded ? (
                <ChevronDown
                  size={16}
                  className="shrink-0 text-emerald-700/70"
                  aria-hidden="true"
                />
              ) : (
                <ChevronRight
                  size={16}
                  className="shrink-0 text-emerald-700/70"
                  aria-hidden="true"
                />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-emerald-100 bg-emerald-50/45 px-4 py-3">
                <div className="space-y-2.5">
                  {nestedTools.map((tool) => (
                    <ToolExecutionRow key={tool.id} step={tool} />
                  ))}

                  {(agent.resultPreview || agent.error) && (
                    <div className="rounded-2xl border border-emerald-200/80 bg-white/90 px-3 py-2.5 text-sm text-(--text-primary)">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
                        Result
                      </div>
                      <p className="mt-1">
                        {agent.error ?? agent.resultPreview}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}

      {orphanTools.map((tool) => (
        <ToolExecutionRow key={tool.id} step={tool} />
      ))}

      {hasRunningWork && (
        <div className="flex items-center gap-2 px-1 text-sm italic text-(--text-muted)">
          <span className="flex items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block size-2 rounded-full bg-emerald-500"
                animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </span>
          <span>AI is processing...</span>
        </div>
      )}
    </div>
  );
}

function ToolExecutionRow({ step }: { step: FuelExecutionStep }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-2.5">
        <StatusGlyph status={step.status} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-(--ink)">
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-600">
              <Wrench size={11} />
              Tool Call
            </span>
            <span>{step.name}</span>
          </div>

          {step.summary && (
            <p className="mt-1 text-sm text-(--text-secondary)">{step.summary}</p>
          )}

          {step.params && Object.keys(step.params).length > 0 && (
            <div className="mt-2 rounded-xl bg-stone-50 px-3 py-2 text-xs text-(--text-secondary)">
              <div className="font-semibold uppercase tracking-[0.12em] text-stone-500">
                Parameters
              </div>
              <p className="mt-1 font-mono text-[11px] leading-5 text-stone-700">
                {formatExecutionPayload(step.params)}
              </p>
            </div>
          )}

          {(step.resultPreview || step.error) && (
            <div className="mt-2 rounded-xl bg-stone-50 px-3 py-2 text-xs text-(--text-secondary)">
              <div className="font-semibold uppercase tracking-[0.12em] text-stone-500">
                Rendering
              </div>
              <p className="mt-1 text-sm text-stone-700">
                {step.error ?? step.resultPreview}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusGlyph({
  status,
}: {
  status: FuelExecutionStep["status"];
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

function formatExecutionPayload(params: Record<string, unknown>) {
  return Object.entries(params)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
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
