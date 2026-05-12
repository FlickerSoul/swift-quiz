import matter from 'gray-matter';
import { marked, type Tokens } from 'marked';
import { QuizFrontmatterSchema } from '$lib/quiz/schema';
import type { QuizFrontmatter } from '$lib/quiz/schema';

export type ParseResult = {
	data: QuizFrontmatter;
	hintTokens: Tokens.Generic[] | null;
	explanationTokens: Tokens.Generic[];
};

export class QuizParseError extends Error {
	constructor(
		public readonly file: string,
		message: string,
		options?: { cause?: unknown }
	) {
		super(`[swift-quiz] ${file}: ${message}`, options);
		this.name = 'QuizParseError';
	}
}

const KNOWN_SECTIONS = new Set(['hint', 'explanation']);

function extractH2Sections(body: string): Record<string, Tokens.Generic[]> {
	const tokens = marked.lexer(body);
	const sections: Record<string, Tokens.Generic[]> = {};
	let current: { name: string; tokens: Tokens.Generic[] } | null = null;

	for (const tok of tokens) {
		if (tok.type === 'heading' && (tok as Tokens.Heading).depth === 2) {
			const heading = tok as Tokens.Heading;
			const name = heading.text.trim().toLowerCase();
			if (!KNOWN_SECTIONS.has(name)) {
				throw new Error(
					`unknown H2 section "${heading.text}" — only "Hint" and "Explanation" are recognised`
				);
			}
			if (sections[name]) {
				throw new Error(`duplicate "## ${heading.text}" section`);
			}
			current = { name, tokens: [] };
			sections[name] = current.tokens;
			continue;
		}
		if (tok.type === 'space') continue;
		if (!current) {
			throw new Error(
				'content found before any `## Hint` or `## Explanation` heading — quiz body may only contain those two H2 sections'
			);
		}
		current.tokens.push(tok);
	}

	return sections;
}

export function parseQuizFile(raw: string, file = '<quiz>'): ParseResult {
	let frontmatter: unknown;
	let body: string;
	try {
		const parsed = matter(raw);
		if (!parsed.matter) {
			throw new Error('missing YAML frontmatter — expected the file to start with a `---` block');
		}
		frontmatter = parsed.data;
		body = parsed.content;
	} catch (err) {
		throw new QuizParseError(file, (err as Error).message, { cause: err });
	}

	const result = QuizFrontmatterSchema.safeParse(frontmatter);
	if (!result.success) {
		const summary = result.error.issues
			.map((i) => `  • ${i.path.join('.') || '<root>'}: ${i.message}`)
			.join('\n');
		throw new QuizParseError(file, `frontmatter failed validation:\n${summary}`);
	}

	let sections: Record<string, Tokens.Generic[]>;
	try {
		sections = extractH2Sections(body);
	} catch (err) {
		throw new QuizParseError(file, (err as Error).message);
	}

	if (!sections.explanation) {
		throw new QuizParseError(file, 'missing required `## Explanation` section');
	}

	return {
		data: result.data,
		hintTokens: sections.hint ?? null,
		explanationTokens: sections.explanation
	};
}
