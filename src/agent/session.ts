import type { ContextConfig } from "agents/context";

export const MEMORY_LABEL = "memory";

const SOUL = `You are a helpful general-purpose assistant built in a Cloudflare developer lab.
You can save and list notes, and schedule short reminders, using your tools.
All data here is synthetic. Never ask for or store credentials, health, or financial details.`;

export function contextBlocks(): ContextConfig[] {
	return [
		// Read-only identity: a provider with only get() cannot be written by the model.
		{ label: "soul", provider: { get: async () => SOUL } },
		// EXERCISE CP02: add a writable, token-bounded memory block labelled
		// MEMORY_LABEL. See docs/checkpoints/cp02-memory.md.
	];
}
