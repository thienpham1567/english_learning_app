"use client";

import {
  ArrowDown,
  ArrowUp,
  Fuel,
  TrendingUp,
  Sparkles,
  Calculator,
  Send,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useFuelChat } from "@/hooks/useFuelChat";
import {
  FuelExecutionPanel,
  UserAvatar,
  formatTime,
} from "@/components/app/fuel-prices/FuelChatParts";
import type { FuelAssistantRun } from "@/lib/fuel-prices/types";
import { useState } from "react";

/* ── Suggested prompts ── */
const SUGGESTED = [{ text: "Xăng hôm nay bao nhiêu?", icon: Fuel }];

/* ── Main Component ── */
export function FuelPriceChat() {
  const {
    discordWebhookUrl,
    setDiscordWebhookUrl,
    hasMessages,
    send,
    scrollContainerRef,
    handleScroll,
    messages,
    isLoading,
    error,
    clearError,
    bottomRef,
    showScrollBtn,
    scrollToBottom,
    input,
    textareaRef,
    setInput,
    autoResize,
  } = useFuelChat();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-(--border) bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-(--shadow-md)">
      {/* ── Header ── */}
      <ChatHeader
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />

      {/* ── Settings Panel ── */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            discordWebhookUrl={discordWebhookUrl}
            onUrlChange={setDiscordWebhookUrl}
          />
        )}
      </AnimatePresence>

      {/* ── Messages Area ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8"
      >
        {/* Warm radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto flex min-h-full w-full max-w-4xl flex-col">
          {/* Empty state */}
          <AnimatePresence>
            {!hasMessages && <EmptyState onSend={send} />}
          </AnimatePresence>

          {/* Message list */}
          {hasMessages && (
            <div className="flex flex-col">
              {messages.map((m, index) => {
                const previous = index > 0 ? messages[index - 1] : undefined;
                const showSpacing = index > 0 && previous?.role !== m.role;

                if (m.role === "assistant") {
                  return (
                    <ExecutionTurn
                      key={m.id}
                      run={m.run}
                      showSpacing={showSpacing}
                    />
                  );
                }

                return (
                  <UserPromptBubble
                    key={m.id}
                    text={m.text}
                    showSpacing={showSpacing}
                  />
                );
              })}
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && <ErrorBanner error={error} onDismiss={clearError} />}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Scroll to bottom ── */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            className="absolute bottom-22 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--text-secondary) shadow-(--shadow-lg) transition hover:bg-(--surface-hover) hover:text-(--ink)"
            onClick={scrollToBottom}
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.18 }}
          >
            <ArrowDown size={12} strokeWidth={2.5} />
            Xuống cuối
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Input Area ── */}
      <ChatInput
        input={input}
        isLoading={isLoading}
        textareaRef={textareaRef}
        onInputChange={setInput}
        onAutoResize={autoResize}
        onSend={() => send()}
      />
    </div>
  );
}

/* ── Sub-components (private to this file) ── */

function ChatHeader({
  showSettings,
  onToggleSettings,
}: {
  showSettings: boolean;
  onToggleSettings: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-(--border) bg-white/60 px-6 py-4 backdrop-blur-sm">
      <div className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-(--shadow-sm)">
        <Fuel size={20} strokeWidth={2} />
      </div>
      <div className="flex-1">
        <h2 className="text-[15px] font-semibold text-(--ink)">
          Cây xăng cô Kiều ⛽
        </h2>
        <p className="text-xs text-(--text-muted)">
          Tra giá · So sánh · Tính chi phí · Gửi Discord
        </p>
      </div>
      <button
        onClick={onToggleSettings}
        className={[
          "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200",
          showSettings
            ? "bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-amber-200/50 shadow-md"
            : "border border-(--border) bg-(--surface) text-(--text-secondary) hover:border-amber-400/60 hover:bg-amber-50 hover:text-amber-700 hover:shadow-md",
        ].join(" ")}
        title="Cài đặt Discord Webhook"
      >
        <Settings
          size={15}
          strokeWidth={2}
          className={[
            "transition-transform duration-300",
            showSettings ? "rotate-90" : "",
          ].join(" ")}
        />
        <span>Cài đặt</span>
      </button>
    </div>
  );
}

