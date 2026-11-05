import { cloudflareTest } from "@cloudflare/vitest-plugin";
import agents from "agents/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		agents(),
		cloudflareTest({
			wrangler: { configPath: "./wrangler.jsonc" },
			// Deterministic tests never call a live model, so no remote session is opened.
			remoteBindings: false,
			miniflare: { bindings: { AI_GATEWAY_ID: "test-gateway" } },
		}),
	],
	test: {
		include: [
			"tests/unit/**/*.test.ts",
			"tests/integration/**/*.test.ts",
			"tests/checkpoints/**/*.test.ts",
		],
	},
});
