import type { LucideIcon } from "lucide-react";
import { type KeyboardEvent, useId } from "react";
import { cn } from "../../lib/cn";

export type TabItem<T extends string> = { id: T; label: string; icon: LucideIcon; count?: number };

/**
 * Only the active tab shows its label, so four tabs with counts always fit
 * the inspector width. Inactive tabs keep their label as an accessible name.
 */
export function Tabs<T extends string>({
	items,
	value,
	onChange,
}: {
	items: ReadonlyArray<TabItem<T>>;
	value: T;
	onChange: (id: T) => void;
}) {
	const base = useId();
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
		const i = items.findIndex((t) => t.id === value);
		const next = items[(i + (e.key === "ArrowRight" ? 1 : items.length - 1)) % items.length];
		if (next) onChange(next.id);
	};
	return (
		<div
			role="tablist"
			tabIndex={-1}
			onKeyDown={onKeyDown}
			className="flex w-full min-w-0 gap-1 overflow-hidden rounded-xl border border-line bg-surface-sunken/70 p-1"
		>
			{items.map(({ id, label, icon: Icon, count }) => {
				const active = id === value;
				return (
					<button
						key={id}
						id={`${base}-${id}`}
						type="button"
						role="tab"
						aria-selected={active}
						aria-label={count ? `${label} (${count})` : label}
						tabIndex={active ? 0 : -1}
						onClick={() => onChange(id)}
						title={label}
						className={cn(
							"flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-200",
							active
								? "flex-[2_1_0%] bg-surface-raised text-ink shadow-sm ring-1 ring-line"
								: "flex-[1_1_0%] text-ink-muted hover:text-ink",
						)}
					>
						<Icon className={cn("size-3.5 shrink-0", active && "text-accent")} />
						{active && <span className="truncate">{label}</span>}
						{count !== undefined && count > 0 && (
							<span className="shrink-0 rounded-full bg-accent/15 px-1.5 text-[10px] leading-4 font-semibold text-accent tabular-nums">
								{count}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