function SettingsPanel({
  discordWebhookUrl,
  onUrlChange,
}: {
  discordWebhookUrl: string;
  onUrlChange: (url: string) => void;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden border-b border-(--border) bg-(--bg-deep)/50"
    >
      <div className="px-6 py-4">
        <label
          htmlFor="discordWebhookUrl"
          className="mb-1.5 block text-sm font-medium text-(--text-primary)"
        >
          Discord Webhook URL (Tùy chọn)
        </label>
        <input
          id="discordWebhookUrl"
          type="text"
          value={discordWebhookUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          className="w-full rounded-lg border border-(--border) bg-white px-3 py-2 text-sm text-(--text-primary) shadow-(--shadow-sm) placeholder:text-(--text-muted) focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <p className="mt-1.5 text-xs text-(--text-muted)">
          Dùng để gửi báo cáo giá xăng trực tiếp. Nếu để trống sẽ dùng URL mặc
          định của hệ thống.
        </p>
      </div>
    </motion.div>
  );
}

function EmptyState({ onSend }: { onSend: (text: string) => void }) {
  return (
    <motion.div
      className="mx-auto my-auto flex max-w-2xl flex-col items-center text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <motion.div
        className="relative"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: 0.1,
          duration: 0.5,
          type: "spring",
          stiffness: 180,
          damping: 14,
        }}
      >
        <div className="grid size-20 place-items-center rounded-2xl bg-linear-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-lg">
          <Fuel size={40} strokeWidth={1.6} />
        </div>
        <motion.span
          className="absolute -bottom-1 -right-1 text-2xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          💰
        </motion.span>
      </motion.div>

      <motion.h2
        className="mt-6 text-4xl italic [font-family:var(--font-display)] text-(--ink)"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        Cây xăng cô Kiều 💁‍♀️
      </motion.h2>

      <div className="mt-8 flex w-full justify-center">
        {SUGGESTED.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.text}
              className="group flex items-center gap-3 rounded-full border border-(--border) bg-white/60 pl-2 pr-5 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ring-1 ring-black/5 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_24px_rgba(245,158,11,0.08)] hover:ring-amber-300/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
              onClick={() => onSend(s.text)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35, ease: "easeOut" }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-amber-100 to-amber-50 text-amber-600 shadow-inner">
                <Icon
                  size={16}
                  strokeWidth={2}
                  className="transition-transform group-hover:scale-110"
                />
              </span>
              <span className="text-sm font-medium text-(--ink)">{s.text}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function UserPromptBubble({
  text,
  showSpacing,
}: {
  text: string;
  showSpacing: boolean;
}) {
  return (
    <motion.div
      className={[
        "group flex items-start justify-end gap-3",
        showSpacing ? "mt-7" : "mt-1",
      ].join(" ")}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex max-w-[min(42rem,80%)] flex-col items-end gap-2">
        <div className="rounded-[22px] rounded-br-md bg-(--bubble-user) px-4 py-3 text-white shadow-(--shadow-sm)">
          <span className="whitespace-pre-wrap">{text}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-(--text-muted) opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span>{formatTime()}</span>
        </div>
      </div>

      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-(--ink) text-xs font-semibold text-white shadow-(--shadow-sm)">
        <UserAvatar />
      </div>
    </motion.div>
  );
}

function ExecutionTurn({
  run,
  showSpacing,
}: {
  run: FuelAssistantRun;
  showSpacing: boolean;
}) {
  return (
    <motion.div
      className={["flex justify-start", showSpacing ? "mt-7" : "mt-1"].join(
        " ",
      )}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-[min(48rem,90%)]">
        <FuelExecutionPanel run={run} />
      </div>
    </motion.div>
  );
}

function ErrorBanner({
  error,
  onDismiss,
}: {
  error: string;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      className="mt-5 rounded-(--radius) border border-[rgba(239,68,68,0.16)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[rgb(153,27,27)]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
    >
      <p>{error}</p>
      <button
        className="mt-2 font-medium underline underline-offset-2"
        onClick={onDismiss}
      >
        Đóng
      </button>
    </motion.div>
  );
}

function ChatInput({
  input,
  isLoading,
  textareaRef,
  onInputChange,
  onAutoResize,
  onSend,
}: {
  input: string;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onAutoResize: () => void;
  onSend: () => void;
}) {
  return (
    <div className="shrink-0 bg-(--bg)/80 px-4 py-4 backdrop-blur-md md:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
        <div className="flex items-end gap-3 rounded-2xl border border-(--border) bg-(--surface) p-3 shadow-(--shadow-md) transition-[border-color,box-shadow] duration-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:shadow-(--shadow-lg)">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Sparkles size={18} strokeWidth={2} />
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              onInputChange(e.target.value);
              onAutoResize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Hỏi Cô Kiều về giá xăng, xu hướng thị trường, hoặc tính chi phí..."
            disabled={isLoading}
            rows={1}
            className="min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-6 text-(--text-primary) outline-none placeholder:text-(--text-muted) disabled:cursor-not-allowed focus:outline-none"
          />
          <motion.button
            className={[
              "grid size-11 shrink-0 place-items-center rounded-full text-white shadow-(--shadow-sm) transition-[background-color,transform] duration-200 enabled:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:bg-(--border-strong)",
              input.trim() && !isLoading
                ? "bg-linear-to-r from-amber-500 to-orange-600"
                : "bg-(--ink)",
            ].join(" ")}
            onClick={onSend}
            disabled={!input.trim() || isLoading}
            whileTap={{ scale: 0.88 }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Send size={16} strokeWidth={2.5} />
              </motion.div>
            ) : (
              <ArrowUp size={18} strokeWidth={2.5} />
            )}
          </motion.button>
        </div>
        <p className="text-sm text-(--text-muted)">
          Enter để gửi · Shift+Enter để xuống dòng · 4 tools AI tự chọn
        </p>
      </div>
    </div>
  );
}
