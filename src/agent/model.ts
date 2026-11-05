import { createAI } from "agents/models/ai-sdk";
import type { LanguageModel } from "ai";
import { type ModelId, ModelIdSchema } from "../shared/contracts";

export class ModelConfigError extends Error {
	override name = "ModelConfigError";
}

/**
 * The single place where model calls are constructed. Every request goes
 * through the configured AI Gateway; there is deliberately no direct
 * Workers AI fallback, so a misconfiguration fails loudly instead of
 * silently bypassing gateway logging, caching, and limits.
 */
export function createModel(env: Env, modelId: ModelId, instance: string): LanguageModel {
	const gatewayId = env.AI_GATEWAY_ID?.trim();
	if (!gatewayId) {
		throw new ModelConfigError(
			"AI_GATEWAY_ID is not set. Create an AI Gateway and set AI_GATEWAY_ID in wrangler.jsonc (or .dev.vars for local dev).",
		);
	}
	const model = ModelIdSchema.parse(modelId);
	// Metadata lands on the Gateway log entry so a request can be traced back to an instance.
	return createAI({ binding: env.AI, id: gatewayId, metadata: { app: "agent-starter", instance } })(
		model,
	);
}
