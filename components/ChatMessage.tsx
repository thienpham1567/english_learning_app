import { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";

function getMessageText(m: UIMessage): string {
  return (m.parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

export function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = getMessageText(message);
  if (!text) return null;

  return (
    <div
      className="message-bubble"
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
        marginBottom: 18,
        // User → push to right; AI → push to left
        justifyContent: isUser ? "flex-end" : "flex-start",
        width: "100%",
      }}
    >
      {/* AI avatar — only on the left */}
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>
          👩‍🏫
        </div>
      )}

      {/* Bubble */}
      <div style={{
        maxWidth: "72%",
        padding: "11px 16px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser ? "var(--bubble-user)" : "var(--bubble-ai)",
        color: isUser ? "#ffffff" : "var(--text-primary)",
        fontSize: 15,
        lineHeight: 1.65,
        boxShadow: isUser
          ? "0 2px 8px rgba(232,98,58,0.2)"
          : "0 1px 4px rgba(0,0,0,0.07)",
        border: isUser ? "none" : "1px solid var(--border)",
      }}>
        {isUser ? (
          <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>
        ) : (
          <div className="ai-markdown">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
