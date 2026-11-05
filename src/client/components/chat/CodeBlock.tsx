import { Check, Copy, Terminal } from "lucide-react";
import { type ReactNode, useState } from "react";
import { cn } from "../../lib/cn";

export function CodeBlock({ language, code }: { language?: string; code: string }) {
	const [copied, setCopied] = useState(false);
	const copy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};
	return (
		<div className="group overflow-hidden rounded-xl border border-line bg-surface-sunken shadow-sm">
			<div className="flex items-center gap-2 border-b border-line bg-surface-raised/50 px-3 py-1.5 text-[11px] text-ink-muted">
				<span className="flex gap-1">
					<span className="size-2 rounded-full bg-danger/50" />
					<span className="size-2 rounded-full bg-warning/50" />
					<span className="size-2 rounded-full bg-success/50" />
				</span>
				<Terminal className="ml-1 size-3" />
				<span className="font-mono">{language ?? "text"}</span>
				<button
					type="button"
					onClick={copy}
					aria-label={copied ? "Copied" : "Copy code"}
					className={cn(
						"ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-all hover:bg-surface-sunken hover:text-ink",
						copied && "text-success",
					)}
				>
					{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
					{copied ? "Copied" : "Copy"}
				</button>
			</div>
			<pre className="overflow-x-auto p-3.5 font-mono text-[0.8125rem] leading-6">
				<code>{code}</code>
			</pre>
		</div>
	);
}

export const textContent = (node: ReactNode): string =>
	typeof node === "string" || typeof node === "number"
		? String(node)
		: Array.isArray(node)
			? node.map(textContent).join("")
			: node && typeof node === "object" && "props" in node
				? textContent((node.props as { children?: ReactNode }).children)
				: "";
