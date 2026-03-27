"use client";

import { Plus, Trash2 } from "lucide-react";

export type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
};

type Props = {
  conversations: ConversationItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
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

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  return (
    <div className="flex h-full w-[220px] shrink-0 flex-col gap-1 overflow-hidden border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
        >
          <Plus size={15} strokeWidth={2} />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-3 text-xs text-[var(--text-muted)]">
            No conversations yet
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <div key={conv.id} className="group relative">
                <button
                  onClick={() => onSelect(conv.id)}
                  className={[
                    "flex w-full flex-col gap-0.5 rounded-[var(--radius)] px-3 py-2.5 text-left transition",
                    isActive
                      ? "bg-[var(--accent-light)] text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]",
                  ].join(" ")}
                >
                  <span className="line-clamp-2 pr-5 text-sm font-medium leading-snug">
                    {conv.title}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {formatRelativeTime(conv.updatedAt)}
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded text-[var(--text-muted)] opacity-0 transition hover:bg-[var(--surface-hover)] hover:text-[rgb(239,68,68)] group-hover:opacity-100"
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
