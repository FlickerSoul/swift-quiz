import { Marked, type Tokens } from 'marked';
import { createHighlighter, type Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: ['github-light', 'github-dark'],
			langs: ['swift']
		});
	}
	return highlighterPromise;
}

type CodeWithRendered = Tokens.Code & { rendered?: string };

const marked = new Marked({
	renderer: {
		code(token: Tokens.Code) {
			const rendered = (token as CodeWithRendered).rendered;
			return rendered ?? false;
		}
	}
});

async function highlightCodeBlocks(tokens: Tokens.Generic[]): Promise<void> {
	const hl = await getHighlighter();
	const walk = (toks: Tokens.Generic[]) => {
		for (const t of toks) {
			if (t.type === 'code') {
				const code = t as CodeWithRendered;
				if ((code.lang || '').trim() === 'swift') {
					code.rendered = hl.codeToHtml(code.text, {
						lang: 'swift',
						themes: { light: 'github-light', dark: 'github-dark' },
						defaultColor: false
					});
				}
			}
			const generic = t as Tokens.Generic & { tokens?: Tokens.Generic[] };
			if (Array.isArray(generic.tokens)) walk(generic.tokens);
		}
	};
	walk(tokens);
}

export async function renderTokens(tokens: Tokens.Generic[]): Promise<string> {
	await highlightCodeBlocks(tokens);
	return marked.parser(tokens as Parameters<typeof marked.parser>[0]);
}

export async function renderSwift(source: string): Promise<string> {
	const hl = await getHighlighter();
	return hl.codeToHtml(source, {
		lang: 'swift',
		themes: { light: 'github-light', dark: 'github-dark' },
		defaultColor: false
	});
}
