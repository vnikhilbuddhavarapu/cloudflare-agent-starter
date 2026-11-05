# CP02: Bounded memory

**Goal:** give the agent a small, durable memory it can write to, separate from
chat history. (10 min)

## The primitive

Think builds the system prompt from **context blocks**. A block with only a
`get()` provider is read-only (the `soul` block is your agent's identity). A
block declared without a provider is writable and stored durably in the
Durable Object's SQLite. When a writable block exists, Think gives the model a
`set_context` tool to update it.

`maxTokens` bounds the block: writes over the budget are rejected.

The system prompt is frozen between turns so the model provider can cache it.
`whenChanged: "remind"` makes memory edits visible on the next turn without
waiting for the prompt to be rebuilt.

In this app, memory is **per agent instance**. It survives refreshes, restarts,
and clearing chat history. It is not authorization: never store secrets there.

|                            | Chat history    | Memory                       | State (CP01)         |
| -------------------------- | --------------- | ---------------------------- | -------------------- |
| Written by                 | every turn      | the model, via `set_context` | your server code     |
| Sent to the model          | recent messages | always, in the prompt        | only what you choose |
| Cleared by "clear history" | yes             | no                           | no                   |

## Your task

In `src/agent/session.ts`, add a second block to `contextBlocks()`:

- `label: MEMORY_LABEL`
- a `description` telling the model what to keep (durable, non-sensitive preferences)
- `maxTokens: LIMITS.memoryTokens`
- `whenChanged: "remind"`

## Verify

```sh
npm run test:cp02
```

Manual:

1. Say "Remember that I prefer metric units." A **Update memory** tool card appears.
2. Inspector, **Memory** tab: the fact and a token budget bar.
3. Clear the conversation (trash icon). Memory is still there.
4. Ask "How far is a marathon?" The answer uses kilometres.
5. Click **Clear** in the Memory tab to wipe it.

A reply that quotes earlier chat is not proof of memory. Step 3 is.

## Common failures

| Symptom                                    | Cause                                                   |
| ------------------------------------------ | ------------------------------------------------------- |
| Memory tab says no block is configured     | The block is missing or the label is not `MEMORY_LABEL` |
| Model never calls `set_context`            | The description is vague; say what to remember and when |
| Memory updates only after clearing history | `whenChanged: "remind"` is missing                      |

## Hints

<details><summary>Hint 1: the idea</summary>

You are declaring data, not writing logic. One object in the array.
</details>

<details><summary>Hint 2: the type</summary>

`ContextConfig` has `label`, `description?`, `maxTokens?`, `provider?`, and
`whenChanged?: "wait" | "remind"`.
</details>

<details><summary>Hint 3: the shape</summary>

```ts
{
	label: MEMORY_LABEL,
	description: "...",
	maxTokens: /* ... */,
	whenChanged: /* ... */,
},
```
</details>

<details><summary>Hint 4: full code</summary>

`src/agent/session.ts`: add `import { LIMITS } from "../shared/contracts";`, then keep the `soul` block and add the memory block after it:

```ts
return [
	{ label: "soul", provider: { get: async () => SOUL } },
	{
		label: MEMORY_LABEL,
		description:
			"Durable, non-sensitive facts and preferences the user wants remembered across conversations, such as name, preferred units, or favourite language. Never store secrets or personal health/financial data.",
		maxTokens: LIMITS.memoryTokens,
		whenChanged: "remind",
	},
];
```
</details>
