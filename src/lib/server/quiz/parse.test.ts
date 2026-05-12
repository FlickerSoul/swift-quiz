import { describe, expect, it } from 'vitest';
import { parseQuizFile, QuizParseError } from './parse';

const fmTyped = `---
title: Tuple Swap
difficulty: medium
topics: [macro]
answer:
  kind: prints
  output: "(2, 1)"
---

## Explanation

It just works.
`;

const fmChoice = `---
title: Optional Default
difficulty: easy
topics: [macro]
options:
  - "0"
  - "nil"
correct: 0
---

## Hint

What's the precedence?

## Explanation

Operator precedence matters.
`;

describe('parseQuizFile', () => {
	it('parses a typed-answer quiz', () => {
		const r = parseQuizFile(fmTyped, '001-x.md');
		expect(r.data.mode).toBe('typed');
		expect(r.data.title).toBe('Tuple Swap');
		expect(r.hintTokens).toBeNull();
		expect(r.explanationTokens.length).toBeGreaterThan(0);
	});

	it('parses a multiple-choice quiz with hint', () => {
		const r = parseQuizFile(fmChoice, '002-x.md');
		expect(r.data.mode).toBe('choice');
		if (r.data.mode === 'choice') {
			expect(r.data.options).toEqual(['0', 'nil']);
			expect(r.data.correct).toBe(0);
		}
		expect(r.hintTokens).not.toBeNull();
		expect(r.explanationTokens.length).toBeGreaterThan(0);
	});

	it('rejects missing frontmatter', () => {
		expect(() => parseQuizFile('no frontmatter here', 'x.md')).toThrow(QuizParseError);
	});

	it('rejects invalid difficulty', () => {
		const bad = fmTyped.replace('difficulty: medium', 'difficulty: extreme');
		expect(() => parseQuizFile(bad, 'x.md')).toThrow(/difficulty/);
	});

	it('rejects out-of-range correct index', () => {
		const bad = fmChoice.replace('correct: 0', 'correct: 5');
		expect(() => parseQuizFile(bad, 'x.md')).toThrow(/correct/);
	});

	it('rejects both answer and options present', () => {
		const bad = `---
title: Bad
difficulty: easy
topics: [macro]
answer:
  kind: prints
  output: "x"
options:
  - "a"
  - "b"
correct: 0
---

## Explanation

x
`;
		expect(() => parseQuizFile(bad, 'x.md')).toThrow();
	});

	it('rejects unknown H2 section', () => {
		const bad = `---
title: Bad
difficulty: easy
topics: [macro]
answer:
  kind: prints
  output: "x"
---

## Bonus

extra info
`;
		expect(() => parseQuizFile(bad, 'x.md')).toThrow(/unknown H2 section/);
	});

	it('rejects missing Explanation section', () => {
		const bad = `---
title: Bad
difficulty: easy
topics: [macro]
answer:
  kind: prints
  output: "x"
---

## Hint

only a hint
`;
		expect(() => parseQuizFile(bad, 'x.md')).toThrow(/Explanation/);
	});

	it('rejects content above the first H2 section', () => {
		const bad = `---
title: Bad
difficulty: easy
topics: [macro]
answer:
  kind: prints
  output: "x"
---

stray text

## Explanation

x
`;
		expect(() => parseQuizFile(bad, 'x.md')).toThrow();
	});

	it('rejects unknown topic', () => {
		const bad = fmTyped.replace('topics: [macro]', 'topics: [imaginary]');
		expect(() => parseQuizFile(bad, 'x.md')).toThrow();
	});
});
