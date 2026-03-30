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

// Polyfill window.matchMedia for ThesaurusSheet
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
