import {
	AlignLeft,
	ChevronRight,
	Cpu,
	Database,
	MousePointerClick,
	Radio,
	ShieldCheck,
	SlidersHorizontal,
	Zap,
} from "lucide-react";
import { MODELS, RESPONSE_STYLES, type ResponseStyle } from "../../../shared/contracts";
import type { AssistantView } from "../../hooks/useAssistant";
import { cn } from "../../lib/cn";
import { useFlashKey } from "../../lib/useFlash";
import { Section } from "../ui/Section";

const styleIcon: Record<ResponseStyle, typeof Zap> = { concise: Zap, detailed: AlignLeft };

// What happens when a setting changes, in the order the server does it.
const flow = [
	{ icon: MousePointerClick, label: "Click", code: "stub.setResponseStyle()" },
	{ icon: ShieldCheck, label: "Validate", code: "validateStateChange()" },
	{ icon: Database, label: "Persist", code: "setState() → SQLite" },
	{ icon: Radio, label: "Broadcast", code: "every open tab" },
] as const;

export function StateSection({ assistant }: { assistant: AssistantView }) {
	const { state, actions } = assistant;
	const flash = useFlashKey(state);
	const model = MODELS.find((m) => m.id === state?.model);
	return (
		<Section
			title="Shared settings"
			icon={SlidersHorizontal}
			source="Agent state · this.state"
			hint="These settings live in the agent, not the browser. The server checks and saves every change, then pushes it to all tabs. Open this instance in a second tab and click a style to watch it update there."
		>
			<p className="mb-1.5 text-[11px] font-medium text-ink-muted">Response style</p>
			<div
				role="radiogroup"
				aria-label="Response style"
				className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface-sunken/70 p-1"
			>
				{RESPONSE_STYLES.map((style) => {
					const active = state?.responseStyle === style;
					const Icon = styleIcon[style];
					return (
						// biome-ignore lint/a11y/useSemanticElements: segmented control styled as buttons
						<button
							key={style}
							type="button"
							role="radio"
							aria-checked={active}
							disabled={!state}
							onClick={() => actions.setResponseStyle(style)}
							className={cn(
								"flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium capitalize transition-all duration-200",
								active
									? "bg-surface-raised text-ink shadow-sm ring-1 ring-line"
									: "text-ink-muted hover:text-ink",
							)}
						>
							<Icon className={cn("size-3.5", active && "text-accent")} />
							{style}
						</button>
					);
				})}
			</div>
			<div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-surface-sunken/60 px-2.5 py-2 text-xs">
				<Cpu className="size-3.5 text-ink-muted" />
				<span className="text-ink-muted">Model</span>
				<span className="ml-auto truncate font-medium">{model?.label ?? "—"}</span>
			</div>

			<p className="mb-1.5 text-[11px] font-medium text-ink-muted">What a change does</p>
			<ol className="mb-4 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1.5 text-xs">
				{flow.map(({ icon: Icon, label, code }, i) => (
					<li key={label} className="contents">
						<span className="flex items-center gap-1 text-ink-faint">
							<span className="font-mono text-[10px] tabular-nums">{i + 1}</span>
							<Icon className="size-3.5 text-accent" />
						</span>
						<span className="flex min-w-0 items-center gap-1.5">
							<span className="font-medium">{label}</span>
							<ChevronRight className="size-3 shrink-0 text-ink-faint" />
							<code className="truncate font-mono text-[10.5px] text-ink-muted">{code}</code>
						</span>
					</li>
				))}
			</ol>

			<p className="mb-1.5 text-[11px] font-medium text-ink-muted">Current value on the server</p>
			<pre
				key={flash}
				data-testid="app-state"
				className={cn(
					"overflow-x-auto rounded-xl border border-line bg-surface-sunken p-3 font-mono text-[11px] leading-5",
					flash > 0 && "animate-flash",
				)}
			>
				{state ? JSON.stringify(state, null, 2) : "waiting for server…"}
			</pre>
		</Section>
	);
}
