"use client";

import { useState } from "react";
import { Fuel } from "lucide-react";
import { motion } from "motion/react";

import { useUser } from "@/components/app/UserContext";

/* ── Tool Config ── */
const TOOL_CONFIG: Record<
  string,
  { calling: string; done: string; icon: string }
> = {
  get_fuel_prices: {
    calling: "Đang phân tích dữ liệu thị trường",
    done: "Đã cập nhật dữ liệu",
    icon: "⛽",
  },
  send_discord_report: {
    calling: "Đang gửi báo cáo lên Discord",
    done: "Đã gửi lên Discord",
    icon: "📤",
  },
  compare_fuel_prices: {
    calling: "Đang so sánh giá xăng",
    done: "Đã so sánh xong",
    icon: "📊",
  },
  calculate_fuel_cost: {
    calling: "Đang tính chi phí xăng",
    done: "Đã tính xong",
    icon: "🧮",
  },
};

function getToolInfo(tool: string, status: "calling" | "done") {
  const config = TOOL_CONFIG[tool];
  if (!config)
    return { label: `${tool}: ${status}`, icon: "🔧" };
  return { label: config[status], icon: config.icon };
}

/* ── Time formatter ── */
export function formatTime() {
  try {
    return new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/* ── User Avatar ── */
export function UserAvatar() {
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

/* ── Copy Button ── */
export function CopyButton({ text }: { text: string }) {
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
      {copied ? "✓" : "📋"}
    </motion.button>
  );
}

/* ── Tool Status Card ── */
export function ToolStatusCard({
  tool,
  status,
}: {
  tool: string;
  status: "calling" | "done";
}) {
  const info = getToolInfo(tool, status);
  const isCalling = status === "calling";

  return (
    <motion.div
      className="mt-3 flex items-center gap-2 pl-11"
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div
        className={[
          "flex items-center gap-2.5 rounded-2xl rounded-bl-md border px-4 py-2.5 text-sm shadow-(--shadow-sm)",
          isCalling
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-emerald-200 bg-emerald-50 text-emerald-800",
        ].join(" ")}
      >
        <span className="text-base">{info.icon}</span>
        <span className="font-medium">{info.label}</span>

        {isCalling && (
          <span className="flex items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block size-1.5 rounded-full bg-amber-500"
                animate={{
                  y: [0, -4, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </span>
        )}

        {!isCalling && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            ✅
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

/* ── Typing Indicator ── */
export function TypingIndicator() {
  return (
    <motion.div
      className="mt-7 flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-(--shadow-sm)">
        <Fuel size={14} strokeWidth={2} />
      </div>
      <div className="rounded-2xl rounded-bl-md border border-(--border) bg-white px-4 py-3 shadow-(--shadow-sm)">
        <span className="flex items-center gap-1.5">
          <span className="mr-1 text-xs text-(--text-muted)">Đang xử lý</span>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="inline-block size-1.5 rounded-full bg-(--text-muted)"
              animate={{
                y: [0, -4, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );
}

/* ── Assistant Avatar (small) ── */
export function AssistantAvatar({ size = 8 }: { size?: number }) {
  return (
    <div
      className={`grid size-${size} shrink-0 place-items-center rounded-full bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-(--shadow-sm)`}
    >
      <Fuel size={size === 8 ? 14 : 20} strokeWidth={2} />
    </div>
  );
}
