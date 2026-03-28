import { motion } from "motion/react";

export function TypingIndicator() {
  return (
    <motion.div
      className="flex items-end gap-3"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      role="status"
      aria-live="polite"
      aria-label="Cô Minh đang nhập phản hồi"
    >
      <div className="grid size-10 place-items-center rounded-full bg-[var(--accent-light)] text-lg shadow-[var(--shadow-sm)]">
        👩‍🏫
      </div>
      <div className="inline-flex items-center gap-[5px] rounded-[22px] rounded-bl-md border border-[var(--border)] bg-[var(--bubble-ai)] px-4 py-[14px] shadow-[var(--shadow-sm)]">
        <span
          className="inline-block size-[5px] rounded-full bg-[var(--text-muted)] [animation:chatWave_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="inline-block size-[5px] rounded-full bg-[var(--text-muted)] [animation:chatWave_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: "0.14s" }}
        />
        <span
          className="inline-block size-[5px] rounded-full bg-[var(--text-muted)] [animation:chatWave_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: "0.28s" }}
        />
      </div>
    </motion.div>
  );
}
