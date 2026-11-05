import { BellRing, Brain, NotebookPen, SlidersHorizontal } from "lucide-react";
import { type ReactNode, useState } from "react";
import type { AssistantView } from "../../hooks/useAssistant";
import { type TabItem, Tabs } from "../ui/Tabs";
import { InstanceCard } from "./InstanceSection";
import { MemorySection } from "./MemorySection";
import { NotesSection } from "./NotesSection";
import { RemindersSection } from "./RemindersSection";
import { StateSection } from "./StateSection";

type TabId = "state" | "memory" | "notes" | "reminders";

/**
 * A truthful view of server-side primitives. Each tab reads real SDK state or
 * durable records for this instance; none are simulated. Add a capability by
 * adding one tab entry and one panel.
 */
export function Inspector({ assistant }: { assistant: AssistantView }) {
	const [tab, setTab] = useState<TabId>("state");
	const { records } = assistant;
	const pending = records.reminders.filter((r) => r.status === "pending").length;

	const tabs: ReadonlyArray<TabItem<TabId>> = [
		{ id: "state", label: "State", icon: SlidersHorizontal },
		{ id: "memory", label: "Memory", icon: Brain },
		{ id: "notes", label: "Notes", icon: NotebookPen, count: records.notes.length },
		{ id: "reminders", label: "Reminders", icon: BellRing, count: pending },
	];

	const panels: Record<TabId, ReactNode> = {
		state: <StateSection assistant={assistant} />,
		memory: <MemorySection assistant={assistant} />,
		notes: <NotesSection notes={records.notes} />,
		reminders: <RemindersSection assistant={assistant} />,
	};

	return (
		<div className="flex h-full flex-col gap-3 overflow-hidden p-3">
			<InstanceCard assistant={assistant} />
			<Tabs items={tabs} value={tab} onChange={setTab} />
			<div key={tab} role="tabpanel" className="min-h-0 flex-1 overflow-y-auto pb-2">
				{panels[tab]}
			</div>
		</div>
	);
}
