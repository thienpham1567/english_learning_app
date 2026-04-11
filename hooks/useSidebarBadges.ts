"use client";

import { useCallback, useEffect, useState } from "react";

interface SidebarBadges {
  flashcardsDue: number;
  dailyChallengeCompleted: boolean;
}

export function useSidebarBadges() {
  const [badges, setBadges] = useState<SidebarBadges | null>(null);

  const fetchBadges = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) return;
      const data = await res.json();
      setBadges({
        flashcardsDue: data.flashcardsDue ?? 0,
        dailyChallengeCompleted: data.dailyChallenge?.completed ?? false,
      });
    } catch {
      // Silently fail — badges are non-critical
    }
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  return badges;
}
