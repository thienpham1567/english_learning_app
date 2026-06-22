"use client";

type Props = {
  personaName?: string;
};

export function TypingIndicator({ personaName = "Tutor" }: Props) {
  return (
    <div
      className="flex items-center gap-2.5 border border-border bg-chat-surface px-3 py-2 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
      role="status"
      aria-live="polite"
      aria-label={`${personaName} is replying...`}
    >
      {/* Square blocks bouncing */}
      <div className="inline-flex items-center gap-1">
        <div className="h-2 w-2 bg-accent animate-bounce [animation-delay:-0.3s] [animation-duration:0.8s]" />
        <div className="h-2 w-2 bg-accent animate-bounce [animation-delay:-0.15s] [animation-duration:0.8s]" />
        <div className="h-2 w-2 bg-accent animate-bounce [animation-duration:0.8s]" />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
        {personaName} đang soạn
      </span>
    </div>
  );
}
