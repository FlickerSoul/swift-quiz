import { describe, expect, it } from 'vitest';
import { parseFilename } from './load';

describe('parseFilename', () => {
	it('extracts id and slug', () => {
		expect(parseFilename('/src/lib/quizzes/018-tuple-swap.md')).toEqual({
			id: 18,
			slug: 'tuple-swap',
			base: '018-tuple-swap'
		});
	});

	it('handles single-digit ids', () => {
		expect(parseFilename('/src/lib/quizzes/1-foo.md').id).toBe(1);
	});

	it('rejects non-numeric prefix', () => {
		expect(() => parseFilename('/src/lib/quizzes/abc-foo.md')).toThrow();
	});

	it('rejects missing slug', () => {
		expect(() => parseFilename('/src/lib/quizzes/001.md')).toThrow();
	});

	it('rejects bad slug characters', () => {
		expect(() => parseFilename('/src/lib/quizzes/001-Foo_Bar.md')).toThrow();
	});

	it('handles bare filenames without path', () => {
		expect(parseFilename('001-x.md').slug).toBe('x');
	});
});