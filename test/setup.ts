import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Expose vitest's `vi` as `jest` so that @testing-library/dom's
// jestFakeTimersAreEnabled() works correctly and waitFor() can advance
// fake timers when vi.useFakeTimers() is active.
(globalThis as Record<string, unknown>).jest = vi;

// Ant Design's Tabs uses ResizeObserver which jsdom doesn't provide
globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
