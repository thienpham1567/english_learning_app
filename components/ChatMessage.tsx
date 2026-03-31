"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "motion/react";
import { Check, Copy, GraduationCap } from "lucide-react";
import { useUser } from "@/components/app/UserContext";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";

export type DividerMessage = {
  id: string;
  role: "divider";
  text: string;
};

export type PageMessage = AppChatMessage | DividerMessage;

function formatTime() {
  try {
    return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function CopyButton({ text }: { text: string }) {
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
      {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
    </motion.button>
  );
}

function UserAvatar() {
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

export function ChatMessage({
  message,
  className = "",
  isStreaming = false,
}: {
  message: PageMessage;
  className?: string;
  isStreaming?: boolean;
}) {
  if (message.role === "divider") {
    return (
      <div className={["flex items-center gap-3 py-3", className].join(" ")}>
        <div className="h-px flex-1 bg-(--border)" />
        <span className="text-xs text-(--text-muted)">{message.text}</span>
        <div className="h-px flex-1 bg-(--border)" />
      </div>
    );
  }

  const isUser = message.role === "user";
  const text = message.text.trim();
  if (!text && !isStreaming) return null;

  const time = formatTime();

  return (
    <motion.div
      className={[
        "group flex items-end gap-3 [animation:fadeUp_0.25s_ease-out_forwards]",
        isUser ? "justify-end" : "justify-start",
        className,
      ].join(" ")}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {!isUser && (
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-(--ink) text-white shadow-(--shadow-sm)">
          <GraduationCap size={14} strokeWidth={2} />
        </div>
      )}

      <div className={["flex max-w-[min(42rem,80%)] flex-col gap-2", isUser ? "items-end" : "items-start"].join(" ")}>
        <div
          className={[
            "rounded-[22px] px-4 py-3 shadow-(--shadow-sm)",
            isUser
              ? "rounded-br-md bg-(--bubble-user) text-white"
              : "rounded-bl-md border border-(--border) bg-(--bubble-ai) text-(--text-primary)",
          ].join(" ")}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{text}</span>
          ) : (
            <div
              className={[
                "text-[15px] leading-8 text-(--text-primary)",
                "[&_p]:m-0 [&_p:not(:last-child)]:mb-2",
                "[&_strong]:font-semibold [&_strong]:text-(--ink)",
                "[&_em]:italic [&_em]:text-(--text-secondary)",
                "[&_code]:rounded-[5px] [&_code]:bg-(--bg-deep) [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:[font-family:var(--font-mono)] [&_code]:text-[0.86em] [&_code]:text-(--accent)",
                "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
                "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
                "[&_li]:leading-7",
              ].join(" ")}
            >
              <ReactMarkdown>{text}</ReactMarkdown>
              {isStreaming && (
                <span
                  className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] rounded-[1px] bg-(--accent) align-middle [animation:textCursor_0.7s_ease-in-out_infinite]"
                  aria-hidden="true"
                />
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-(--text-muted) opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          {time && <span>{time}</span>}
          {!isUser && <CopyButton text={text} />}
        </div>
      </div>

      {isUser && (
        <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-(--ink) text-xs font-semibold text-white shadow-(--shadow-sm)">
          <UserAvatar />
        </div>
      )}
    </motion.div>
  );
}
