import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { ChevronRight, CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/cn";
import { Badge, type Tone } from "../ui/Badge";
import { toolMeta } from "./toolMeta";

type ToolPart = Extract<UIMessage["parts"][number], { toolCallId: string }>;

const status: Record<string, { label: string; tone: Tone }> = {
	"input-streaming": { label: "preparing", tone: "neutral" },
	"input-available": { label: "running", tone: "accent" },
	"approval-requested": { label: "awaiting approval", tone: "warning" },
	"output-available": { label: "done", tone: "success" },
	"output-error": { label: "failed", tone: "danger" },
	"output-denied": { label: "denied", tone: "danger" },
};

export const isToolPart = (part: UIMessage["parts"][number]): part is ToolPart =>
	isToolUIPart(part);

/** Disclosure card showing the actual tool input and result from the protocol stream. */
export function ToolCard({ part }: { part: ToolPart }) {
	const [open, setOpen] = useState(false);
	const name = isToolUIPart(part) ? getToolName(part) : "tool";
	const { icon: Icon, label } = toolMeta(name);
	const s = status[part.state] ?? { label: part.state, tone: "neutral" as Tone };
	const running = part.state === "input-available" || part.state === "input-streaming";
	const StateIcon =
		part.state === "output-available"
			? CircleCheck
			: part.state === "output-error"
				? CircleAlert
				: null;

	return (
		<div
			className={cn(
				"animate-rise-in overflow-hidden rounded-xl border bg-surface-raised/80 transition-colors",
				running ? "border-accent/40" : "border-line",
			)}
		>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-sunken/60"
			>
				<span
					className={cn(
						"flex size-6 items-center justify-center rounded-md ring-1",
						s.tone === "danger"
							? "bg-danger/10 text-danger ring-danger/20"
							: "bg-accent/10 text-accent ring-accent/20",
					)}
				>
					{running ? (
						<LoaderCircle className="size-3.5 animate-spin" />
					) : (
						<Icon className="size-3.5" />
					)}
				</span>
				<span className="font-medium">{label}</span>
				<code className="hidden font-mono text-[11px] text-ink-faint sm:inline">{name}()</code>
				<span className="ml-auto flex items-center gap-2">
					{StateIcon && (
						<StateIcon
							className={cn("size-3.5", s.tone === "success" ? "text-success" : "text-danger")}
						/>
					)}
					<Badge tone={s.tone}>{s.label}</Badge>
					<ChevronRight
						className={cn(
							"size-4 text-ink-faint transition-transform duration-200",
							open && "rotate-90",
						)}
					/>
				</span>
			</button>
			<div
				className={cn(
					"grid transition-[grid-template-rows] duration-300 ease-out",
					open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
			>
				<div className="overflow-hidden">
					<div className="grid gap-2 border-t border-line px-3 py-3 sm:grid-cols-2">
						<Payload label="Input" value={part.input} />
						{part.state === "output-available" && <Payload label="Result" value={part.output} />}
						{part.state === "output-error" && (
							<p className="text-xs text-danger sm:col-span-2">{part.errorText}</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function Payload({ label, value }: { label: string; value: unknown }) {
	return (
		<div className="min-w-0">
			<p className="mb-1 font-mono text-[10.5px] tracking-wider text-ink-faint uppercase">
				{label}
			</p>
			<pre className="max-h-64 overflow-auto rounded-lg border border-line bg-surface-sunken p-2.5 font-mono text-[11px] leading-5">
				{JSON.stringify(value ?? null, null, 2)}
			</pre>
		</div>
	);
}
