import { MessageType } from "agents/chat";
import { WebSocketChatTransport } from "agents/chat/transport";
import { AgentClient } from "agents/client";
import { readUIMessageStream, type UIMessage } from "ai";
import { AGENT_CLASS } from "../../src/shared/contracts";

// Drives the deployed or locally running app over the same SDK WebSocket
// protocol and chat transport the React hooks use. No browser required.
export const BASE_URL = new URL(process.env.E2E_BASE_URL ?? "http://localhost:5173");

export async function connect(name: string) {
	const client = new AgentClient({
		agent: AGENT_CLASS,
		name,
		host: BASE_URL.host,
		protocol: BASE_URL.protocol === "https:" ? "wss" : "ws",
	});
	// Track transcript broadcasts so tests can observe cross-client sync.
	let broadcast: UIMessage[] | undefined;
	client.addEventListener("message", (event: MessageEvent) => {
		if (typeof event.data !== "string") return;
		const frame = JSON.parse(event.data) as { type?: string; messages?: UIMessage[] };
		if (frame.type === MessageType.CF_AGENT_CHAT_MESSAGES && frame.messages)
			broadcast = frame.messages;
	});
	await client.ready;
	return { client, broadcast: () => broadcast };
}

// The same endpoint useAgentChat uses to load the persisted transcript on mount.
export async function getMessages(name: string): Promise<UIMessage[]> {
	const res = await fetch(new URL(`/agents/assistant/${name}/get-messages`, BASE_URL));
	if (!res.ok) throw new Error(`get-messages failed: ${res.status}`);
	return (await res.json()) as UIMessage[];
}

export async function chat(client: AgentClient, text: string, prior: UIMessage[] = []) {
	const transport = new WebSocketChatTransport({ agent: client });
	const user: UIMessage = {
		id: crypto.randomUUID(),
		role: "user",
		parts: [{ type: "text", text }],
	};
	const stream = await transport.sendMessages({
		chatId: client.name,
		messages: [...prior, user],
		abortSignal: undefined,
		trigger: "submit-message",
	});
	let assistant: UIMessage | undefined;
	let updates = 0;
	for await (const message of readUIMessageStream({ stream })) {
		assistant = message;
		updates++;
	}
	return { assistant, updates };
}

export const textOf = (message: UIMessage | undefined) =>
	message?.parts.flatMap((p) => (p.type === "text" ? [p.text] : [])).join("") ?? "";

export async function waitFor<T>(fn: () => T | undefined, timeoutMs = 15_000): Promise<T> {
	const deadline = Date.now() + timeoutMs;
	for (;;) {
		const value = fn();
		if (value !== undefined) return value;
		if (Date.now() > deadline) throw new Error("waitFor timed out");
		await new Promise((r) => setTimeout(r, 100));
	}
}
