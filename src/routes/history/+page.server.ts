import { loadQuizSummaries } from '$lib/server/quiz/load';

export async function load() {
	return { quizzes: await loadQuizSummaries() };
}
