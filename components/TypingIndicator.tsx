import { motion } from "motion/react";

export function TypingIndicator() {
  return (
    <motion.div
      className="chat-typing"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="chat-msg__avatar">
        👩‍🏫
      </div>
      <div className="chat-typing__bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </motion.div>
  );
}
