"use client";

import { useState, useEffect, useMemo } from "react";
import { Copy, Check, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useUser } from "@/components/app/UserContext";
import type {
  FuelAssistantRun,
  FuelToolExecutionStep,
} from "@/lib/fuel-prices/types";

const RESULT_MARKDOWN_CLASSES = [
  "fuel-chat-content text-[15px] leading-7 text-(--text-primary)",
  "[&_p]:m-0 [&_p:not(:last-child)]:mb-2",
  "[&_strong]:font-semibold [&_strong]:text-(--ink)",
  "[&_em]:italic [&_em]:text-(--text-secondary)",
  "[&_code]:rounded-[5px] [&_code]:bg-(--bg-deep) [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:[font-family:var(--font-mono)] [&_code]:text-[0.86em] [&_code]:text-(--accent)",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
  "[&_li]:leading-7",
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse",
  "[&_th]:border [&_th]:border-(--border) [&_th]:bg-(--bg-deep) [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold",
  "[&_td]:border [&_td]:border-(--border) [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm",
].join(" ");

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
    // Chỉ hiển thị hộp này nếu bị lỗi (không gọi được tool nào).
    // Nếu đang chạy bình thường, chúng ta không hiện hộp chờ (để tránh bị chớp UI)
    if (run.status !== "error") return null;

    return (
      <motion.div
        className="mb-3 rounded-[22px] border border-red-200/80 bg-red-50/90 px-4 py-3 shadow-[0_12px_30px_rgba(239,68,68,0.06)]"
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700/80">
          <XCircle size={14} className="text-red-500" />
          <span>Failed</span>
        </div>
        <p className="mt-2 text-sm text-red-700/90">
          {run.error || "Rất tiếc, có lỗi kĩ thuật xảy ra từ máy chủ."}
        </p>
      </motion.div>
    );
  }

  const statusLabel =
    run.status === "error"
      ? "Failed"
      : run.status === "done"
        ? "Completed"
        : "Running";

  return (
    <motion.div
      className="w-full space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
        <div className="flex items-center gap-2">
          {run.status === "running" && (
            <motion.span
              className="inline-block size-1.5 rounded-full bg-emerald-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <span>{statusLabel}</span>
        </div>
        <span>{formatTime(run.finishedAt ?? run.startedAt)}</span>
      </div>

      {run.tools.map((tool, i) => (
        <FuelToolCard key={tool.id} step={tool} index={i} />
      ))}
    </motion.div>
  );
}

/* ── Active Phase Detection ── */
type Phase = "thinking" | "source" | "rendering" | "result";

function getActivePhase(step: FuelToolExecutionStep): Phase {
  if (step.resultMarkdown || step.error || step.status === "done" || step.status === "error") return "result";
  if (step.rendering) return "rendering";
  if (step.sources.length > 0) return "source";
  return "thinking";
}

/* ── Collapsible Section ── */
function CollapsibleSection({
  label,
  defaultOpen = false,
  isActive,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || isActive === true);

  // Sync open state when isActive changes
  useEffect(() => {
    if (isActive !== undefined) {
      setOpen(isActive);
    }
  }, [isActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-1.5 text-left"
      >
        <motion.span
          className="inline-block text-[9px] text-stone-400"
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▶
        </motion.span>
        <span className={[
          "text-[10px] font-semibold uppercase tracking-[0.18em] transition group-hover:text-stone-700",
          isActive ? "text-emerald-600" : "text-stone-500",
        ].join(" ")}>
          {label}
          {isActive && (
            <motion.span
              className="ml-1.5 inline-block size-1 rounded-full bg-emerald-500 align-middle"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Tool Card ── */
function FuelToolCard({
  step,
  index,
}: {
  step: FuelToolExecutionStep;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(step.status === "running");
  const activePhase = useMemo(() => getActivePhase(step), [
    step.status, step.thinking.length, step.sources.length, step.rendering, step.resultMarkdown, step.error,
  ]);
  const isRunning = step.status === "running";

  // Automatically expand when running, collapse when done
  useEffect(() => {
    setIsExpanded(step.status === "running");
  }, [step.status]);

  return (
    <motion.div
      className="rounded-[22px] border border-emerald-200/80 bg-white/95 px-4 py-3.5 shadow-[0_16px_36px_rgba(15,23,42,0.08)]"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center gap-2 text-left text-sm font-semibold text-(--ink) outline-none"
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-700">
          Tool
        </span>
        <span>{step.name}</span>
        {step.status === "running" && (
          <motion.span
            className="ml-2 flex items-center gap-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block size-1 rounded-full bg-emerald-500"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.span>
        )}
        {step.status === "done" && (
          <motion.span
            className="ml-2 text-emerald-500"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle2 size={14} />
          </motion.span>
        )}
        {step.status === "error" && (
          <motion.span
            className="ml-2 text-red-500"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <XCircle size={14} />
          </motion.span>
        )}
        <motion.span
          className="ml-auto inline-block text-[10px] text-stone-400"
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▶
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="mt-3 space-y-3 border-t border-emerald-100/60 pt-3">
              <CollapsibleSection label="Thinking" isActive={isRunning && activePhase === "thinking"}>
                <ul className="space-y-1 text-sm text-(--text-secondary)">
                  {step.thinking.length > 0 ? (
                    step.thinking.map((line, i) => (
                      <motion.li
                        key={line}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.2 }}
                      >
                        {line}
                      </motion.li>
                    ))
                  ) : (
                    <li>Chưa có log xử lý chi tiết.</li>
                  )}
                </ul>
              </CollapsibleSection>

              <CollapsibleSection label="Source" isActive={isRunning && activePhase === "source"}>
                <div className="space-y-2 text-sm text-(--text-secondary)">
                  {step.sources.length > 0 ? (
                    step.sources.map((source) => (
                      <div key={`${source.label}-${source.href ?? ""}`}>
                        {source.href ? (
                          <a
                            href={source.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-emerald-700 underline underline-offset-2"
                          >
                            <span>{source.label}</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="font-medium text-(--ink)">
                            {source.label}
                          </span>
                        )}
                        {source.updatedAt && (
                          <p className="mt-0.5">{source.updatedAt}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>Chưa có metadata nguồn.</p>
                  )}
                </div>
              </CollapsibleSection>

              <CollapsibleSection label="Rendering" isActive={isRunning && activePhase === "rendering"}>
                <p className="text-sm text-(--text-secondary)">
                  {step.rendering ?? "Đang chờ AI dựng kết quả cuối"}
                </p>
              </CollapsibleSection>

              <CollapsibleSection label="Result" isActive={activePhase === "result"} defaultOpen={!isRunning}>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3">
                  {step.resultMarkdown ? (
                    <motion.div
                      className={RESULT_MARKDOWN_CLASSES}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {step.resultMarkdown}
                      </ReactMarkdown>
                    </motion.div>
                  ) : step.error ? (
                    <p className="text-sm text-red-700">{step.error}</p>
                  ) : (
                    <p className="text-sm text-(--text-secondary)">
                      Chưa có kết quả cuối.
                    </p>
                  )}
                </div>
              </CollapsibleSection>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

