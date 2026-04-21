"use client";

import { useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api-client";

const HEARTBEAT_INTERVAL = 30_000; // 30s

/**
 * useReadingSession (Story 19.4.3, AC5)
 *
 * Tracks a reading session for a passage. Sends heartbeat every 30s while
 * visible, and on visibility change. Auto-finishes when scroll ≥ 90%.
 */
export function useReadingSession(passageId: string | undefined) {
  const scrollPctRef = useRef(0);
  const clickCountRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const finishedRef = useRef(false);

  // ── Heartbeat ──
  const sendHeartbeat = useCallback(async () => {
    if (!passageId || finishedRef.current) return;
    try {
      const res = await api.post<{ sessionId: string }>("/reading/session/heartbeat", {
        passageId,
        scrollPct: scrollPctRef.current,
        clickCount: clickCountRef.current,
      });
      sessionIdRef.current = res.sessionId;

      // Auto-complete if scrolled ≥ 90% (AC2)
      if (scrollPctRef.current >= 90 && !finishedRef.current) {
        finishedRef.current = true;
        await api.post("/reading/session/finish", {
          passageId,
          scrollPct: scrollPctRef.current,
          clickCount: clickCountRef.current,
        });
      }
    } catch {
      // Silently ignore heartbeat failures
    }
  }, [passageId]);

  // ── Manual finish ──
  const finish = useCallback(async () => {
    if (!passageId || finishedRef.current) return;
    finishedRef.current = true;
    try {
      await api.post("/reading/session/finish", {
        passageId,
        scrollPct: scrollPctRef.current,
        clickCount: clickCountRef.current,
      });
    } catch {
      // ignore
    }
  }, [passageId]);

  // ── Track scroll position ──
  useEffect(() => {
    if (!passageId) return;

    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight > 0) {
        scrollPctRef.current = Math.round((scrollTop / scrollHeight) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [passageId]);

  // ── Track word clicks ──
  const trackClick = useCallback(() => {
    clickCountRef.current++;
  }, []);

  // ── Heartbeat interval + visibility change ──
  useEffect(() => {
    if (!passageId) return;

    // Initial heartbeat
    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      // Final heartbeat on unmount
      sendHeartbeat();
    };
  }, [passageId, sendHeartbeat]);

  return { finish, trackClick, isFinished: finishedRef.current };
}
