// Source of truth for quiz data shape. Defined as zod schemas so we get both
// runtime validation (used by the build-time parser) and TypeScript types
// (inferred below) from one definition.
//
// This module is intentionally _value-bearing_ (zod schemas are runtime
// values). To keep zod out of the client bundle, client-side code must import
// only TYPES from `$lib/quiz/types`, which re-exports the inferred types with
// `export type`. The value-bearing schemas should only be imported from
// server-side code under `$lib/server`.

import { z } from 'zod';
import { TOPICS } from './topics';

// `TOPICS` must be non-empty for `z.enum`. Keep at least one topic listed
// in `topics.ts`; the build fails here otherwise, which is the desired loud
// failure.
const TopicSchema = z.enum(TOPICS);

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const AnswerKindSchema = z.enum([
	'prints',
	'compile-error',
	'trap',
	'non-deterministic'
]);

export const TypedAnswerSchema = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('prints'), output: z.string() }),
	z.object({ kind: z.literal('compile-error') }),
	z.object({ kind: z.literal('trap') }),
	z.object({ kind: z.literal('non-deterministic') })
]);

const RawFrontmatterSchema = z
	.object({
		title: z.string().min(1),
		difficulty: DifficultySchema,
		topics: z.array(TopicSchema).optional().default([]),
		// Optional file-selector list. Each entry is a regex pattern matched
		// against the bare filename (e.g. "main.swift"). If absent, every
		// `.swift` file in the matching folder is included.
		files: z.array(z.string().min(1)).min(1).optional(),
		answer: TypedAnswerSchema.optional(),
		options: z.array(z.string().min(1)).min(2).max(4).optional(),
		correct: z.number().int().nonnegative().optional()
	})
	.superRefine((d, ctx) => {
		const hasAnswer = d.answer !== undefined;
		const hasOptions = d.options !== undefined;
		const hasCorrect = d.correct !== undefined;

		if (hasAnswer && (hasOptions || hasCorrect)) {
			ctx.addIssue({
				code: 'custom',
				message: 'set either `answer` (typed mode) or `options`/`correct` (multiple choice), not both'
			});
		}
		if (!hasAnswer && !hasOptions && !hasCorrect) {
			ctx.addIssue({
				code: 'custom',
				message: 'must set either `answer` (typed mode) or `options`/`correct` (multiple choice)'
			});
		}
		if (hasOptions && !hasCorrect) {
			ctx.addIssue({
				code: 'custom',
				path: ['correct'],
				message: '`correct` is required when `options` is set'
			});
		}
		if (!hasOptions && hasCorrect) {
			ctx.addIssue({
				code: 'custom',
				path: ['options'],
				message: '`options` is required when `correct` is set'
			});
		}
		if (
			d.options !== undefined &&
			d.correct !== undefined &&
			d.correct >= d.options.length
		) {
			ctx.addIssue({
				code: 'custom',
				path: ['correct'],
				message: '`correct` must be a valid index into `options`'
			});
		}
	});

export const QuizFrontmatterSchema = RawFrontmatterSchema.transform((d) => {
	const base = {
		title: d.title,
		difficulty: d.difficulty,
		topics: d.topics,
		files: d.files
	};
	if (d.answer !== undefined) {
		return { ...base, mode: 'typed' as const, answer: d.answer };
	}
	return {
		...base,
		mode: 'choice' as const,
		options: d.options as string[],
		correct: d.correct as number
	};
});

export type Difficulty = z.infer<typeof DifficultySchema>;
export type AnswerKind = z.infer<typeof AnswerKindSchema>;
export type TypedAnswer = z.infer<typeof TypedAnswerSchema>;
export type QuizFrontmatter = z.infer<typeof QuizFrontmatterSchema>;
