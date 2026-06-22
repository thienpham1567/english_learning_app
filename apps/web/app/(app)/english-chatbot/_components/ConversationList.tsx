"use client";

import { Check, Plus, Search, Trash2, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

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

/* ── Date grouping helpers ── */
function getDateGroup(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "Previous 7 days";
  if (diffDays <= 30) return "Previous 30 days";
  return "Older";
}

const GROUP_ORDER = ["Today", "Yesterday", "Previous 7 days", "Previous 30 days", "Older"];

export function truncateTitle(title: string, max = 36): string {
  return title.length > max ? title.slice(0, max) + "…" : title;
}

export function ConversationList({ activeId }: Props) {
  const router = useRouter();
  const { conversations, deleteConversation } = useChatConversations();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleNew = useCallback(() => {
    router.push("/english-chatbot");
  }, [router]);

  /* ── Filter + group ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, search]);

  const grouped = useMemo(() => {
    const groups = new Map<string, ConversationItem[]>();
    for (const conv of filtered) {
      const group = getDateGroup(conv.updatedAt);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(conv);
    }
    // Sort by GROUP_ORDER
    return GROUP_ORDER.filter((g) => groups.has(g)).map((g) => ({
      label: g,
      items: groups.get(g)!,
    }));
  }, [filtered]);

  return (
    <div className="relative flex h-full w-[260px] shrink-0 flex-col overflow-hidden border-r-2 border-border bg-[var(--bg)] text-text-secondary">
      {/* Dot pattern background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(color-mix(in_srgb,var(--border)_15%,transparent)_1px,transparent_1px)] bg-[size:22px_22px] z-0" />

      {/* ── Header ── */}
      <div className="relative z-10 px-4 pt-5 pb-3 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center border border-border bg-accent text-text-on-accent shadow-sm">
            <Trophy className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm font-bold leading-none tracking-tight text-ink">
              Aria
            </span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-text-muted">
              Lịch sử phiên
            </span>
          </div>
        </div>

        {/* New conversation button */}
        <button
          onClick={handleNew}
          className="flex w-full items-center justify-center gap-2 border border-border bg-accent px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider rounded-xl text-text-on-accent shadow transition-all duration-150 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          Phiên mới
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm phiên…"
            className="w-full border border-border bg-chat-surface pl-8 pr-3 py-2 text-[11px] font-semibold text-ink placeholder-text-muted outline-none focus:border-accent transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-ink cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="relative z-10 mx-4 h-0.5 bg-border" />

      {/* ── Grouped Conversation List ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-border-strong scrollbar-track-transparent">
        {grouped.length === 0 ? (
          <div className="py-10 px-4 text-center text-xs text-text-muted font-medium">
            {search ? "No conversations found" : "No conversations yet"}
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="mb-1">
              {/* Group header */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                <span className="text-accent text-[9px]">▸</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted font-mono">
                  {group.label}
                </span>
                <span className="h-px flex-1 bg-border/60" />
              </div>

              {/* Items */}
              <div className="space-y-0.5">
                {group.items.map((conv) => {
                  const isActive = conv.id === activeId;
                  const isConfirming = conv.id === confirmingId;

                  if (isConfirming) {
                    return (
                      <div
                        key={conv.id}
                        className="flex items-center gap-2 border border-error bg-error/10 p-2.5 mx-1 animate-in fade-in zoom-in-95 duration-150"
                      >
                        <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-error">
                          Xoá phiên?
                        </span>
                        <button
                          onClick={() => {
                            deleteConversation(conv.id);
                            setConfirmingId(null);
                            if (conv.id === activeId) router.push("/english-chatbot");
                          }}
                          className="flex h-6 w-6 items-center justify-center border border-border bg-error text-white cursor-pointer"
                          aria-label="Confirm delete"
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          className="flex h-6 w-6 items-center justify-center border border-border bg-surface text-text-secondary hover:text-ink cursor-pointer"
                          aria-label="Cancel delete"
                        >
                          <X className="h-3 w-3" strokeWidth={3} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={conv.id} className="group relative mx-1">
                      <Link
                        href={`/english-chatbot/${conv.id}`}
                        className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition-all duration-150 ${
                          isActive
                            ? "border border-border bg-accent-light text-ink shadow-sm"
                            : "border border-transparent text-text-secondary hover:border-border hover:bg-chat-surface-hover hover:text-text-primary"
                        }`}
                      >
                        <span
                          className={`text-[10px] leading-none ${isActive ? "text-accent" : "text-transparent"}`}
                          aria-hidden
                        >
                          ▶
                        </span>
                        <span className="flex-1 text-xs font-semibold leading-snug truncate pr-5">
                          {truncateTitle(conv.title)}
                        </span>
                      </Link>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setConfirmingId(conv.id);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg text-text-muted opacity-0 group-hover:opacity-100 hover:bg-error/10 hover:text-error transition-all duration-200 cursor-pointer"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
