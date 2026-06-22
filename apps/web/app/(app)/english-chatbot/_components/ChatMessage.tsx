"use client";

import { Check, Copy, Loader2, Pause, RotateCcw, Volume2 } from "lucide-react";
import { motion } from "motion/react";
import { type ReactNode, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useUser } from "@/components/shared/UserContext";
import type { Persona } from "@/lib/chat/personas";
import { parseToeicExercise, splitToeicBlocks } from "@/lib/chat/toeic-exercise";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";
import { ExerciseCard, hasExercisePattern, splitExerciseBlocks } from "./ExerciseCard";
import { ToeicExerciseCard } from "./ToeicExerciseCard";

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
      className={`inline-flex items-center gap-1 border px-2 py-1.5 text-[11px] font-semibold transition-all duration-150 cursor-pointer active:scale-95 ${
        active
          ? "border-accent/40 text-accent-active bg-accent-light"
          : "border-transparent text-text-muted hover:border-border hover:text-text-primary hover:bg-chat-surface-hover"
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
        className="w-7 h-7 object-cover border border-border shadow-sm"
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
    <div className="grid place-items-center w-7 h-7 bg-ink border border-border text-[9px] font-bold text-bg shadow-sm">
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
    <div className="relative my-3 border border-border bg-chat-code-bg overflow-hidden shadow">
      <div className="flex items-center justify-between px-4 py-2 border-b-2 border-border bg-chat-code-header text-[10px] text-text-muted font-semibold uppercase tracking-wider">
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

/* ── MessageBody: markdown + interactive exercises (legacy + toeic) ── */
function MessageBody({
  text,
  isStreaming,
  onSendMessage,
  isChatLoading,
  onSpeak,
  isSpeaking,
}: {
  text: string;
  isStreaming?: boolean;
  onSendMessage?: (text: string) => void;
  isChatLoading?: boolean;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}) {
  const markdownComponents = {
    code: ({ className, children }: { className?: string; children?: ReactNode }) =>
      className ? (
        <CodeBlock className={className}>{children}</CodeBlock>
      ) : (
        <InlineCode>{children}</InlineCode>
      ),
    pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
  };

  // Renders a plain text chunk: legacy exercise split first, else markdown.
  const renderText = (chunk: string, keyPrefix: string) => {
    if (!hasExercisePattern(chunk)) {
      return (
        <ReactMarkdown key={keyPrefix} remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {chunk}
        </ReactMarkdown>
      );
    }
    return splitExerciseBlocks(chunk).map((seg, i) =>
      seg.type === "exercise" ? (
        <ExerciseCard
          key={`${keyPrefix}-${i}`}
          text={seg.content}
          title={seg.title}
          onSubmitAnswers={onSendMessage}
          isLoading={isChatLoading}
        />
      ) : (
        <ReactMarkdown
          key={`${keyPrefix}-${i}`}
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {seg.content}
        </ReactMarkdown>
      ),
    );
  };

  // While streaming, render raw markdown (don't split a half-finished block).
  if (isStreaming) {
    return (
      <div className="chat-markdown text-sm leading-relaxed text-text-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {text}
        </ReactMarkdown>
        <span
          className="inline-block h-4 w-1.5 bg-accent ml-0.5 align-middle animate-pulse rounded-sm"
          aria-hidden="true"
        />
      </div>
    );
  }

  const segments = splitToeicBlocks(text);

  return (
    <div className="chat-markdown text-sm leading-relaxed text-text-primary">
      {segments.map((seg, i) => {
        if (seg.type === "toeic") {
          const exercise = parseToeicExercise(seg.content);
          if (exercise) {
            return (
              <ToeicExerciseCard
                key={`toeic-${i}`}
                exercise={exercise}
                onAskCoach={onSendMessage}
                isLoading={isChatLoading}
                onPlayAudio={onSpeak}
                isPlaying={isSpeaking}
              />
            );
          }
          // Unparseable block → show raw so nothing is lost.
          return (
            <ReactMarkdown
              key={`toeic-${i}`}
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {`\`\`\`\n${seg.content}\`\`\``}
            </ReactMarkdown>
          );
        }
        return renderText(seg.content, `text-${i}`);
      })}
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
      <div className="flex items-center gap-3 py-4 my-2">
        <span className="text-accent text-[10px]">◆</span>
        <div className="h-0.5 flex-1 bg-border" />
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-text-muted font-mono px-1">
          {message.text}
        </span>
        <div className="h-0.5 flex-1 bg-border" />
        <span className="text-accent text-[10px]">◆</span>
      </div>
    );
  }

  const isUser = message.role === "user";
  const text = message.text.trim();
  if (!text && !isStreaming) return null;

  /* ── User: right-aligned hard-shadow block ── */
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="group relative w-full py-3"
      >
        <div className="mx-auto max-w-2xl px-2">
          <div className="flex flex-col items-end">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700/70">
                Bạn
              </span>
              <UserAvatar />
            </div>
            <div className="max-w-[85%] border border-amber-600/40 bg-accent-light px-4 py-2.5 shadow-[3px_3px_0_rgba(180,83,9,0.25)]">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-amber-950">
                {text}
              </div>
            </div>
            {!isStreaming && text && (
              <div className="mt-1.5 flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <CopyAction text={text} />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Assistant: open transmission on an avatar rail ── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative w-full py-3"
    >
      <div className="mx-auto max-w-2xl px-2">
        <div className="flex items-stretch gap-3">
          {/* Avatar rail */}
          <div className="flex shrink-0 flex-col items-center">
            {persona ? (
              <div className="grid h-7 w-7 place-items-center overflow-hidden border border-border bg-bg-deep shadow-sm">
                <persona.avatar size={26} />
              </div>
            ) : (
              <div className="h-7 w-7 border border-border bg-chat-surface" />
            )}
            <div className="mt-1.5 w-0.5 flex-1 bg-border/30" />
          </div>

          {/* Content column */}
          <div className="min-w-0 flex-1 pb-1">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-active">
                {persona?.label.split(" —")[0] ?? "Tutor"}
                <span className="ml-1 text-text-muted/50">//</span>
              </span>
              {isStreaming && (
                <span className="animate-pulse text-[10px] font-semibold uppercase tracking-wider text-accent">
                  ▸ đang gõ
                </span>
              )}
            </div>

            <MessageBody
              text={text}
              isStreaming={isStreaming}
              onSendMessage={onSendMessage}
              isChatLoading={isChatLoading}
              onSpeak={onSpeak}
              isSpeaking={isSpeaking}
            />

            {/* ── Action bar — visible on hover ── */}
            {!isStreaming && text && (
              <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {onSpeak && onStopSpeak && (
                  <ActionButton
                    icon={isSpeaking ? Pause : Volume2}
                    label={isSpeaking ? "Stop" : "Listen"}
                    onClick={() => (isSpeaking ? onStopSpeak() : onSpeak(text))}
                    active={isSpeaking}
                    loading={isTtsLoading}
                  />
                )}
                {isLastAssistant && onRegenerate && (
                  <ActionButton icon={RotateCcw} label="Regenerate" onClick={onRegenerate} />
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
