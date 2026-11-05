import { ChevronsUpDown, type LucideIcon } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Select({
	options,
	icon: Icon,
	className,
	...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
	options: ReadonlyArray<{ value: string; label: string }>;
	icon?: LucideIcon;
}) {
	return (
		<span className={cn("relative inline-flex items-center", className)}>
			{Icon && <Icon className="pointer-events-none absolute left-2.5 size-3.5 text-ink-muted" />}
			<select
				className={cn(
					"h-8 w-full appearance-none rounded-lg border border-line bg-surface-raised/60 pr-7 text-xs font-medium transition-colors hover:border-line-strong hover:bg-surface-raised disabled:opacity-50",
					Icon ? "pl-7.5" : "pl-2.5",
				)}
				{...props}
			>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
			<ChevronsUpDown className="pointer-events-none absolute right-2 size-3.5 text-ink-faint" />
		</span>
	);
}
