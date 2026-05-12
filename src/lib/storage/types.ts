export type Attempt = {
	at: number;
	correct: boolean;
	submitted: string;
};

export type SolutionSource = 'userSolved' | 'answerRevealed';

export type QuizRecord = {
	attempts: Attempt[];
	/** Timestamp of the first correct submission, if any. */
	firstSolvedAt: number | null;
	solveCount: number;
	/** How the quiz was first closed, if at all. */
	solvedBy: SolutionSource | null;
};

export type History = Record<number, QuizRecord>;
