type Props = {
  personaName?: string;
};

export function TypingIndicator({ personaName = "Gia sư" }: Props) {
  return (
    <div
      className="anim-fade-up"
      style={{ display: "flex", alignItems: "flex-end", gap: 12 }}
      role="status"
      aria-live="polite"
      aria-label={`${personaName} đang nhập phản hồi`}
    >
      <div
        style={{
          display: "grid",
          placeItems: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "var(--accent-light)",
          fontSize: 18,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        👩‍🏫
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          borderRadius: 22,
          borderBottomLeftRadius: 6,
          border: "1px solid var(--border)",
          background: "var(--bubble-ai)",
          padding: "14px 16px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--text-muted)",
              animation: "chatWave 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.14}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
