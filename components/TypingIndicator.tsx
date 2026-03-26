export function TypingIndicator() {
  return (
    <div className="message-bubble" style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 18, padding: "0 4px" }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: "var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16,
      }}>
        👩‍🏫
      </div>

      {/* Dots bubble */}
      <div style={{
        padding: "12px 18px",
        borderRadius: "18px 18px 18px 4px",
        background: "var(--bubble-ai)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        display: "flex", gap: 5, alignItems: "center",
      }}>
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}
