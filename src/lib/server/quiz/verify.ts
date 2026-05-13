// Compile-time verification: for each eligible quiz × configured Swift
// version, run swiftc (via swiftly) and confirm the runtime behavior matches
// the declared answer. Results are cached on disk by content hash.
//
// Build-time only.

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Quiz, VerificationStatus } from '$lib/quiz/types';
import type { CacheFile } from './cache';
import { cacheKey } from './cache';
import { ensureToolchain, spawn } from './swiftly';

export type VerifyMode = 'compile' | 'cache-only' | 'disabled';

export type VerifyOptions = {
	mode: VerifyMode;
	cache: CacheFile;
	versions: readonly string[];
	forceRefresh: boolean;
};

export function pickVerifyMode(env: Record<string, string | undefined> = process.env): VerifyMode {
	if (env.SWIFT_QUIZ_SKIP_VERIFY === '1') return 'disabled';
	if (env.SWIFT_QUIZ_FORCE_VERIFY === '1') return 'compile';
	if (env.NODE_ENV === 'production') return 'compile';
	return 'cache-only';
}

// Result for one (quiz, spec) pair.
async function verifyOne(
	quiz: Quiz,
	spec: string,
	opts: VerifyOptions
): Promise<VerificationStatus> {
	// Eligibility — these checks don't depend on a toolchain, so handle them
	// before resolving.
	if (quiz.mode !== 'typed') {
		return { kind: 'skipped', version: '', reason: 'choice-mode' };
	}
	if (quiz.answer.kind === 'non-deterministic') {
		return { kind: 'skipped', version: '', reason: 'non-deterministic' };
	}
	if (quiz.codeFiles.length !== 1) {
		return { kind: 'skipped', version: '', reason: 'multi-file' };
	}
	if (opts.mode === 'disabled') {
		return { kind: 'skipped', version: '', reason: 'disabled' };
	}

	const source = quiz.codeFiles[0].source;
	const expectedJson = JSON.stringify(quiz.answer);
	const key = cacheKey({ source, expected: expectedJson, version: spec });

	const cached = opts.cache.entries[key];
	if (cached && !opts.forceRefresh) {
		return cached.result;
	}
	if (opts.mode === 'cache-only') {
		return { kind: 'skipped', version: '', reason: 'no-cache' };
	}

	// Compile mode: resolve toolchain (installs if missing), then run.
	const resolvedVersion = await ensureToolchain(spec);
	const result = await runVerification(quiz, source, resolvedVersion);
	opts.cache.entries[key] = { result, recordedAt: Date.now() };
	return result;
}

function looksLikeTrap(run: RunResult): boolean {
	return (
		run.exitCode !== 0 &&
		(run.signal === 'SIGILL' ||
			run.signal === 'SIGTRAP' ||
			run.signal === 'SIGABRT' ||
			/Fatal error|Swift runtime|exclusivity|Illegal instruction/i.test(run.stderr))
	);
}

function indent(s: string, pad = '    '): string {
	return s
		.split('\n')
		.map((line) => pad + line)
		.join('\n');
}

function quote(s: string): string {
	// Show empty strings explicitly so "expected: , actual: " isn't ambiguous.
	if (s === '') return '<empty>';
	return JSON.stringify(s);
}

