import type { Reminder } from "../../shared/contracts";
import type { RemindersStore } from "../store/reminders";

export type ReminderDuePayload = { reminderId: string };

/**
 * Runs when the durable schedule fires, with or without connected clients.
 * No LLM call: the outcome is recorded deterministically. Returns the
 * completed reminder, or null for a duplicate or cancelled delivery.
 *
 * EXERCISE CP04: mark the reminder completed exactly once.
 */
export function completeDueReminder(
	_reminders: RemindersStore,
	_payload: ReminderDuePayload,
	_now = Date.now(),
): Reminder | null {
	return null;
}
