import {
	AlarmClock,
	Boxes,
	Brain,
	ListChecks,
	type LucideIcon,
	NotebookPen,
	Plug,
	Wrench,
} from "lucide-react";

// Presentation only. Unknown tools still render with a generic icon and their real name.
const meta: Record<string, { icon: LucideIcon; label: string }> = {
	saveNote: { icon: NotebookPen, label: "Save note" },
	listNotes: { icon: ListChecks, label: "List notes" },
	scheduleReminder: { icon: AlarmClock, label: "Schedule reminder" },
	listReminders: { icon: ListChecks, label: "List reminders" },
	set_context: { icon: Brain, label: "Update memory" },
	analyzeNotes: { icon: Boxes, label: "Analyze notes (isolated)" },
};

export const toolMeta = (name: string) =>
	meta[name] ??
	(name.startsWith("tool_")
		? { icon: Plug, label: `MCP: ${name}` }
		: { icon: Wrench, label: name });
