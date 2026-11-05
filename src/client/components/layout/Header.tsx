import { Cpu, PanelRightClose, PanelRightOpen, Plus, Sparkles, Trash2 } from "lucide-react";
import { MODELS, type ModelId } from "../../../shared/contracts";
import type { AssistantView } from "../../hooks/useAssistant";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { ConnectionBadge } from "./ConnectionBadge";
import { InstanceSwitcher } from "./InstanceSwitcher";

export function Header({
	assistant,
	onSwitch,
	onNew,
	inspectorOpen,
	onToggleInspector,
}: {
	assistant: AssistantView;
	onSwitch: (name: string) => void;
	onNew: () => void;
	inspectorOpen: boolean;
	onToggleInspector: () => void;
}) {
	const { state, actions, chat } = assistant;
	const PanelIcon = inspectorOpen ? PanelRightClose : PanelRightOpen;
	return (
		<header className="relative z-30 px-3 pt-3">
			<div className="glass flex h-12 items-center gap-2 rounded-2xl px-2 shadow-sm shadow-black/5">
				<div className="flex items-center gap-2 pr-1 pl-1">
					<span className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-accent to-accent-2 text-accent-ink shadow-sm shadow-accent/40">
						<Sparkles className="size-3.5" />
					</span>
					<span className="hidden text-sm font-semibold tracking-tight md:inline">
						Agent<span className="text-ink-faint">/</span>Starter
					</span>
				</div>
				<span className="hidden h-5 w-px bg-line sm:block" />
				<InstanceSwitcher current={assistant.instance} onSwitch={onSwitch} />
				<Button
					variant="ghost"
					size="sm"
					onClick={onNew}
					aria-label="New instance"
					title="New instance"
				>
					<Plus className="size-3.5" />
					<span className="hidden lg:inline">New</span>
				</Button>
				<div className="ml-auto flex items-center gap-1.5">
					<Select
						aria-label="Model"
						icon={Cpu}
						className="hidden w-48 sm:inline-flex"
						value={state?.model ?? ""}
						disabled={!state}
						options={MODELS.map((m) => ({ value: m.id, label: m.label }))}
						onChange={(e) => actions.setModel(e.target.value as ModelId)}
					/>
					<ConnectionBadge connection={assistant.connection} />
					<span className="mx-0.5 hidden h-5 w-px bg-line sm:block" />
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Clear conversation history"
						title="Clear conversation history (memory is kept)"
						disabled={chat.messages.length === 0}
						onClick={actions.clearHistory}
					>
						<Trash2 className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Toggle inspector"
						title="Toggle inspector"
						aria-pressed={inspectorOpen}
						onClick={onToggleInspector}
					>
						<PanelIcon className="size-4" />
					</Button>
				</div>
			</div>
		</header>
	);
}
