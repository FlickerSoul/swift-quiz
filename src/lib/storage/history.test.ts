import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	clearAll,
	clearQuiz,
	getHistory,
	getRecord,
	HISTORY_STORAGE_KEY,
	HISTORY_STORAGE_VERSION,
	recordAttempt,
	__reloadForTests,
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

		// Simulate a page reload: persisted payload stays, in-memory state is
		// reset, then the store re-reads from localStorage.
		const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
		expect(stored).not.toBeNull();
		__resetForTests();
		window.localStorage.setItem(HISTORY_STORAGE_KEY, stored!);
		__reloadForTests();

		expect(getRecord(1)?.attempts).toHaveLength(1);
	});

	it('locks the record once solved (no further attempts recorded)', () => {
		recordAttempt(2, { at: 1_000, correct: false, submitted: 'x' });
		recordAttempt(2, { at: 2_000, correct: true, submitted: 'y' });
		recordAttempt(2, { at: 3_000, correct: false, submitted: 'z' });

		const rec = getRecord(2)!;
		expect(rec.attempts).toHaveLength(2);
		expect(rec.solveCount).toBe(1);
		expect(rec.firstSolvedAt).toBe(2_000);
		expect(rec.solvedBy).toBe('userSolved');
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
				data: {
					42: {
						attempts: [{ at: 1, correct: true, submitted: 'z' }],
						firstSolvedAt: 1,
						solveCount: 1,
						solvedBy: 'userSolved'
					}
				}
			})
		);
		__reloadForTests();
		expect(getRecord(42)?.solveCount).toBe(1);
		expect(getRecord(42)?.solvedBy).toBe('userSolved');
	});
});
