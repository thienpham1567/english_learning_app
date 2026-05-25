"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useChatScroll(deps: { messagesLength: number; isLoading: boolean; error: string | null }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Auto-scroll when messages change
  useEffect(() => {
    const bottom = bottomRef.current;
    if (isNearBottomRef.current && bottom && typeof bottom.scrollIntoView === "function") {
      // Instant scroll while streaming to avoid jitter; smooth for discrete events.
      bottom.scrollIntoView({ behavior: deps.isLoading ? "instant" : "smooth" });
    }
  }, [deps.messagesLength, deps.isLoading, deps.error]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distFromBottom < 80;
    setShowScrollBtn(distFromBottom > 200);
  }, []);

  const scrollToBottom = useCallback(() => {
    isNearBottomRef.current = true;
    const bottom = bottomRef.current;
    if (bottom && typeof bottom.scrollIntoView === "function") {
      bottom.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return {
    scrollContainerRef,
    bottomRef,
    showScrollBtn,
    handleScroll,
    scrollToBottom,
  };
}
