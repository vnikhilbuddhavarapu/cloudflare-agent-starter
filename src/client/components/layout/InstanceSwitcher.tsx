import { Hash } from "lucide-react";
import { useState } from "react";
import { InstanceNameSchema } from "../../../shared/contracts";
import { recentInstances } from "../../lib/instance";

export function InstanceSwitcher({
	current,
	onSwitch,
}: {
	current: string;
	onSwitch: (name: string) => void;
}) {
	const [draft, setDraft] = useState(current);
	const [error, setError] = useState<string | null>(null);
	const recent = recentInstances();

	const commit = () => {
		const parsed = InstanceNameSchema.safeParse(draft.trim());
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "Invalid name");
			return;
		}
		setError(null);
		if (parsed.data !== current) onSwitch(parsed.data);
	};

	return (
		<div className="relative">
			<label htmlFor="instance" className="sr-only">
				Instance name
			</label>
			<Hash className="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-ink-faint" />
			<input
				id="instance"
				list="recent-instances"
				value={draft}
				spellCheck={false}
				autoComplete="off"
				onChange={(e) => setDraft(e.target.value.toLowerCase())}
				onBlur={commit}
				onKeyDown={(e) => e.key === "Enter" && commit()}
				aria-invalid={error !== null}
				aria-describedby={error ? "instance-error" : undefined}
				title="Instance name: each name is a separate Durable Object"
				className="h-8 w-36 rounded-lg border border-line bg-surface-raised/60 pr-2.5 pl-7 font-mono text-xs transition-colors hover:border-line-strong focus:border-accent/50 aria-invalid:border-danger sm:w-52"
			/>
			<datalist id="recent-instances">
				{recent.map((n) => (
					<option key={n} value={n} />
				))}
			</datalist>
			{error && (
				<p
					id="instance-error"
					role="alert"
					className="glass absolute top-10 left-0 z-10 w-64 animate-rise-in rounded-lg px-2.5 py-1.5 text-xs text-danger shadow-lg"
				>
					{error}
				</p>
			)}
		</div>
	);
}
