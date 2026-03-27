import ReactMarkdown from "react-markdown";
import { motion } from "motion/react";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";

export function ChatMessage({ message }: { message: AppChatMessage }) {
  const isUser = message.role === "user";
  const text = message.text.trim();
  if (!text) return null;

  return (
    <motion.div
      className={`chat-msg ${isUser ? "chat-msg--user" : "chat-msg--ai"}`}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="chat-msg__avatar">
          👩‍🏫
        </div>
      )}

      {/* Bubble */}
      <div className="chat-msg__bubble">
        {isUser ? (
          <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>
        ) : (
          <div className="ai-markdown">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
