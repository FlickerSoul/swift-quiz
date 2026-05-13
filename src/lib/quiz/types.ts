// Client-safe types. This module is type-only at runtime: it re-exports
// inferred types from `./schema` via `export type` so zod and the schemas
// themselves never enter the client bundle.

export type { Difficulty, AnswerKind, TypedAnswer, QuizFrontmatter } from './schema';

import type { AnswerKind, QuizFrontmatter } from './schema';

export type QuizData = QuizFrontmatter & {
	id: number;
	slug: string;
};

export type CodeFile = {
	name: string;
	source: string;
	html: string;
};

// One per (quiz × configured Swift version). `version` is the *resolved* exact
// version (e.g. "6.3.1"), not the spec ("6.3"); that's what the badge shows.
export type VerificationStatus =
	| {
			kind: 'skipped';
			version: string; // empty string when there's no resolved version yet (e.g. disabled)
			reason: 'multi-file' | 'non-deterministic' | 'choice-mode' | 'no-cache' | 'disabled';
	  }
	| { kind: 'verified'; version: string }
	| { kind: 'failed'; version: string; details: string };

export type Quiz = QuizData & {
	codeFiles: CodeFile[];
	hintHtml: string | null;
	explanationHtml: string;
	verification: VerificationStatus[];
};

export type QuizSummary = Pick<Quiz, 'id' | 'slug' | 'title' | 'difficulty' | 'topics'>;

export type Submission =
	| { mode: 'typed'; kind: AnswerKind; output: string }
	| { mode: 'choice'; index: number };

export type GradeResult = {
	correct: boolean;
	correctAnswer: string;
	submittedDisplay: string;
};
