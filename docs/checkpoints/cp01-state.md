# CP01: Validated shared settings

**Goal:** add a "response style" setting (concise or detailed) that the server
owns, validates, saves, and syncs to every tab. (8 min)

## The primitive

Every agent instance has a small JSON **state** object. `this.setState()` saves
it to the Durable Object's SQLite and broadcasts it to every connected client.
`validateStateChange(next, source)` runs before every save; throwing rejects
the change.

Clients could call `setState` directly. We do not allow that: the browser calls
a narrow `@callable()` method, the server validates the single argument, and
the server writes state. The UI's model picker already works this way
(`setModel`).

State is not chat history and not memory. It is application data the server
reads, for example to choose prompt text.

## Your task

In `src/agent/state.ts`:

1. `assertValidStateChange`: reject any write whose source is `"client"` (error
   message must contain `server-owned`), and validate every other write with
   `AppStateSchema.parse`.
2. `styleInstruction`: return fixed text for each style. This text is appended
   to the system prompt each turn by `beforeTurn` in `assistant.ts`.

In `src/agent/assistant.ts`:

3. `setResponseStyle`: validate the argument with `ResponseStyleSchema`, then
   `setState` with the new value.

## Verify

```sh
npm run test:cp01
```

Manual:

1. Open the inspector, **State** tab. Click **Detailed**. The JSON updates.
2. Open the same instance in a second tab. Click **Concise** there; the first tab flashes and updates.
3. Refresh. The setting is still there.
4. Ask a question in each style. The answer length changes.
5. Switch instance. That instance still has its own setting.

## Common failures

| Symptom                                | Cause                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------- |
| UI shows "CP01 is not implemented yet" | `setResponseStyle` still throws                                        |
| Setting changes but answers do not     | `styleInstruction` still returns `""`                                  |
| Model picker stops working             | `assertValidStateChange` rejects server writes; only reject `"client"` |

## Hints

<details><summary>Hint 1: the idea</summary>

The callable runs on the server, so its `setState` arrives with source
`"server"`. A client calling `setState` directly arrives with a connection as
the source, which `assistant.ts` maps to `"client"`.
</details>

<details><summary>Hint 2: the APIs</summary>

- `AppStateSchema.parse(value)` throws a `ZodError` on invalid input.
- `ResponseStyleSchema.parse(value)` returns `"concise" | "detailed"` or throws.
- `this.setState({ ...this.state, someField: value })` replaces the whole state object.
</details>

<details><summary>Hint 3: the shape</summary>

```ts
export function assertValidStateChange(next: unknown, source: "server" | "client"): void {
	if (source === "client") throw new Error("... server-owned ...");
	// validate next
}

const STYLE_INSTRUCTIONS: Record<ResponseStyle, string> = {
	concise: "...",
	detailed: "...",
};
```
</details>

<details><summary>Hint 4: full code</summary>

`src/agent/state.ts`: add `AppStateSchema` to the import, then:

```ts
export function assertValidStateChange(next: unknown, source: "server" | "client"): void {
	if (source === "client") {
		throw new Error("State is server-owned. Use the provided actions instead of setState.");
	}
	AppStateSchema.parse(next);
}

const STYLE_INSTRUCTIONS: Record<ResponseStyle, string> = {
	concise: "Answer in at most three short sentences or a short list. Skip preamble.",
	detailed: "Give a thorough, well-structured answer with headings or steps when useful.",
};

export function styleInstruction(style: ResponseStyle): string {
	return `## Response style\n${STYLE_INSTRUCTIONS[style]}`;
}
```

`src/agent/assistant.ts`: add `ResponseStyleSchema` to the `../shared/contracts` import, then:

```ts
@callable()
setResponseStyle(style: unknown) {
	this.setState({ ...this.state, responseStyle: ResponseStyleSchema.parse(style) });
}
```

`setState` replaces the whole object, so keep `...this.state`. Without it, `model` disappears and the validator rejects the write.
</details>
