import { Box, Boxes, Database, MessagesSquare, Plug, Radio } from "lucide-react";
import type { AssistantView, Capabilities } from "../../hooks/useAssistant";
import { cn } from "../../lib/cn";

export function InstanceCard({ assistant }: { assistant: AssistantView }) {
	const live = assistant.connection === "connected";
	return (
		<div className="relative overflow-hidden rounded-2xl border border-line bg-surface-raised p-3.5">
			<div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-accent/15 blur-2xl" />
			<div className="flex items-center gap-2.5">
				<span className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-accent to-accent-2 text-accent-ink shadow-md shadow-accent/30">
					<Box className="size-4.5" />
				</span>
				<div className="min-w-0">
					<p className="text-[10.5px] font-medium tracking-wider text-ink-faint uppercase">
						Durable Object
					</p>
					<p className="truncate font-mono text-sm font-medium">{assistant.instance}</p>
				</div>
			</div>
			<div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
				<Stat
					icon={Radio}
					label="Socket"
					value={live ? "live" : assistant.connection}
					tone={live ? "text-success" : "text-warning"}
				/>
				<Stat icon={MessagesSquare} label="Messages" value={assistant.chat.messages.length} />
				<Stat icon={Database} label="Storage" value="SQLite" />
			</div>
			<Extensions capabilities={assistant.records.capabilities} />
			<p className="mt-2.5 text-[11px] leading-4 text-ink-faint">
				A name routes to one durable actor. It is identity, not authorization.
			</p>
		</div>
	);
}

// Reported by the server from its actual bindings and MCP connection, not from client config.
function Extensions({ capabilities }: { capabilities: Capabilities | null }) {
	if (!capabilities) return null;
	const { mcp, dynamicWorkers } = capabilities;
	const mcpText =
		mcp.state === "connected"
			? `${mcp.server} · ${mcp.tools.length} tool`
			: mcp.state === "unavailable"
				? `unavailable: ${mcp.reason}`
				: "off";
	return (
		<div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
			<Flag
				icon={Boxes}
				label="Dynamic Workers"
				on={dynamicWorkers}
				text={dynamicWorkers ? "on" : "off"}
			/>
			<Flag
				icon={Plug}
				label="MCP"
				on={mcp.state === "connected"}
				warn={mcp.state === "unavailable"}
				text={mcpText}
			/>
		</div>
	);
}

function Flag({
	icon: Icon,
	label,
	on,
	warn,
	text,
}: {
	icon: typeof Box;
	label: string;
	on: boolean;
	warn?: boolean;
	text: string;
}) {
	return (
		<div
			className="min-w-0 rounded-lg border border-line bg-surface-sunken/60 px-2 py-1.5"
			title={text}
		>
			<p className="flex items-center gap-1 text-ink-faint">
				<Icon className="size-3" />
				{label}
			</p>
			<p
				className={cn(
					"mt-0.5 truncate font-mono font-medium",
					on ? "text-success" : warn ? "text-warning" : "text-ink-muted",
				)}
			>
				{text}
			</p>
		</div>
	);
}

function Stat({
	icon: Icon,
	label,
	value,
	tone,
}: {
	icon: typeof Box;
	label: string;
	value: string | number;
	tone?: string;
}) {
	return (
		<div className="rounded-lg border border-line bg-surface-sunken/60 px-2 py-1.5">
			<p className="flex items-center gap-1 text-ink-faint">
				<Icon className="size-3" />
				{label}
			</p>
			<p className={cn("mt-0.5 font-mono font-medium tabular-nums", tone)}>{value}</p>
		</div>
	);
}
