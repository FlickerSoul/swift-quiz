import { describe, expect, it } from 'vitest';
import { parseQuizPath } from './load';

describe('parseQuizPath', () => {
	it('extracts id and slug from folder name', () => {
		expect(parseQuizPath('/src/lib/quizzes/018-tuple-swap/quiz.md')).toEqual({
			id: 18,
			slug: 'tuple-swap',
			base: '018-tuple-swap'
		});
	});

	it('handles single-digit ids', () => {
		expect(parseQuizPath('/src/lib/quizzes/1-foo/quiz.md').id).toBe(1);
	});

	it('rejects non-numeric prefix', () => {
		expect(() => parseQuizPath('/src/lib/quizzes/abc-foo/quiz.md')).toThrow();
	});

	it('rejects missing slug', () => {
		expect(() => parseQuizPath('/src/lib/quizzes/001/quiz.md')).toThrow();
	});

	it('rejects bad slug characters', () => {
		expect(() => parseQuizPath('/src/lib/quizzes/001-Foo_Bar/quiz.md')).toThrow();
	});

	it('rejects flat .md files (legacy layout)', () => {
		expect(() => parseQuizPath('/src/lib/quizzes/001-foo.md')).toThrow();
	});
});
