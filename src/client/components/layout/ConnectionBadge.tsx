import type { Connection } from "../../hooks/useAssistant";
import { cn } from "../../lib/cn";
import { Dot, type Tone } from "../ui/Badge";

const view: Record<Connection, { tone: Tone; label: string }> = {
	connecting: { tone: "warning", label: "connecting" },
	connected: { tone: "success", label: "connected" },
	disconnected: { tone: "danger", label: "reconnecting" },
};

export function ConnectionBadge({ connection }: { connection: Connection }) {
	const { tone, label } = view[connection];
	const connected = connection === "connected";
	return (
		<span
			className={cn(
				"inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-surface-raised/60 font-mono text-[11px]",
				connected ? "w-8 justify-center" : "px-2.5",
			)}
			title={`WebSocket to this instance's Durable Object: ${label}`}
		>
			<Dot tone={tone} pulse={!connected} />
			<span data-testid="connection" className={cn(connected && "sr-only")}>
				{label}
			</span>
		</span>
	);
}
