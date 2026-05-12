import type { Attempt, History, QuizRecord } from './types';

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
	return Object.values(value as Record<string, unknown>).every(
		(v) =>
			!!v &&
			typeof v === 'object' &&
			Array.isArray((v as QuizRecord).attempts) &&
			typeof (v as QuizRecord).solveCount === 'number'
	);
}

function emptyRecord(): QuizRecord {
	return { attempts: [], firstSolvedAt: null, solveCount: 0 };
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

const state = $state<{ data: History; loaded: boolean }>({ data: {}, loaded: false });

function ensureLoaded(): void {
	if (state.loaded || typeof window === 'undefined') return;
	state.data = readStorage();
	state.loaded = true;
}

function persist(): void {
	writeStorage(state.data);
}

export function getHistory(): History {
	ensureLoaded();
	return state.data;
}

export function getRecord(id: number): QuizRecord | undefined {
	ensureLoaded();
	return state.data[id];
}

export function recordAttempt(id: number, attempt: Attempt): void {
	ensureLoaded();
	const existing = state.data[id] ?? emptyRecord();
	const next: QuizRecord = {
		attempts: [...existing.attempts, attempt],
		firstSolvedAt: existing.firstSolvedAt ?? (attempt.correct ? attempt.at : null),
		solveCount: existing.solveCount + (attempt.correct ? 1 : 0)
	};
	state.data = { ...state.data, [id]: next };
	persist();
}

export function clearQuiz(id: number): void {
	ensureLoaded();
	if (!(id in state.data)) return;
	const next = { ...state.data };
	delete next[id];
	state.data = next;
	persist();
}

export function clearAll(): void {
	ensureLoaded();
	state.data = {};
	persist();
}

/** Test-only: reset the in-memory store and clear the persisted key. */
export function __resetForTests(): void {
	state.data = {};
	state.loaded = false;
	if (typeof window !== 'undefined') {
		try {
			window.localStorage.removeItem(KEY);
		} catch {
			// ignore
		}
	}
}

export const HISTORY_STORAGE_KEY = KEY;
export const HISTORY_STORAGE_VERSION = VERSION;
