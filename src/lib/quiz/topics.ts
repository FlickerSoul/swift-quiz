// Allowed topic tags. Add new ones here — the build will reject any topic in a
// quiz frontmatter that isn't listed below. Must contain at least one entry
// (the frontmatter validator uses zod's `z.enum`, which requires a non-empty
// list).
export const TOPICS = [
	'concurrency',
	'conditional-conformance',
	'dictionaries',
	'dispatch',
	'dynamic-member-lookup',
	'exclusivity',
	'existentials',
	'functions',
	'generics',
	'inheritance',
	'macros',
	'operator-precedence',
	'optionals',
	'overload-resolution',
	'ownership',
	'protocols',
	'tuples',
	'typed-throws'
] as const;

export type Topic = (typeof TOPICS)[number];

export const TOPIC_SET: ReadonlySet<string> = new Set(TOPICS);

export function isTopic(value: string): value is Topic {
	return TOPIC_SET.has(value);
}