async function runVerification(
	quiz: Quiz & { mode: 'typed' },
	source: string,
	version: string
): Promise<VerificationStatus> {
	// Narrow away the cases that verifyOne already filtered out — TS can't
	// see those guards across the function boundary.
	if (quiz.mode !== 'typed' || quiz.answer.kind === 'non-deterministic') {
		return { kind: 'skipped', version, reason: 'non-deterministic' };
	}
	const dir = await mkdtemp(join(tmpdir(), `swift-quiz-${quiz.id}-`));
	try {
		const srcPath = join(dir, 'main.swift');
		const outPath = join(dir, 'main');
		await writeFile(srcPath, source);

		const compile = await spawn('swiftly', [
			'run',
			'swiftc',
			srcPath,
			'-o',
			outPath,
			`+${version}`
		]);

		if (quiz.answer.kind === 'compile-error') {
			if (compile.exitCode !== 0) return { kind: 'verified', version };
			return {
				kind: 'failed',
				version,
				details:
					`declared: compile-error\n` +
					`actual:   swiftc exited 0 — the program compiles.\n\n` +
					`Hint: either the answer should be a different kind (run the binary to see what it does), ` +
					`or the source no longer triggers a diagnostic on this toolchain.`
			};
		}

		if (compile.exitCode !== 0) {
			const declared =
				quiz.answer.kind === 'prints' ? `prints ${JSON.stringify(quiz.answer.output)}` : 'trap';
			return {
				kind: 'failed',
				version,
				details:
					`declared: ${declared}\n` +
					`actual:   swiftc failed to compile (exit ${compile.exitCode}).\n\n` +
					`swiftc stderr:\n${indent(compile.stderr.trim() || '<empty>')}\n\n` +
					`Hint: did you mean \`answer: { kind: compile-error }\`?`
			};
		}

		// Run the compiled binary.
		const run = await runBinary(outPath);

		if (quiz.answer.kind === 'trap') {
			if (looksLikeTrap(run)) return { kind: 'verified', version };
			return {
				kind: 'failed',
				version,
				details:
					`declared: trap\n` +
					`actual:   program exited cleanly (exit ${run.exitCode}).\n` +
					`  stdout: ${quote(run.stdout.trim())}\n\n` +
					`Hint: did you mean \`answer: { kind: prints, output: ${JSON.stringify(
						normalize(run.stdout)
					)} }\`?`
			};
		}

		// kind === 'prints'
		const expected = normalize(quiz.answer.output);
		const actual = normalize(run.stdout);
		if (expected === actual) return { kind: 'verified', version };

		const lines: string[] = [];
		lines.push(`declared: prints ${JSON.stringify(quiz.answer.output)}`);
		lines.push(`expected stdout: ${quote(expected)}`);
		lines.push(`actual:`);
		lines.push(`  stdout: ${quote(actual)}`);
		if (run.stderr.trim()) lines.push(`  stderr:\n${indent(run.stderr.trim(), '          ')}`);
		if (run.signal) lines.push(`  signal: ${run.signal}`);
		lines.push(`  exit:   ${run.exitCode}`);
		if (looksLikeTrap(run)) {
			lines.push('');
			lines.push(
				'Hint: the program appears to have trapped at runtime. Did you mean `answer: { kind: trap }`?'
			);
		} else if (actual === '') {
			lines.push('');
			lines.push(
				'Hint: actual stdout is empty. Did the program produce its output on stderr, or exit before printing?'
			);
		}
		return { kind: 'failed', version, details: lines.join('\n') };
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
}

type RunResult = { stdout: string; stderr: string; exitCode: number; signal: string | null };

async function runBinary(path: string): Promise<RunResult> {
	return spawn(path, []);
}

function normalize(s: string): string {
	return s.replace(/\r\n/g, '\n').replace(/\s+$/g, '');
}

export type QuizVerification = { id: number; results: VerificationStatus[] };

export async function verifyAll(
	quizzes: Quiz[],
	opts: VerifyOptions
): Promise<Map<number, VerificationStatus[]>> {
	const out = new Map<number, VerificationStatus[]>();
	const total = quizzes.length;
	const width = String(total).length;
	// Sequential per-quiz to keep swiftc out of contention; the cached path
	// is fast enough that this doesn't matter for warm builds.
	for (const [index, quiz] of quizzes.entries()) {
		const results: VerificationStatus[] = [];
		for (const spec of opts.versions) {
			const result = await verifyOne(quiz, spec, opts);
			results.push(result);
			logVerification(quiz, result, index + 1, total, width);
		}
		out.set(quiz.id, results);
	}
	return out;
}

function pad3(n: number): string {
	return String(n).padStart(3, '0');
}

function logVerification(
	quiz: Quiz,
	result: VerificationStatus,
	index: number,
	total: number,
	width: number
): void {
	const progress = `[${String(index).padStart(width, ' ')}/${total}]`;
	const tag = `#${pad3(quiz.id)} ${quiz.slug}`;
	let status: string;
	if (result.kind === 'verified') status = `✓ Swift ${result.version}`;
	else if (result.kind === 'failed') status = `✗ Swift ${result.version}`;
	else status = `– skipped (${result.reason})`;
	process.stdout.write(`[swift-quiz] ${progress} ${tag}: ${status}\n`);
}
