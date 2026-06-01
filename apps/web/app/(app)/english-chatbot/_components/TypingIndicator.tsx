"use client";

type Props = {
  personaName?: string;
};

export function TypingIndicator({ personaName = "Tutor" }: Props) {
  return (
    <div
      className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
      role="status"
      aria-live="polite"
      aria-label={`${personaName} is replying...`}
    >
      {/* Dots */}
      <div className="inline-flex items-center gap-1.5 px-3 py-2">
        <div className="h-2 w-2 rounded-full bg-accent/60 animate-bounce [animation-delay:-0.3s] [animation-duration:0.8s]" />
        <div className="h-2 w-2 rounded-full bg-accent/60 animate-bounce [animation-delay:-0.15s] [animation-duration:0.8s]" />
        <div className="h-2 w-2 rounded-full bg-accent/60 animate-bounce [animation-duration:0.8s]" />
      </div>
    </div>
  );
}
