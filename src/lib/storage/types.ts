export type Attempt = {
	at: number;
	correct: boolean;
	submitted: string;
};

export type QuizRecord = {
	attempts: Attempt[];
	firstSolvedAt: number | null;
	solveCount: number;
};

export type History = Record<number, QuizRecord>;
