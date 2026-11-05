import { evictDurableObject } from "cloudflare:test";
import { env, exports } from "cloudflare:workers";
import type { ContextBlocks } from "agents/context";
import type { ToolSet } from "ai";
import type { Assistant } from "../src/agent/assistant";

let counter = 0;
export const uniqueName = (prefix: string) => `${prefix}-${Date.now()}-${counter++}`;

/**
 * Think initialises Session/context in onStart, which runs on the first routed
 * request. runInDurableObject alone does not trigger it.
 */
export async function startedAgent(prefix: string) {
	const name = uniqueName(prefix);
	await wake(name);
	return env.Assistant.getByName(name);
}

/** Simulate a restart: tear down the in-memory instance, keep storage, then route to it again. */
export async function restart(stub: DurableObjectStub<Assistant>) {
	await evictDurableObject(stub);
	await wake(stub.id.name ?? "");
}

async function wake(name: string) {
	const res = await exports.default.fetch(
		`http://example.com/agents/assistant/${name}/get-messages`,
	);
	await res.body?.cancel();
}

/**
 * Invoke a tool's execute exactly as the AI SDK would, without a model choosing it.
 * Looked up by name so checkpoint tests compile before the tool exists.
 */
export async function runTool<T = unknown>(
	agent: Assistant,
	name: string,
	input: unknown,
	toolCallId: string,
): Promise<T> {
	const tool = (agent.getTools() as ToolSet)[name];
	if (!tool?.execute) throw new Error(`Tool "${name}" is not registered yet.`);
	const out = await tool.execute(input, { toolCallId, messages: [], context: {} });
	if (out !== null && typeof out === "object" && Symbol.asyncIterator in out) {
		throw new Error("Streaming tool results are not used in this app");
	}
	return out as T;
}

// Tests may inspect Think's protected context blocks; application code may not.
export const contextOf = (agent: Assistant) =>
	(agent as unknown as { context: ContextBlocks }).context;
