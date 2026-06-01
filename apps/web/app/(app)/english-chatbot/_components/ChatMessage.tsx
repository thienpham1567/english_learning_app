"use client";

import { Check, Copy, Loader2, Pause, RotateCcw, Volume2 } from "lucide-react";
import { motion } from "motion/react";
import { type ReactNode, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@/components/shared/UserContext";
import type { Persona } from "@/lib/chat/personas";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";
import { ExerciseCard, hasExercisePattern, splitExerciseBlocks } from "./ExerciseCard";

export type DividerMessage = {
  id: string;
  role: "divider";
  text: string;
};

export type PageMessage = AppChatMessage | DividerMessage;

/* ── Utility: extract text from ReactNode tree ── */
function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return extractText(
      (children as unknown as { props?: { children?: ReactNode } }).props?.children,
    );
  }
  return "";
}

/* ── Action Button (ghost style) ── */
function ActionButton({
  icon: Icon,
  label,
  onClick,
  active,
  loading,
  className = "",
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all duration-150 cursor-pointer active:scale-95 ${
        active
          ? "text-accent bg-accent/10"
          : "text-text-muted hover:text-text-primary hover:bg-chat-surface-hover"
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

/* ── Copy Button with feedback ── */
function CopyAction({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <ActionButton
      icon={copied ? Check : Copy}
      label={copied ? "Copied!" : "Copy"}
      onClick={handleCopy}
      active={copied}
    />
  );
}

/* ── User Avatar ── */
function UserAvatar() {
  const user = useUser();

  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        className="w-6 h-6 rounded-lg object-cover border-2 border-border"
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
    <div className="grid place-items-center w-6 h-6 rounded-lg bg-accent/10 border-2 border-border text-[9px] font-bold text-accent">
      {initials}
    </div>
  );
}

/* ── Inline code ── */
function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-chat-code-bg border border-border/50 text-ink font-mono text-[0.85em]">
      {children}
    </code>
  );
}

