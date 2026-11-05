import { dynamicTools } from "../extensions/dynamic";
import type { NotesStore } from "../store/notes";
import type { RemindersStore } from "../store/reminders";
import { noteTools } from "./notes";
import { type ReminderScheduler, reminderTools } from "./reminders";

type Deps = {
	notes: NotesStore;
	reminders: RemindersStore;
	schedule: ReminderScheduler;
	onRecordsChanged: () => void;
	/** Present only in the optional "extensions" environment. */
	loader?: WorkerLoader;
};

// Explicit composition: adding a capability means adding one line here.
export function createTools(deps: Deps) {
	return {
		...noteTools(deps.notes, deps.onRecordsChanged),
		...reminderTools(deps.reminders, deps.schedule, deps.onRecordsChanged),
		...(deps.loader ? dynamicTools(deps.loader, deps.notes) : {}),
	};
}

// Session tool Think adds when a writable context block exists.
export const SESSION_TOOLS = ["set_context"] as const;
