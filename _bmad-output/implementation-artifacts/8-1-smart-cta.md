---
storyId: "8.1"
title: "Smart CTA 'Bài Hôm Nay'"
epic: 8
sprint: 7
status: ready
points: 3
priority: P0
---

# Story 8.1: Smart CTA "Bài Hôm Nay"

## User Story

As a learner,
I want one prominent button that starts my most important activity,
So that I don't waste time deciding what to do.

## Acceptance Criteria

1. A large gradient CTA button appears prominently above the "Kế hoạch hôm nay" section on the dashboard
2. The CTA selects the highest-priority undone activity:
   - **Priority 1**: Flashcards due > 0 → "📚 Ôn {N} flashcard đang đến hạn" → `/flashcards`
   - **Priority 2**: Daily challenge not done → "🔥 Thử thách hôm nay" → `/daily-challenge`
   - **Priority 3**: Default → "💬 Chat với gia sư AI" → `/english-chatbot`
3. The priority logic is computed from existing dashboard API fields (no new endpoint needed — uses `flashcardsDue` and `dailyChallenge.completed` already in the response)
4. The CTA has a shimmer animation gradient to draw attention
5. Below the CTA, the existing today's plan checklist continues to show remaining activities
6. For new users (`isNewUser === true`), the existing EmptyStateCard takes priority — CTA is NOT shown
7. CTA shimmer animation respects `prefers-reduced-motion` (static gradient fallback)

## Technical Notes

### Files to modify:
- `app/(app)/home/page.tsx` — Add SmartCTA component between GreetingCard and TodaysPlan
- `app/globals.css` — Add `@keyframes shimmer` animation

### SmartCTA Logic (client-side, no API changes):
```typescript
function getSuggestedActivity(data: DashboardData): {
  label: string;
  href: string;
  emoji: string;
} {
  if (data.flashcardsDue > 0) {
    return {
      label: `Ôn ${data.flashcardsDue} flashcard đang đến hạn`,
      href: "/flashcards",
      emoji: "📚",
    };
  }
  if (!data.dailyChallenge.completed) {
    return {
      label: "Thử thách hôm nay",
      href: "/daily-challenge",
      emoji: "🔥",
    };
  }
  return {
    label: "Chat với gia sư AI",
    href: "/english-chatbot",
    emoji: "💬",
  };
}
```

### CTA Design:
- Full width gradient button (accent → secondary)
- Large text (16-18px, bold)
- Shimmer overlay animation (subtle light sweep left-to-right)
- Arrow icon on right side (→)
- `border-radius: var(--radius-xl)`
- Shadow: `0 4px 16px color-mix(in srgb, var(--accent) 25%, transparent)`
- On hover: scale 1.01, shadow increases
- On click: navigates via `router.push()`

### Shimmer CSS:
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .cta-shimmer::after { animation: none; }
}
```

## Dependencies
- None — uses existing dashboard API response data

## Out of Scope
- Writing practice "last activity" check (simplified to 3 priorities)
- Server-side `suggestedActivity` field in API response
