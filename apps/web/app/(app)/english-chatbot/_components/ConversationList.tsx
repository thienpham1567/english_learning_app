"use client";

import { Check, Plus, Trash2, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { useChatConversations } from "@/app/(app)/english-chatbot/_components/ChatConversationProvider";

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

export function truncateTitle(title: string, max = 32): { text: string; truncated: boolean } {
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
    <div className="relative flex h-full w-[230px] shrink-0 flex-col overflow-hidden border-r border-chat-sidebar-border bg-chat-sidebar-bg text-text-secondary">
      {/* Background glow overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_30%_at_50%_95%,color-mix(in srgb, var(--warning) 5%, transparent),transparent_70%)] z-0" />

      {/* Header */}
      <div className="relative z-10 px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Trophy className="h-3.5 w-3.5" />
          </div>
          <span className="font-display text-sm font-semibold italic text-ink tracking-wide">
            English Tutors
          </span>
        </div>

        <button
          onClick={handleNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-chat-surface-hover px-4 py-2.5 text-xs font-semibold text-text-primary hover:brightness-110 hover:text-ink transition-all duration-200 cursor-pointer shadow-sm active:scale-98"
        >
          <Plus className="h-3.5 w-3.5" />
          New Conversation
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-border relative z-10" />

      {/* Conversation List */}
      <div className="relative z-10 flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin scrollbar-thumb-border-strong scrollbar-track-transparent">
        {conversations.length === 0 ? (
          <div className="py-8 px-4 text-center text-xs text-text-muted font-medium">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const isConfirming = conv.id === confirmingId;
            const { text } = truncateTitle(conv.title);

            if (isConfirming) {
              return (
                <div
                  key={conv.id}
                  className="flex items-center gap-2 rounded-xl border border-error bg-error/10 p-2.5 animate-in fade-in zoom-in-95 duration-150"
                >
                  <span className="flex-1 text-xs font-semibold text-error">Delete?</span>
                  <button
                    onClick={() => {
                      deleteConversation(conv.id);
                      setConfirmingId(null);
                      if (conv.id === activeId) router.push("/english-chatbot");
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-error text-white hover:bg-error transition-colors cursor-pointer"
                    aria-label="Confirm delete"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-chat-surface-hover text-text-secondary hover:text-ink hover:brightness-110 transition-colors cursor-pointer"
                    aria-label="Cancel delete"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            }

            return (
              <div key={conv.id} className="group relative rounded-xl transition-all duration-150">
                <Link
                  href={`/english-chatbot/${conv.id}`}
                  className={`flex w-full flex-col gap-1 rounded-xl px-3 py-2.5 text-left transition-all duration-180 ${
                    isActive
                      ? "bg-chat-surface-hover text-ink border-l-2 border-accent shadow-sm"
                      : "text-text-secondary hover:bg-chat-surface-hover/40 hover:text-text-primary"
                  }`}
                >
                  <span className="pr-6 text-xs font-semibold leading-relaxed tracking-wide">
                    {text}
                  </span>
                  <span className="text-[10px] text-text-muted font-medium">
                    {formatRelativeTime(conv.updatedAt)}
                  </span>
                </Link>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setConfirmingId(conv.id);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg text-text-muted opacity-0 group-hover:opacity-100 hover:bg-chat-surface-hover hover:text-error transition-all duration-200 cursor-pointer"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
