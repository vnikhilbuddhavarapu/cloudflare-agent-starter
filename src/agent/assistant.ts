import { Think, type TurnConfig, type TurnContext } from "@cloudflare/think";
import { callable } from "agents";
import {
	type AppState,
	LIMITS,
	type MemoryView,
	ModelIdSchema,
	RECORDS_CHANGED,
} from "../shared/contracts";
import type { ExtensionEnv } from "./extensions/config";
import { allowedMcpTools, connectMcp, type McpStatus } from "./extensions/mcp";
import { createModel } from "./model";

export type CapabilitiesView = { dynamicWorkers: boolean; mcp: McpStatus };

import { contextBlocks, MEMORY_LABEL } from "./session";
import { assertValidStateChange, initialState, styleInstruction } from "./state";
import { NotesStore } from "./store/notes";
import { RemindersStore } from "./store/reminders";
import { completeDueReminder, type ReminderDuePayload } from "./tasks/reminders";
import { createTools, SESSION_TOOLS } from "./tools";

export class Assistant extends Think<Env, AppState> {
	initialState = initialState;
	maxSteps = LIMITS.maxSteps;

	readonly notes = new NotesStore(this.sql.bind(this));
	readonly reminders = new RemindersStore(this.sql.bind(this));

	// Think assembles the turn's tools before beforeTurn runs, so it must wait for
	// MCP to be ready itself. Bounded so an unreachable server cannot stall chat.
	waitForMcpConnections = this.ext.MCP_SERVER ? { timeout: 8_000 } : false;

	async onStart() {
		if (this.ext.MCP_SERVER) await this.ensureMcp();
	}

	getModel() {
		return createModel(this.env, this.state.model, this.name);
	}

	configureContext() {
		return contextBlocks();
	}

	getTools() {
		return createTools({
			notes: this.notes,
			reminders: this.reminders,
			schedule: async (delaySeconds, reminderId) =>
				(await this.schedule(delaySeconds, "onReminderDue", { reminderId })).id,
			onRecordsChanged: () => this.broadcastRecordsChanged(),
			loader: this.ext.LOADER,
		});
	}

	async beforeTurn(ctx: TurnContext): Promise<TurnConfig> {
		await this.ensureMcp();
		// Think always merges its workspace file tools; keep this assistant's surface to what we teach.
		const allowed = new Set<string>([
			...Object.keys(this.getTools()),
			...SESSION_TOOLS,
			...allowedMcpTools(this.ext.MCP_SERVER),
		]);
		return {
			instructions: `${ctx.system}\n\n${styleInstruction(this.state.responseStyle)}`,
			activeTools: Object.keys(ctx.tools).filter((name) => allowed.has(name)),
		};
	}

	validateStateChange(next: AppState, source: unknown) {
		assertValidStateChange(next, source === "server" ? "server" : "client");
	}

	@callable()
	setResponseStyle(_style: unknown) {
		// EXERCISE CP01: validate the argument and save it. setModel below shows the pattern.
		throw new Error("CP01 is not implemented yet: setResponseStyle.");
	}

	@callable()
	setModel(model: unknown) {
		this.setState({ ...this.state, model: ModelIdSchema.parse(model) });
	}

	@callable()
	getMemory(): MemoryView {
		const block = this.context.getBlock(MEMORY_LABEL);
		return {
			content: block?.content ?? "",
			tokens: block?.tokens ?? 0,
			maxTokens: block?.maxTokens ?? null,
		};
	}

	@callable()
	async clearMemory() {
		if (!this.context.getBlock(MEMORY_LABEL)) {
			throw new Error("No writable memory block is configured for this agent.");
		}
		await this.context.setBlock(MEMORY_LABEL, "");
		this.broadcastRecordsChanged();
	}

	@callable()
	listNotes() {
		return this.notes.list();
	}

	@callable()
	listReminders() {
		return this.reminders.list();
	}

	@callable()
	async cancelReminder(id: unknown) {
		const scheduleId = this.reminders.cancel(String(id));
		if (!scheduleId) return false;
		await this.cancelSchedule(scheduleId);
		this.broadcastRecordsChanged();
		return true;
	}

	// SDK schedule callback: a thin adapter over tasks/reminders.
	async onReminderDue(payload: ReminderDuePayload) {
		// Persist completion before notifying clients so reconnecting users can recover it.
		const reminder = completeDueReminder(this.reminders, payload);
		if (!reminder) return;
		this.broadcastRecordsChanged();
		await this.deliverNotice(`Reminder: ${reminder.message}`);
	}

	@callable()
	async getCapabilities(): Promise<CapabilitiesView> {
		return { dynamicWorkers: Boolean(this.ext.LOADER), mcp: await this.ensureMcp() };
	}

	private get ext() {
		return this.env as Env & ExtensionEnv;
	}

	// Per isolate: the SDK persists MCP connections, this only avoids reconnecting every turn.
	private mcpStatus?: Promise<McpStatus>;
	private ensureMcp() {
		this.mcpStatus ??= connectMcp(this, this.ext.MCP_SERVER);
		return this.mcpStatus;
	}

	afterToolCall() {
		// set_context edits memory outside our tools; refresh inspectors after any tool.
		this.broadcastRecordsChanged();
	}

	private broadcastRecordsChanged() {
		this.broadcast(JSON.stringify({ type: RECORDS_CHANGED }));
	}
}
