import "@testing-library/jest-dom/vitest";

// Ant Design's Tabs uses ResizeObserver which jsdom doesn't provide
globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
