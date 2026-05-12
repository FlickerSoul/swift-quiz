import type { Attempt, History, QuizRecord, SolutionSource } from './types';

const KEY = 'swift-quiz/history';

/**
 * Current on-disk schema version. Bump this whenever the persisted shape
 * changes, then:
 *   1. add a snapshot of the new shape below (e.g. `type V2Data = ...`),
 *   2. point `CurrentData` at it,
 *   3. add a migration to `MIGRATIONS` that converts the previous version's
 *      data into the new one.
 */
const VERSION = 1;

// Per-version snapshots of the persisted data shape. The current version's
// alias should always equal `History` so the runtime path stays type-safe.
type V1Data = History;
type CurrentData = V1Data;

type Migration<From, To> = {
	from: number;
	to: number;
	run: (prev: From) => To;
};

/**
 * One entry per OLD-version → NEXT-version step, in ascending order. The
 * chain runner applies them sequentially from the stored version up to
 * `VERSION`. Each step is strongly typed at the call site; the registry
 * itself stores them heterogeneously, which is unavoidable.
 *
 * Example (when bumping to V2):
 *   { from: 1, to: 2, run: (prev: V1Data): V2Data => ({ ...prev, newField: 0 }) }
 */
const MIGRATIONS: ReadonlyArray<Migration<unknown, unknown>> = [];

type Envelope = { version: number; data: unknown };

function migrate(envelope: Envelope): CurrentData | null {
	let { version, data } = envelope;
	if (typeof version !== 'number' || !Number.isFinite(version)) return null;
	if (version > VERSION) return null;
	while (version < VERSION) {
		const step = MIGRATIONS.find((m) => m.from === version);
		if (!step) return null;
		data = step.run(data);
		version = step.to;
	}
	return isCurrent(data) ? data : null;
}

function isCurrent(value: unknown): value is CurrentData {
	if (!value || typeof value !== 'object') return false;
	return Object.values(value as Record<string, unknown>).every((v) => {
		if (!v || typeof v !== 'object') return false;
		const r = v as QuizRecord;
		return (
			Array.isArray(r.attempts) &&
			typeof r.solveCount === 'number' &&
			(r.solvedBy === null ||
				r.solvedBy === 'userSolved' ||
				r.solvedBy === 'answerRevealed')
		);
	});
}

function emptyRecord(): QuizRecord {
	return { attempts: [], firstSolvedAt: null, solveCount: 0, solvedBy: null };
}

function readStorage(): History {
	if (typeof window === 'undefined') return {};
	try {
		const raw = window.localStorage.getItem(KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as Partial<Envelope>;
		if (!parsed || typeof parsed !== 'object' || parsed.version === undefined) return {};
		return migrate(parsed as Envelope) ?? {};
	} catch {
		return {};
	}
}

function writeStorage(value: History): void {
	if (typeof window === 'undefined') return;
	try {
		const payload: Envelope = { version: VERSION, data: value };
		window.localStorage.setItem(KEY, JSON.stringify(payload));
	} catch {
		// Quota exceeded, private browsing, etc. — keep going in-memory.
	}
}

const state = $state<{ data: History }>({ data: {} });

// Eagerly hydrate from localStorage on the client. The prerender step runs in
// Node where `window` is undefined, so state stays empty there — that matches
// what the prerendered HTML can render (components gate history-derived UI
// behind a `mounted` flag to avoid hydration mismatches).
if (typeof window !== 'undefined') {
	state.data = readStorage();
}

function persist(): void {
	writeStorage(state.data);
}

export function getHistory(): History {
	return state.data;
}

export function getRecord(id: number): QuizRecord | undefined {
	return state.data[id];
}

export function recordAttempt(id: number, attempt: Attempt): void {
	const existing = state.data[id] ?? emptyRecord();
	// Once solved or revealed, additional attempts are not recorded.
	if (existing.solvedBy !== null) return;
	const next: QuizRecord = {
		attempts: [...existing.attempts, attempt],
		firstSolvedAt: existing.firstSolvedAt ?? (attempt.correct ? attempt.at : null),
		solveCount: existing.solveCount + (attempt.correct ? 1 : 0),
		solvedBy: attempt.correct ? 'userSolved' : null
	};
	state.data = { ...state.data, [id]: next };
	persist();
}

export function revealAnswer(id: number): void {
	const existing = state.data[id] ?? emptyRecord();
	if (existing.solvedBy !== null) return;
	const next: QuizRecord = {
		...existing,
		solvedBy: 'answerRevealed'
	};
	state.data = { ...state.data, [id]: next };
	persist();
}

export function isSolved(id: number): boolean {
	return state.data[id]?.solvedBy !== undefined && state.data[id]?.solvedBy !== null;
}

export function solutionSource(id: number): SolutionSource | null {
	return state.data[id]?.solvedBy ?? null;
}

export function clearQuiz(id: number): void {
	if (!(id in state.data)) return;
	const next = { ...state.data };
	delete next[id];
	state.data = next;
	persist();
}

export function clearAll(): void {
	state.data = {};
	persist();
}

/** Test-only: reset the in-memory store and clear the persisted key. */
export function __resetForTests(): void {
	state.data = {};
	if (typeof window !== 'undefined') {
		try {
			window.localStorage.removeItem(KEY);
		} catch {
			// ignore
		}
	}
}

/** Test-only: re-read from localStorage. */
export function __reloadForTests(): void {
	if (typeof window !== 'undefined') {
		state.data = readStorage();
	}
}

export const HISTORY_STORAGE_KEY = KEY;
export const HISTORY_STORAGE_VERSION = VERSION;
