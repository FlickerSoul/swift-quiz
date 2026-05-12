import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	clearAll,
	clearQuiz,
	getHistory,
	getRecord,
	HISTORY_STORAGE_KEY,
	HISTORY_STORAGE_VERSION,
	recordAttempt,
	__resetForTests
} from './history.svelte';

beforeEach(() => {
	window.localStorage.clear();
	__resetForTests();
});

describe('history store', () => {
	it('starts empty', () => {
		expect(getHistory()).toEqual({});
		expect(getRecord(1)).toBeUndefined();
	});

	it('records an attempt and persists across reload', () => {
		recordAttempt(1, { at: 1_000, correct: false, submitted: 'wrong' });
		expect(getRecord(1)?.attempts).toHaveLength(1);
		expect(getRecord(1)?.solveCount).toBe(0);
		expect(getRecord(1)?.firstSolvedAt).toBeNull();

		// snapshot persisted payload BEFORE resetting in-memory state
		const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
		expect(stored).not.toBeNull();
		__resetForTests();
		window.localStorage.setItem(HISTORY_STORAGE_KEY, stored!);

		expect(getRecord(1)?.attempts).toHaveLength(1);
	});

	it('updates solveCount and firstSolvedAt on correct attempt', () => {
		recordAttempt(2, { at: 1_000, correct: false, submitted: 'x' });
		recordAttempt(2, { at: 2_000, correct: true, submitted: 'y' });
		recordAttempt(2, { at: 3_000, correct: true, submitted: 'y' });

		const rec = getRecord(2)!;
		expect(rec.attempts).toHaveLength(3);
		expect(rec.solveCount).toBe(2);
		expect(rec.firstSolvedAt).toBe(2_000);
	});

	it('clearQuiz removes only that quiz', () => {
		recordAttempt(1, { at: 1, correct: true, submitted: 'a' });
		recordAttempt(2, { at: 2, correct: true, submitted: 'b' });
		clearQuiz(1);
		expect(getRecord(1)).toBeUndefined();
		expect(getRecord(2)).toBeDefined();
	});

	it('clearAll wipes everything', () => {
		recordAttempt(1, { at: 1, correct: true, submitted: 'a' });
		recordAttempt(2, { at: 2, correct: true, submitted: 'b' });
		clearAll();
		expect(getHistory()).toEqual({});
	});

	it('survives localStorage write failures', () => {
		const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('quota');
		});
		expect(() =>
			recordAttempt(1, { at: 1, correct: true, submitted: 'a' })
		).not.toThrow();
		expect(getRecord(1)?.solveCount).toBe(1);
		spy.mockRestore();
	});

	it('ignores stored payloads from unknown versions', () => {
		window.localStorage.setItem(
			HISTORY_STORAGE_KEY,
			JSON.stringify({ version: 999, data: { 1: { attempts: [], firstSolvedAt: null, solveCount: 99 } } })
		);
		expect(getHistory()).toEqual({});
	});

	it('ignores malformed JSON', () => {
		window.localStorage.setItem(HISTORY_STORAGE_KEY, 'not json');
		expect(getHistory()).toEqual({});
	});

	it('reads payloads at the current version', () => {
		window.localStorage.setItem(
			HISTORY_STORAGE_KEY,
			JSON.stringify({
				version: HISTORY_STORAGE_VERSION,
				data: { 42: { attempts: [{ at: 1, correct: true, submitted: 'z' }], firstSolvedAt: 1, solveCount: 1 } }
			})
		);
		expect(getRecord(42)?.solveCount).toBe(1);
	});
});
