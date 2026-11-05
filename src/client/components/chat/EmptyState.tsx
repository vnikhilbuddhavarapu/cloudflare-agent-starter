import {
	AlarmClock,
	Brain,
	Database,
	type LucideIcon,
	NotebookPen,
	Radio,
	Sparkles,
	Zap,
} from "lucide-react";

const suggestions: { icon: LucideIcon; title: string; text: string; tint: string }[] = [
	{
		icon: Zap,
		title: "Stream",
		text: "Explain Durable Objects in two sentences",
		tint: "text-accent bg-accent/10 ring-accent/20",
	},
	{
		icon: Brain,
		title: "Memory",
		text: "Remember that I prefer TypeScript examples",
		tint: "text-violet bg-violet/10 ring-violet/20",
	},
	{
		icon: NotebookPen,
		title: "Tool",
		text: "Save a note titled Webinar: try the inspector",
		tint: "text-info bg-info/10 ring-info/20",
	},
	{
		icon: AlarmClock,
		title: "Schedule",
		text: "Remind me to stretch in 30 seconds",
		tint: "text-success bg-success/10 ring-success/20",
	},
];

const primitives: { icon: LucideIcon; label: string }[] = [
	{ icon: Database, label: "SQLite Durable Object" },
	{ icon: Radio, label: "WebSocket sync" },
	{ icon: Sparkles, label: "Think + AI Gateway" },
];

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
	return (
		<div className="mx-auto flex max-w-2xl animate-fade-in flex-col items-center px-4 pt-[10vh] pb-8 text-center">
			<div className="relative mb-6">
				<div className="absolute inset-0 rounded-3xl bg-accent/30 blur-2xl" />
				<div className="relative flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-accent to-accent-2 text-accent-ink shadow-lg shadow-accent/30">
					<Sparkles className="size-7" />
				</div>
			</div>
			<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
				Build a <span className="text-gradient">durable</span> agent
			</h1>
			<p className="mt-3 max-w-md text-[0.9375rem] leading-7 text-ink-muted">
				Conversation, state, memory, notes, and reminders all live in this instance's Durable
				Object. Close the tab; it keeps going.
			</p>
			<div className="mt-5 flex flex-wrap justify-center gap-2">
				{primitives.map(({ icon: Icon, label }) => (
					<span
						key={label}
						className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised/70 px-2.5 py-1 font-mono text-[11px] text-ink-muted"
					>
						<Icon className="size-3" />
						{label}
					</span>
				))}
			</div>
			<div className="mt-10 grid w-full gap-2.5 sm:grid-cols-2">
				{suggestions.map(({ icon: Icon, title, text, tint }, i) => (
					<button
						key={text}
						type="button"
						onClick={() => onPick(text)}
						style={{ animationDelay: `${80 + i * 60}ms` }}
						className="group flex animate-rise-in items-start gap-3 rounded-2xl border border-line bg-surface-raised/70 p-3.5 text-left backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg hover:shadow-black/5"
					>
						<span
							className={`flex size-8 shrink-0 items-center justify-center rounded-xl ring-1 ${tint}`}
						>
							<Icon className="size-4" />
						</span>
						<span className="min-w-0">
							<span className="block font-mono text-[10.5px] tracking-wider text-ink-faint uppercase">
								{title}
							</span>
							<span className="mt-0.5 block text-sm leading-5">{text}</span>
						</span>
					</button>
				))}
			</div>
		</div>
	);
}
