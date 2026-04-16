import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: ["__tests__/**/*.test.ts"],
		env: {
			// Integration tests need DATABASE_URL; loaded from root .env.local
			// when running locally via `DATABASE_URL=... pnpm test:run`
		},
	},
});
