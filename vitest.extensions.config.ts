import { cloudflareTest } from "@cloudflare/vitest-plugin";
import agents from "agents/vite";
import { defineConfig } from "vitest/config";

// Optional extensions only: uses the "extensions" wrangler environment (Worker Loader).
export default defineConfig({
	plugins: [
		agents(),
		cloudflareTest({
			wrangler: { configPath: "./wrangler.jsonc", environment: "extensions" },
			remoteBindings: false,
			miniflare: { bindings: { AI_GATEWAY_ID: "test-gateway" } },
		}),
	],
	test: {
		include: ["tests/extensions/**/*.test.ts"],
	},
});
