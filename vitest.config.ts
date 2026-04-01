import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules/**",
      ".git/**",
      ".next/**",
      "coverage/**",
      "out/**",
      "build/**",
      "dist/**",
      ".worktrees/**",
      ".superpowers/**",
      "**/.worktrees/**",
      "**/.superpowers/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(root),
      "motion/react": path.resolve(root, "test/mocks/motion-react.tsx"),
    },
  },
});
