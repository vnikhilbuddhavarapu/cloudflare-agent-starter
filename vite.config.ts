import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import agents from "agents/vite";
import { defineConfig } from "vite";

export default defineConfig({
	// agents() transforms TC39 decorators such as @callable(), which Oxc cannot yet compile.
	plugins: [agents(), react(), cloudflare(), tailwindcss()],
});