/* ── Code Block with header + copy ── */
function CodeBlock({ children, className }: { children: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const text = extractText(children);
  const lang = className?.replace(/^language-/, "") || "";

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="relative my-3 rounded-xl border-2 border-border bg-chat-code-bg overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b-2 border-border bg-chat-code-header text-[10px] text-text-muted font-mono font-bold uppercase tracking-wider">
        <span>{lang || "code"}</span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 hover:text-ink transition-colors cursor-pointer"
          aria-label="Copy"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="m-0 p-4 overflow-x-auto text-[12px] leading-relaxed font-mono text-text-primary">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

/* ── MessageBody: splits AI text into markdown + interactive exercises ── */
function MessageBody({
  text,
  isStreaming,
  onSendMessage,
  isChatLoading,
}: {
  text: string;
  isStreaming?: boolean;
  onSendMessage?: (text: string) => void;
  isChatLoading?: boolean;
}) {
  const segments = useMemo(() => {
    // Don't split while streaming — wait for complete message
    if (isStreaming || !hasExercisePattern(text)) {
      return null;
    }
    return splitExerciseBlocks(text);
  }, [text, isStreaming]);

  // Simple markdown rendering (no exercise splitting)
  if (!segments) {
    return (
      <div className="chat-markdown text-sm leading-relaxed text-text-primary">
        <ReactMarkdown
          components={{
            code: ({ className, children }) =>
              className ? (
                <CodeBlock className={className}>{children}</CodeBlock>
              ) : (
                <InlineCode>{children}</InlineCode>
              ),
            pre: ({ children }) => <>{children}</>,
          }}
        >
          {text}
        </ReactMarkdown>

        {isStreaming && (
          <span
            className="inline-block h-4 w-1.5 bg-accent ml-0.5 align-middle animate-pulse rounded-sm"
            aria-hidden="true"
          />
        )}
      </div>
    );
  }

  // Mixed rendering: markdown + exercise cards
  return (
    <div className="chat-markdown text-sm leading-relaxed text-text-primary">
      {segments.map((seg, i) =>
        seg.type === "exercise" ? (
          <ExerciseCard
            key={i}
            text={seg.content}
            title={seg.title}
            onSubmitAnswers={onSendMessage}
            isLoading={isChatLoading}
          />
        ) : (
          <ReactMarkdown
            key={i}
            components={{
              code: ({ className, children }) =>
                className ? (
                  <CodeBlock className={className}>{children}</CodeBlock>
                ) : (
                  <InlineCode>{children}</InlineCode>
                ),
              pre: ({ children }) => <>{children}</>,
            }}
          >
            {seg.content}
          </ReactMarkdown>
        ),
      )}
    </div>
  );
}

/* ── Main ChatMessage Component ── */
export function ChatMessage({
  message,
  isStreaming = false,
  persona,
  onSpeak,
  isSpeaking = false,
  isTtsLoading = false,
  onStopSpeak,
  onRegenerate,
  isLastAssistant = false,
  onSendMessage,
  isChatLoading = false,
}: {
  message: PageMessage;
  isStreaming?: boolean;
  persona?: Persona;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  isTtsLoading?: boolean;
  onStopSpeak?: () => void;
  onRegenerate?: () => void;
  isLastAssistant?: boolean;
  onSendMessage?: (text: string) => void;
  isChatLoading?: boolean;
}) {
  /* ── Divider ── */
  if (message.role === "divider") {
    return (
      <div className="flex items-center gap-4 py-4 my-2">
        <div className="h-0.5 flex-1 bg-border" />
        <span className="text-[10px] font-bold tracking-wider uppercase text-text-muted font-mono px-2">
          {message.text}
        </span>
        <div className="h-0.5 flex-1 bg-border" />
      </div>
    );
  }

  const isUser = message.role === "user";
  const text = message.text.trim();
  if (!text && !isStreaming) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={`group relative w-full py-3 ${
        isUser ? "bg-chat-surface/30" : ""
      }`}
    >
      <div className="mx-auto max-w-2xl px-2">
        {/* ── Row: Avatar + Content ── */}
        <div className="flex gap-3">
          {/* Avatar column — 24px icon */}
          <div className="shrink-0 pt-0.5">
            {isUser ? (
              <UserAvatar />
            ) : persona ? (
              <div className="w-6 h-6 rounded-lg overflow-hidden border-2 border-border">
                <persona.avatar size={24} />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-lg bg-chat-surface border-2 border-border" />
            )}
          </div>

          {/* Content column */}
          <div className="min-w-0 flex-1">
            {/* Sender label */}
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-xs font-bold text-ink leading-none">
                {isUser ? "You" : persona?.label.split(" —")[0] ?? "Tutor"}
              </span>
              {isStreaming && (
                <span className="text-[10px] font-semibold text-accent animate-pulse">
                  typing...
                </span>
              )}
            </div>

            {/* Message body */}
            {isUser ? (
              <div className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
                {text}
              </div>
            ) : (
              <MessageBody
                text={text}
                isStreaming={isStreaming}
                onSendMessage={onSendMessage}
                isChatLoading={isChatLoading}
              />
            )}

            {/* ── Action bar — visible on hover ── */}
            {!isStreaming && text && (
              <div className="mt-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {!isUser && onSpeak && onStopSpeak && (
                  <ActionButton
                    icon={isSpeaking ? Pause : Volume2}
                    label={isSpeaking ? "Stop" : "Listen"}
                    onClick={() => (isSpeaking ? onStopSpeak() : onSpeak(text))}
                    active={isSpeaking}
                    loading={isTtsLoading}
                  />
                )}
                {!isUser && isLastAssistant && onRegenerate && (
                  <ActionButton
                    icon={RotateCcw}
                    label="Regenerate"
                    onClick={onRegenerate}
                  />
                )}
                <CopyAction text={text} />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
