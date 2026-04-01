"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tooltip } from "antd";
import { Plus, Trash2, GraduationCap, Check, X } from "lucide-react";

import { useChatConversations } from "@/components/app/english-chatbot/ChatConversationProvider";

export type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
  personaId: string;
};

type Props = {
  activeId: string | null;
};

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function truncateTitle(
  title: string,
  max = 40,
): { text: string; truncated: boolean } {
  return title.length > max
    ? { text: title.slice(0, max) + "…", truncated: true }
    : { text: title, truncated: false };
}

export function ConversationList({ activeId }: Props) {
  const router = useRouter();
  const { conversations, deleteConversation } = useChatConversations();

  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleNew = useCallback(() => {
    router.push("/english-chatbot");
  }, [router]);
  return (
    <div className="relative flex h-full w-[220px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-(--ink)">
      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Header identity row */}
      <div className="relative px-4 pt-5 pb-3">
        <div className="mb-3 flex items-center gap-2">
          <div className="grid size-6 shrink-0 place-items-center rounded-full bg-(--accent-light) text-(--accent)">
            <GraduationCap size={13} strokeWidth={2} />
          </div>
          <span className="text-sm italic text-white/80 [font-family:var(--font-display)]">
            English Tutor
          </span>
        </div>
        <button
          onClick={handleNew}
          className="flex w-full items-center justify-center gap-2 rounded-(--radius) border border-white/15 px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/8 hover:text-white/90"
        >
          <Plus size={15} strokeWidth={2} />
          New chat
        </button>
      </div>

      <div className="relative flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-3 text-xs text-white/30">
            No conversations yet
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const isConfirming = conv.id === confirmingId;
            const { text, truncated } = truncateTitle(conv.title);
            const titleSpan = (
              <span className="pr-5 text-sm font-medium leading-snug">
                {text}
              </span>
            );

            if (isConfirming) {
              return (
                <div
                  key={conv.id}
                  className="flex items-center gap-1 rounded-(--radius) border border-red-400 bg-red-500/10 px-3 py-2.5"
                >
                  <span className="flex-1 text-sm font-medium text-red-300">
                    Xoá?
                  </span>
                  <button
                    onClick={() => {
                      deleteConversation(conv.id);
                      setConfirmingId(null);
                      if (conv.id === activeId) {
                        router.push("/english-chatbot");
                      }
                    }}
                    className="grid size-6 place-items-center rounded text-red-400 transition hover:bg-red-500/20"
                    aria-label="Confirm delete"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    className="grid size-6 place-items-center rounded text-white/50 transition hover:bg-white/8 hover:text-white/80"
                    aria-label="Cancel delete"
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            }

            return (
              <div key={conv.id} className="group relative">
                <Link
                  href={`/english-chatbot/${conv.id}`}
                  className={[
                    "flex w-full flex-col gap-0.5 rounded-(--radius) border-l-2 px-3 py-2.5 text-left transition",
                    isActive
                      ? "border-(--accent) bg-white/6 text-white/90"
                      : "border-transparent text-white/65 hover:bg-white/5 hover:text-white/80",
                  ].join(" ")}
                >
                  {truncated ? (
                    <Tooltip title={conv.title}>{titleSpan}</Tooltip>
                  ) : (
                    titleSpan
                  )}
                  <span className="text-[11px] text-white/30">
                    {formatRelativeTime(conv.updatedAt)}
                  </span>
                </Link>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmingId(conv.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded text-white/30 opacity-0 transition hover:bg-white/8 hover:text-red-400 group-hover:opacity-100"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
