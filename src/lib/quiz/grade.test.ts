import { describe, expect, it } from 'vitest';
import { grade } from './grade';
import type { Quiz, TypedAnswer } from './types';

function typedQuiz(answer: TypedAnswer): Quiz {
	return {
		mode: 'typed',
		answer,
		id: 1,
		slug: 't',
		title: 't',
		difficulty: 'easy',
		topics: [],
		files: undefined,
		codeFiles: [],
		hintHtml: null,
		explanationHtml: '',
		verification: []
	};
}

function choiceQuiz(options: string[], correct: number): Quiz {
	return {
		mode: 'choice',
		options,
		correct,
		id: 2,
		slug: 'c',
		title: 'c',
		difficulty: 'easy',
		topics: [],
		files: undefined,
		codeFiles: [],
		hintHtml: null,
		explanationHtml: '',
		verification: []
	};
}

describe('grade — typed', () => {
	it('marks correct prints submission', () => {
		const q = typedQuiz({ kind: 'prints', output: '0 1 2' });
		const r = grade(q, { mode: 'typed', kind: 'prints', output: '0 1 2' });
		expect(r.correct).toBe(true);
	});

	it('trims trailing whitespace', () => {
		const q = typedQuiz({ kind: 'prints', output: '0 1 2' });
		const r = grade(q, { mode: 'typed', kind: 'prints', output: '  0 1 2\n' });
		expect(r.correct).toBe(true);
	});

	it('rejects different output text', () => {
		const q = typedQuiz({ kind: 'prints', output: '0 1 2' });
		const r = grade(q, { mode: 'typed', kind: 'prints', output: '2 1 0' });
		expect(r.correct).toBe(false);
		expect(r.correctAnswer).toContain('0 1 2');
	});

	it('rejects mismatched kind', () => {
		const q = typedQuiz({ kind: 'prints', output: 'x' });
		const r = grade(q, { mode: 'typed', kind: 'trap', output: '' });
		expect(r.correct).toBe(false);
	});

	it('accepts trap when expected', () => {
		const q = typedQuiz({ kind: 'trap' });
		const r = grade(q, { mode: 'typed', kind: 'trap', output: '' });
		expect(r.correct).toBe(true);
	});

	it('rejects prints submission against compile-error expectation', () => {
		const q = typedQuiz({ kind: 'compile-error' });
		const r = grade(q, { mode: 'typed', kind: 'prints', output: 'x' });
		expect(r.correct).toBe(false);
	});
});

describe('grade — choice', () => {
	it('accepts correct index', () => {
		const q = choiceQuiz(['a', 'b', 'c'], 1);
		const r = grade(q, { mode: 'choice', index: 1 });
		expect(r.correct).toBe(true);
		expect(r.correctAnswer).toBe('b');
	});

	it('rejects wrong index', () => {
		const q = choiceQuiz(['a', 'b', 'c'], 1);
		const r = grade(q, { mode: 'choice', index: 2 });
		expect(r.correct).toBe(false);
		expect(r.submittedDisplay).toBe('c');
	});
});

describe('grade — mode mismatch', () => {
	it('reports incorrect when modes mismatch', () => {
		const q = typedQuiz({ kind: 'prints', output: 'x' });
		const r = grade(q, { mode: 'choice', index: 0 });
		expect(r.correct).toBe(false);
	});
});
