"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
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
    return (
      <div className="rounded-[22px] border border-emerald-200/80 bg-white/90 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
          <span>{run.status === "running" ? "Running" : "Pending"}</span>
        </div>
        <p className="mt-2 text-sm text-(--text-secondary)">
          Đang chuẩn bị gọi tool đầu tiên
        </p>
      </div>
    );
  }

  const statusLabel =
    run.status === "error"
      ? "Failed"
      : run.status === "done"
        ? "Completed"
        : "Running";

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
        <span>{statusLabel}</span>
        <span>{formatTime(run.finishedAt ?? run.startedAt)}</span>
      </div>

      {run.tools.map((tool) => (
        <FuelToolCard key={tool.id} step={tool} />
      ))}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
      {label}
    </div>
  );
}

function FuelToolCard({ step }: { step: FuelToolExecutionStep }) {
  return (
    <div className="rounded-[22px] border border-emerald-200/80 bg-white/95 px-4 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-(--ink)">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-700">
          Tool
        </span>
        <span>{step.name}</span>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <SectionLabel label="Thinking" />
          <ul className="mt-2 space-y-1 text-sm text-(--text-secondary)">
            {step.thinking.length > 0 ? (
              step.thinking.map((line) => <li key={line}>{line}</li>)
            ) : (
              <li>Chưa có log xử lý chi tiết.</li>
            )}
          </ul>
        </div>

        <div>
          <SectionLabel label="Source" />
          <div className="mt-2 space-y-2 text-sm text-(--text-secondary)">
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
                    <span className="font-medium text-(--ink)">{source.label}</span>
                  )}
                  {source.updatedAt && <p className="mt-0.5">{source.updatedAt}</p>}
                </div>
              ))
            ) : (
              <p>Chưa có metadata nguồn.</p>
            )}
          </div>
        </div>

        <div>
          <SectionLabel label="Rendering" />
          <p className="mt-2 text-sm text-(--text-secondary)">
            {step.rendering ?? "Đang chờ AI dựng kết quả cuối"}
          </p>
        </div>

        <div>
          <SectionLabel label="Result" />
          <div className="mt-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3">
            {step.resultMarkdown ? (
              <div className={RESULT_MARKDOWN_CLASSES}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {step.resultMarkdown}
                </ReactMarkdown>
              </div>
            ) : step.error ? (
              <p className="text-sm text-red-700">{step.error}</p>
            ) : (
              <p className="text-sm text-(--text-secondary)">
                Chưa có kết quả cuối.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
