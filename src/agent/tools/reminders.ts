import { z } from "zod";
import type { RemindersStore } from "../store/reminders";

// EXERCISE CP04: bound these fields using LIMITS from ../../shared/contracts.
// delaySeconds is in seconds, not milliseconds.
export const ScheduleReminderInput = z.object({
	message: z.string(),
	delaySeconds: z.number(),
});

export type ReminderScheduler = (delaySeconds: number, reminderId: string) => Promise<string>;

// EXERCISE CP04: return scheduleReminder and listReminders tools.
// See docs/checkpoints/cp04-reminders.md.
export function reminderTools(
	_reminders: RemindersStore,
	_schedule: ReminderScheduler,
	_onChange: () => void,
	_now: () => number = Date.now,
) {
	return {};
}
