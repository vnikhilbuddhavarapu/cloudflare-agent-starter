import { CircleAlert, X } from "lucide-react";
import { useState } from "react";
import { ChatView } from "./components/chat/ChatView";
import { Inspector } from "./components/inspector/Inspector";
import { Header } from "./components/layout/Header";
import { useAssistant } from "./hooks/useAssistant";
import { cn } from "./lib/cn";
import { newInstanceName, readInstance, writeInstance } from "./lib/instance";

export function App() {
	const [instance, setInstance] = useState(readInstance);
	const switchTo = (name: string) => {
		writeInstance(name);
		setInstance(name);
	};
	// Keyed so connection, chat, and records state start fresh for each instance.
	return <Workspace key={instance} instance={instance} onSwitch={switchTo} />;
}

function Workspace({ instance, onSwitch }: { instance: string; onSwitch: (name: string) => void }) {
	const assistant = useAssistant(instance);
	const [inspectorOpen, setInspectorOpen] = useState(
		() => window.matchMedia("(min-width: 1024px)").matches,
	);

	return (
		<div className="relative flex h-dvh flex-col overflow-hidden">
			<div aria-hidden className="app-backdrop pointer-events-none absolute inset-0" />
			<Header
				assistant={assistant}
				onSwitch={onSwitch}
				onNew={() => onSwitch(newInstanceName())}
				inspectorOpen={inspectorOpen}
				onToggleInspector={() => setInspectorOpen((v) => !v)}
			/>
			{assistant.actionError && (
				<div className="relative z-20 px-3 pt-2">
					<div
						role="alert"
						className="flex animate-rise-in items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger backdrop-blur"
					>
						<CircleAlert className="size-4 shrink-0" />
						<span className="flex-1">{assistant.actionError}</span>
						<button type="button" onClick={assistant.dismissError} aria-label="Dismiss error">
							<X className="size-4" />
						</button>
					</div>
				</div>
			)}
			<div className="relative flex min-h-0 flex-1">
				<main className="min-w-0 flex-1">
					<ChatView assistant={assistant} />
				</main>
				<aside
					aria-label="Inspector"
					className={cn(
						"transition-[width,opacity,transform] duration-300 ease-out max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-20",
						inspectorOpen
							? "w-88 translate-x-0 opacity-100 xl:w-[24rem]"
							: "w-0 translate-x-4 overflow-hidden opacity-0",
					)}
				>
					{inspectorOpen && (
						<div className="h-full max-lg:bg-surface/95 max-lg:shadow-2xl max-lg:backdrop-blur-xl">
							<Inspector assistant={assistant} />
						</div>
					)}
				</aside>
			</div>
		</div>
	);
}
