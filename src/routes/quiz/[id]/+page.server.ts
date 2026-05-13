import { error } from '@sveltejs/kit';
import { loadQuiz, loadQuizzes } from '$lib/server/quiz/load';

export const prerender = true;

export async function entries() {
	const list = await loadQuizzes();
	return list.map((q) => ({ id: String(q.id) }));
}

export async function load({ params }) {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(404, 'Not found');
	const all = await loadQuizzes();
	const quiz = await loadQuiz(id);
	if (!quiz) throw error(404, 'Not found');
	const idx = all.findIndex((q) => q.id === id);
	return {
		quiz,
		prevId: idx > 0 ? all[idx - 1].id : null,
		nextId: idx < all.length - 1 ? all[idx + 1].id : null
	};
}
