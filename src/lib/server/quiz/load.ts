import picomatch from 'picomatch';
import { parseQuizFile, QuizParseError } from './parse';
import { renderSwift, renderTokens } from './render';
import type { CodeFile, Quiz, QuizSummary } from '$lib/quiz/types';

const FILENAME_RE = /^(\d+)-([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\.md$/i;

export function parseFilename(path: string): { id: number; slug: string; base: string } {
	const file = path.replace(/^.*\//, '');
	const m = file.match(FILENAME_RE);
	if (!m) {
		throw new Error(
			`[swift-quiz] ${file}: filename must be \`NNN-slug.md\` (numeric id, kebab-case slug)`
		);
	}
	return { id: parseInt(m[1], 10), slug: m[2], base: `${m[1]}-${m[2]}` };
}

const mdFiles = import.meta.glob('/src/lib/quizzes/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const swiftFiles = import.meta.glob('/src/lib/quizzes/**/*.swift', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const SWIFT_DIR_RE = /^\/src\/lib\/quizzes\/([^/]+)\/(.+\.swift)$/;

type SwiftSource = { name: string; relPath: string; source: string };

function groupSwiftByFolder(): Map<string, SwiftSource[]> {
	const map = new Map<string, SwiftSource[]>();
	for (const [path, source] of Object.entries(swiftFiles)) {
		const m = path.match(SWIFT_DIR_RE);
		if (!m) continue;
		const [, folder, relPath] = m;
		const name = relPath.replace(/^.*\//, '');
		if (!map.has(folder)) map.set(folder, []);
		map.get(folder)!.push({ name, relPath, source });
	}
	for (const files of map.values()) {
		files.sort((a, b) => a.relPath.localeCompare(b.relPath));
	}
	return map;
}

function filterByGlobs(
	files: SwiftSource[],
	patterns: string[],
	quizFile: string
): SwiftSource[] {
	let isMatch: (s: string) => boolean;
	try {
		isMatch = picomatch(patterns, { dot: true });
	} catch (err) {
		throw new QuizParseError(
			quizFile,
			`invalid glob pattern in \`files\`: ${(err as Error).message}`
		);
	}
	return files.filter((f) => isMatch(f.relPath));
}

let cache: { list: Quiz[]; byId: Map<number, Quiz> } | null = null;

async function build(): Promise<{ list: Quiz[]; byId: Map<number, Quiz> }> {
	const list: Quiz[] = [];
	const seen = new Map<number, string>();
	const swiftByFolder = groupSwiftByFolder();

	for (const [path, raw] of Object.entries(mdFiles)) {
		const { id, slug, base } = parseFilename(path);
		const existing = seen.get(id);
		if (existing) {
			throw new QuizParseError(path, `duplicate quiz id ${id} (also used by ${existing})`);
		}
		seen.set(id, path);

		const allSwift = swiftByFolder.get(base);
		if (!allSwift || allSwift.length === 0) {
			throw new QuizParseError(
				path,
				`expected at least one Swift file in /src/lib/quizzes/${base}/`
			);
		}

		const { data, hintTokens, explanationTokens } = parseQuizFile(raw, path);

		const selectors = data.files;
		const swiftSources = selectors ? filterByGlobs(allSwift, selectors, path) : allSwift;
		if (swiftSources.length === 0) {
			throw new QuizParseError(
				path,
				`\`files\` selector matched no Swift files in /src/lib/quizzes/${base}/`
			);
		}

		const [codeFiles, hintHtml, explanationHtml] = await Promise.all([
			Promise.all(
				swiftSources.map(
					async ({ name, source }): Promise<CodeFile> => ({
						name,
						source,
						html: await renderSwift(source)
					})
				)
			),
			hintTokens ? renderTokens(hintTokens) : Promise.resolve<string | null>(null),
			renderTokens(explanationTokens)
		]);

		list.push({
			...data,
			id,
			slug,
			codeFiles,
			hintHtml,
			explanationHtml
		});
	}

	list.sort((a, b) => a.id - b.id);
	const byId = new Map(list.map((q) => [q.id, q]));
	return { list, byId };
}

export async function loadQuizzes(): Promise<Quiz[]> {
	if (!cache) cache = await build();
	return cache.list;
}

export async function loadQuiz(id: number): Promise<Quiz | undefined> {
	if (!cache) cache = await build();
	return cache.byId.get(id);
}

export async function loadQuizSummaries(): Promise<QuizSummary[]> {
	const list = await loadQuizzes();
	return list.map(({ id, slug, title, difficulty, topics }) => ({
		id,
		slug,
		title,
		difficulty,
		topics
	}));
}
