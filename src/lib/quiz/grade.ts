import type { GradeResult, Quiz, Submission, TypedAnswer } from './types';

const KIND_LABEL: Record<TypedAnswer['kind'], string> = {
	prints: 'Prints',
	'compile-error': "Doesn't compile",
	trap: 'Runtime trap',
	'non-deterministic': 'Non-deterministic'
};

export function describeAnswer(answer: TypedAnswer): string {
	if (answer.kind === 'prints') return `${KIND_LABEL.prints}: ${answer.output}`;
	return KIND_LABEL[answer.kind];
}

export function describeSubmission(quiz: Quiz, sub: Submission): string {
	if (sub.mode === 'typed') {
		if (sub.kind === 'prints') return `${KIND_LABEL.prints}: ${sub.output}`;
		return KIND_LABEL[sub.kind];
	}
	const option = quiz.mode === 'choice' ? quiz.options[sub.index] : `option ${sub.index}`;
	return option ?? `option ${sub.index}`;
}

function normaliseOutput(s: string): string {
	return s.replace(/\r\n/g, '\n').trim();
}

export function grade(quiz: Quiz, sub: Submission): GradeResult {
	const submittedDisplay = describeSubmission(quiz, sub);

	if (quiz.mode === 'typed' && sub.mode === 'typed') {
		const expected = quiz.answer;
		const correctAnswer = describeAnswer(expected);
		if (expected.kind !== sub.kind) {
			return { correct: false, correctAnswer, submittedDisplay };
		}
		if (expected.kind === 'prints' && sub.kind === 'prints') {
			const ok = normaliseOutput(expected.output) === normaliseOutput(sub.output);
			return { correct: ok, correctAnswer, submittedDisplay };
		}
		return { correct: true, correctAnswer, submittedDisplay };
	}

	if (quiz.mode === 'choice' && sub.mode === 'choice') {
		const correctAnswer = quiz.options[quiz.correct] ?? `option ${quiz.correct}`;
		return { correct: sub.index === quiz.correct, correctAnswer, submittedDisplay };
	}

	return {
		correct: false,
		correctAnswer:
			quiz.mode === 'typed' ? describeAnswer(quiz.answer) : (quiz.options[quiz.correct] ?? ''),
		submittedDisplay
	};
}
