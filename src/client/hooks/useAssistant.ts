import { useAgentChat } from "@cloudflare/think/react";
import { useAgent } from "agents/react";
import { useCallback, useEffect, useState } from "react";
import type { Assistant } from "../../agent/assistant";
import {
	AGENT_CLASS,
	type AppState,
	type MemoryView,
	type ModelId,
	type Note,
	RECORDS_CHANGED,
	type Reminder,
	type ResponseStyle,
} from "../../shared/contracts";

export type Connection = "connecting" | "connected" | "disconnected";

export type Capabilities = Awaited<ReturnType<Assistant["getCapabilities"]>>;

export type Records = {
	notes: Note[];
	reminders: Reminder[];
	memory: MemoryView | null;
	capabilities: Capabilities | null;
};

const emptyRecords: Records = { notes: [], reminders: [], memory: null, capabilities: null };

/**
 * Mount under a component keyed by instance so all local state resets on switch.
 * One instance = one Durable Object. This hook binds the SDK's connection,
 * synchronized state, chat stream, and durable records for that instance.
 * Everything rendered comes from the server; nothing here is invented client-side.
 */
export function useAssistant(instance: string) {
	const [connection, setConnection] = useState<Connection>("connecting");
	const [state, setState] = useState<AppState | undefined>();
	const [records, setRecords] = useState<Records>(emptyRecords);
	const [actionError, setActionError] = useState<string | null>(null);

	const agent = useAgent<Assistant, AppState>({
		agent: AGENT_CLASS,
		name: instance,
		onOpen: () => setConnection("connected"),
		onClose: () => setConnection("disconnected"),
		onStateUpdate: (next) => setState(next),
		onMessage: (event: MessageEvent) => {
			if (typeof event.data !== "string" || !event.data.includes(RECORDS_CHANGED)) return;
			if (JSON.parse(event.data).type === RECORDS_CHANGED) void refresh();
		},
	});

	const chat = useAgentChat({ agent });

	const refresh = useCallback(async () => {
		try {
			const [notes, reminders, memory, capabilities] = await Promise.all([
				agent.stub.listNotes(),
				agent.stub.listReminders(),
				agent.stub.getMemory(),
				agent.stub.getCapabilities(),
			]);
			setRecords({ notes, reminders, memory, capabilities });
		} catch (error) {
			setActionError(error instanceof Error ? error.message : String(error));
		}
	}, [agent]);

	useEffect(() => {
		if (connection === "connected") void refresh();
	}, [connection, refresh]);

	const run = useCallback(async (action: () => Promise<unknown>) => {
		setActionError(null);
		try {
			await action();
		} catch (error) {
			setActionError(error instanceof Error ? error.message : String(error));
		}
	}, []);

	return {
		instance,
		connection,
		state,
		records,
		chat,
		actionError,
		dismissError: () => setActionError(null),
		actions: {
			setResponseStyle: (style: ResponseStyle) => run(() => agent.stub.setResponseStyle(style)),
			setModel: (model: ModelId) => run(() => agent.stub.setModel(model)),
			clearMemory: () => run(() => agent.stub.clearMemory()),
			cancelReminder: (id: string) => run(() => agent.stub.cancelReminder(id)),
			clearHistory: () => chat.clearHistory(),
		},
	};
}

export type AssistantView = ReturnType<typeof useAssistant>;
