import { InstanceNameSchema } from "../../shared/contracts";

const RECENT_KEY = "agent-starter:recent-instances";

// The URL is the source of truth so an instance can be shared or opened in a second tab.
export function readInstance(): string {
	const fromUrl = new URLSearchParams(location.search).get("instance");
	const parsed = InstanceNameSchema.safeParse(fromUrl);
	return parsed.success ? parsed.data : "default";
}

export function writeInstance(name: string) {
	const url = new URL(location.href);
	url.searchParams.set("instance", name);
	history.replaceState(null, "", url);
	rememberInstance(name);
}

export function recentInstances(): string[] {
	try {
		const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
		return Array.isArray(raw) ? raw.filter((n) => InstanceNameSchema.safeParse(n).success) : [];
	} catch {
		return [];
	}
}

function rememberInstance(name: string) {
	const next = [name, ...recentInstances().filter((n) => n !== name)].slice(0, 8);
	localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function newInstanceName() {
	return `chat-${crypto.randomUUID().slice(0, 8)}`;
}
