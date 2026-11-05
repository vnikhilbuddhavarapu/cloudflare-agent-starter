import { type AppState, DEFAULT_MODEL, type ResponseStyle } from "../shared/contracts";

export const initialState: AppState = { model: DEFAULT_MODEL, responseStyle: "concise" };

/**
 * Server authority: clients never write state directly. They call narrow
 * @callable methods, which validate their single argument and then call
 * setState as "server". Every write, from any source, must still parse.
 *
 * EXERCISE CP01: reject client-originated writes and validate every other
 * write. See docs/checkpoints/cp01-state.md.
 */
export function assertValidStateChange(_next: unknown, _source: "server" | "client"): void {}

/**
 * Fixed, server-owned prompt text for each response style. Never interpolate
 * client input into the prompt.
 *
 * EXERCISE CP01: return distinct instruction text per style.
 */
export function styleInstruction(_style: ResponseStyle): string {
	return "";
}
