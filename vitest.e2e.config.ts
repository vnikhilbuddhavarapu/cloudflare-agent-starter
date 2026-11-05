import { defineConfig } from "vitest/config";

// Live layer, run separately from `npm test`: needs a running app
// (E2E_BASE_URL, default http://localhost:5173) and consumes model credits.
export default defineConfig({
	test: {
		include: ["tests/e2e/**/*.e2e.test.ts"],
		environment: "node",
		testTimeout: 120_000,
		fileParallelism: false,
		sequence: { concurrent: false },
	},
});
