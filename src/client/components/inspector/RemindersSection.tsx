import { AlarmClock, BellOff, BellRing, CircleCheck, Clock, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Reminder } from "../../../shared/contracts";
import type { AssistantView } from "../../hooks/useAssistant";
import { cn } from "../../lib/cn";
import { Badge, type Tone } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Empty, Section } from "../ui/Section";

const view: Record<Reminder["status"], { tone: Tone; icon: typeof Clock }> = {
	pending: { tone: "accent", icon: Clock },
	completed: { tone: "success", icon: CircleCheck },
	cancelled: { tone: "neutral", icon: BellOff },
};

export function RemindersSection({ assistant }: { assistant: AssistantView }) {
	const { reminders } = assistant.records;
	const now = useNow(reminders.some((r) => r.status === "pending"));
	const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	return (
		<Section
			title="Reminders"
			icon={BellRing}
			source="this.schedule() · onReminderDue"
			hint={`Durable schedules complete even with every tab closed. Stored in UTC, shown in ${zone}.`}
		>
			{reminders.length === 0 ? (
				<Empty icon={AlarmClock}>No reminders. Try "remind me to stretch in 30 seconds".</Empty>
			) : (
				<ul className="space-y-2">
					{reminders.map((r) => {
						const { tone, icon: Icon } = view[r.status];
						const due = Date.parse(r.dueAt);
						return (
							<li
								key={`${r.id}-${r.status}`}
								className={cn(
									"flex animate-rise-in items-start gap-2.5 rounded-xl border border-line bg-surface-sunken/50 p-3",
									r.status === "completed" && "animate-flash",
								)}
							>
								<Icon
									className={cn(
										"mt-0.5 size-4 shrink-0",
										r.status === "pending" && "text-accent",
										r.status === "completed" && "text-success",
										r.status === "cancelled" && "text-ink-faint",
									)}
								/>
								<div className="min-w-0 flex-1">
									<p
										className={cn(
											"text-sm",
											r.status === "cancelled" && "text-ink-muted line-through",
										)}
									>
										{r.message}
									</p>
									<p className="mt-1 font-mono text-[10.5px] text-ink-faint">
										{r.status === "completed" && r.completedAt
											? `done ${new Date(r.completedAt).toLocaleTimeString()}`
											: r.status === "pending"
												? `due ${relative(due - now)} · ${new Date(due).toLocaleTimeString()}`
												: `was due ${new Date(due).toLocaleTimeString()}`}
									</p>
								</div>
								<Badge tone={tone}>{r.status}</Badge>
								{r.status === "pending" && (
									<Button
										variant="ghost"
										size="sm"
										className="-mr-1 px-1"
										aria-label={`Cancel reminder ${r.message}`}
										onClick={() => assistant.actions.cancelReminder(r.id)}
									>
										<X className="size-3.5" />
									</Button>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</Section>
	);
}

function useNow(active: boolean) {
	const [now, setNow] = useState(Date.now());
	useEffect(() => {
		if (!active) return;
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, [active]);
	return now;
}

function relative(ms: number) {
	if (ms <= 0) return "now";
	const s = Math.round(ms / 1000);
	if (s < 60) return `in ${s}s`;
	const m = Math.round(s / 60);
	return m < 60 ? `in ${m}m` : `in ${Math.round(m / 60)}h`;
}
