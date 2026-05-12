// Client-safe types. This module is type-only at runtime: it re-exports
// inferred types from `./schema` via `export type` so zod and the schemas
// themselves never enter the client bundle.

export type { Difficulty, AnswerKind, TypedAnswer, QuizFrontmatter } from './schema';

import type { QuizFrontmatter, AnswerKind } from './schema';

export type QuizData = QuizFrontmatter & {
	id: number;
	slug: string;
};

export type CodeFile = {
	name: string;
	source: string;
	html: string;
};

export type Quiz = QuizData & {
	codeFiles: CodeFile[];
	hintHtml: string | null;
	explanationHtml: string;
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
