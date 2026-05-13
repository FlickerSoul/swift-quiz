import picomatch from 'picomatch';
import { parseQuizFile, QuizParseError } from './parse';
import { renderSwift, renderTokens } from './render';
import { loadCache, saveCache } from './cache';
import { pickVerifyMode, verifyAll } from './verify';
import { SWIFT_VERSIONS } from '$lib/quiz/config';
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

function filterByGlobs(files: SwiftSource[], patterns: string[], quizFile: string): SwiftSource[] {
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

function pad3(n: number): string {
	return String(n).padStart(3, '0');
}

function quizFilePaths(q: Quiz): { md: string; dir: string } {
	const base = `${pad3(q.id)}-${q.slug}`;
	return {
		md: `src/lib/quizzes/${base}.md`,
		dir: `src/lib/quizzes/${base}/`
	};
}

function describeDeclared(q: Quiz): string {
	if (q.mode === 'choice') return `multiple choice (option ${q.correct})`;
	const a = q.answer;
	if (a.kind === 'prints') return `prints ${JSON.stringify(a.output)}`;
	if (a.kind === 'compile-error') return `compile-error`;
	if (a.kind === 'trap') return `runtime trap`;
	return 'non-deterministic';
}

function abortWithVerificationError(
	failures: { q: Quiz; results: import('$lib/quiz/types').VerificationStatus[] }[]
): never {
	const HR = '─'.repeat(72);
	const blocks = failures.map(({ q, results }) => {
		const paths = quizFilePaths(q);
		const header = `  ✗  #${pad3(q.id)} ${q.title}`;
		const meta = [
			`     declared answer: ${describeDeclared(q)}`,
			`     quiz file:       ${paths.md}`,
			`     swift sources:   ${paths.dir}`
		].join('\n');

		const versionBlocks = results
			.map((r) => {
				if (r.kind === 'verified') {
					return `     ✓ Swift ${r.version}: verified`;
				}
				if (r.kind === 'skipped') {
					return `     – Swift ${r.version || '(unresolved)'}: skipped (${r.reason})`;
				}
				const indented = r.details
					.split('\n')
					.map((line) => '       │ ' + line)
					.join('\n');
				return `     ✗ Swift ${r.version}:\n${indented}`;
			})
			.join('\n');

		return `${header}\n${meta}\n\n${versionBlocks}`;
	});

	const summary =
		failures.length === 1
			? `Quiz verification failed: 1 quiz mismatched its declared answer on every configured Swift toolchain.`
			: `Quiz verification failed: ${failures.length} quizzes mismatched their declared answer on every configured Swift toolchain.`;

	const tips = [
		`Each block below shows the declared answer, the path to the quiz files, and what swiftc actually did per toolchain.`,
		`Fix by either correcting \`answer:\` in the .md file or updating the Swift source so it matches the declared answer.`,
		`To skip verification temporarily: SWIFT_QUIZ_SKIP_VERIFY=1 bun run build`,
		`To force re-verify (ignore cache):  SWIFT_QUIZ_FORCE_VERIFY=1 bun run build`
	].join('\n  ');

	const message = [
		'',
		HR,
		`  [swift-quiz] ${summary}`,
		HR,
		'',
		blocks.join(`\n\n${HR}\n\n`),
		'',
		HR,
		`  ${tips}`,
		HR,
		''
	].join('\n');

	// Write directly to stderr and exit so SvelteKit's worker doesn't wrap
	// the message with Node's uncaught-exception formatter (which adds
	// `[…]`, `process.nextTick`, and a `Node.js vX` footer that obscure the
	// actual authoring error).
	process.stderr.write(message + '\n');
	process.exit(1);
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
			explanationHtml,
			verification: []
		});
	}

	list.sort((a, b) => a.id - b.id);

	const mode = pickVerifyMode();
	const cache = await loadCache();
	const verification = await verifyAll(list, {
		mode,
		cache,
		versions: SWIFT_VERSIONS,
		forceRefresh: process.env.SWIFT_QUIZ_FORCE_VERIFY === '1'
	});
	if (mode === 'compile') await saveCache(cache);

	const fullyFailed = list
		.map((q) => ({ q, results: verification.get(q.id) ?? [] }))
		.filter(({ results }) => results.length > 0 && results.every((r) => r.kind === 'failed'));
	if (fullyFailed.length > 0) {
		abortWithVerificationError(fullyFailed);
	}

	for (const quiz of list) {
		quiz.verification = verification.get(quiz.id) ?? [];
	}

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
