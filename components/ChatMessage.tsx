"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { useUser } from "@/components/app/UserContext";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";

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
      className="chat-msg__copy"
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
        className="chat-msg__avatar chat-msg__avatar--user"
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
    <div className="chat-msg__avatar chat-msg__avatar--user">
      {initials}
    </div>
  );
}

export function ChatMessage({ message }: { message: AppChatMessage }) {
  const isUser = message.role === "user";
  const text = message.text.trim();
  if (!text) return null;

  const time = formatTime();

  return (
    <motion.div
      className={`chat-msg ${isUser ? "chat-msg--user" : "chat-msg--ai"}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {!isUser && (
        <div className="chat-msg__avatar-col">
          <div className="chat-msg__avatar">👩‍🏫</div>
        </div>
      )}

      <div className="chat-msg__content">
        <div className="chat-msg__bubble">
          {isUser ? (
            <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>
          ) : (
            <div className="ai-markdown">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className="chat-msg__meta">
          {time && <span className="chat-msg__time">{time}</span>}
          {!isUser && <CopyButton text={text} />}
        </div>
      </div>

      {isUser && (
        <div className="chat-msg__avatar-col">
          <UserAvatar />
        </div>
      )}
    </motion.div>
  );
}
