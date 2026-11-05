// The Agent's tagged-template SQL surface over its Durable Object SQLite database.
export type Sql = <T = Record<string, string | number | boolean | null>>(
	strings: TemplateStringsArray,
	...values: (string | number | boolean | null)[]
) => T[];

export const iso = (ms: number) => new Date(ms).toISOString();
