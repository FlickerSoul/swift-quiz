import { REPO_URL } from './config';
import type { QuizSummary } from './types';

// Builds a GitHub "new issue" URL pre-filled with the quiz id, slug, and a
// templated body. Used by the "Report an issue" link on quiz pages.
export function issueUrl(quiz: Pick<QuizSummary, 'id' | 'slug' | 'title'>): string {
	const idStr = String(quiz.id).padStart(3, '0');
	const title = `Quiz #${idStr} (${quiz.slug}): <short description>`;
	const body = [
		`**Quiz:** #${quiz.id} — ${quiz.title}`,
		'',
		`## What's wrong?`,
		`<!-- e.g. the recorded answer doesn't match what swiftc produces, the code has a typo, the explanation is incorrect, … -->`,
		'',
		`## Expected behavior`,
		`<!-- What should the quiz say / do instead? -->`,
		'',
		`## Environment (if relevant)`,
		`- Swift version:`,
		`- Platform:`,
		'',
		'---',
		`<sub>Filed from the quiz page.</sub>`
	].join('\n');
	return `${REPO_URL}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
