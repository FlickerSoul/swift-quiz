import { loadQuizSummaries } from '$lib/server/quiz/load';

export const prerender = true;
export const trailingSlash = 'never';

export async function load() {
	const summaries = await loadQuizSummaries();
	return { quizIds: summaries.map((s) => s.id) };
}
