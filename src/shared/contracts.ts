import { z } from "zod";

// Browser-safe contracts only: no bindings, secrets, or server implementations.

export const AGENT_CLASS = "Assistant";

export const MODELS = [
	{ id: "@cf/deepseek-ai/deepseek-v4.1-flash-1017", label: "DeepSeek V4.1 Flash" },
	{ id: "@cf/zai-org/glm-5.3-flash", label: "GLM 5.3 Flash" },
	{ id: "@cf/qwen/qwen3.8-27b", label: "Qwen 3.8 27B" },
	{ id: "@cf/google/gemma-4-26b-a4b-it", label: "Gemma 4 26B" },
	{ id: "@cf/moonshotai/kimi-k2.6", label: "Kimi K2.6" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];
export const DEFAULT_MODEL: ModelId = MODELS[0].id;
export const ModelIdSchema = z.enum(MODELS.map((m) => m.id) as [ModelId, ...ModelId[]]);

// Instance names select a Durable Object. They are identifiers, not credentials.
export const InstanceNameSchema = z
	.string()
	.regex(/^[a-z0-9][a-z0-9-]{0,47}$/, "Use 1-48 lowercase letters, digits, or dashes.");

export const RESPONSE_STYLES = ["concise", "detailed"] as const;
export const ResponseStyleSchema = z.enum(RESPONSE_STYLES);
export type ResponseStyle = z.infer<typeof ResponseStyleSchema>;

// Synchronized application state. Small, validated, and safe to broadcast.
export const AppStateSchema = z
	.object({
		model: ModelIdSchema,
		responseStyle: ResponseStyleSchema,
	})
	.strict();
export type AppState = z.infer<typeof AppStateSchema>;

export const LIMITS = {
	noteTitle: 80,
	noteBody: 2_000,
	notesListed: 50,
	memoryTokens: 1_000,
	reminderMessage: 200,
	reminderMinSeconds: 10,
	reminderMaxSeconds: 7 * 24 * 60 * 60,
	maxSteps: 6,
} as const;

export const NoteSchema = z.object({
	id: z.string(),
	title: z.string(),
	body: z.string(),
	createdAt: z.string(),
});
export type Note = z.infer<typeof NoteSchema>;

export const ReminderStatusSchema = z.enum(["pending", "completed", "cancelled"]);
export const ReminderSchema = z.object({
	id: z.string(),
	message: z.string(),
	dueAt: z.string(),
	status: ReminderStatusSchema,
	completedAt: z.string().nullable(),
});
export type Reminder = z.infer<typeof ReminderSchema>;

export type MemoryView = { content: string; tokens: number; maxTokens: number | null };

// Custom broadcast telling clients to re-read durable records over RPC.
export const RECORDS_CHANGED = "records-changed";
