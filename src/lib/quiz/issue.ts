import { REPO_URL } from './config';
import type { QuizSummary } from './types';

// Builds a GitHub "new issue" URL pre-filled with the quiz id, slug, and a
// templated body. Used by the "Report an issue" link on quiz pages.
export function reportIssueUrl(quiz: Pick<QuizSummary, 'id' | 'slug' | 'title'>): string {
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

// Builds a GitHub "new issue" URL pre-filled with a template for proposing a
// new quiz. Linked from the "Contribute" button in the site header.
export function contributeUrl(): string {
	const title = 'New quiz: <short title>';
	const body = [
		`<!-- Prefer to send a PR? Feel free to open one directly against \`src/lib/quizzes/\` instead — see existing quizzes there for the expected layout (quiz.md + main.swift). -->`,
		``,
		`## Quiz idea`,
		``,
		`<!-- One-sentence summary of what this quiz tests (e.g. "actor reentrancy with async let"). -->`,
		`## Sample code`,
		'```swift',
		`// A minimal, self-contained Swift program that demonstrates the behavior.`,
		`// Keep it concise`,
		`// your code here`,
		'```',
		'',
		`## Expected outcome`,
		``,
		`<!-- Pick one and fill in: -->`,
		`- [ ] Prints exactly:`,
		'  ```',
		'  <output>',
		'  ```',
		`- [ ] Doesn't compile (briefly say why)`,
		`- [ ] Runtime trap`,
		`- [ ] Non-deterministic`,
		'',
		`## Why is it interesting?`,
		`<!-- What's the trick, the gotcha, or the language detail readers should learn from it? -->`,
		'',
		`## Topics / difficulty (optional)`,
		`<!-- e.g. concurrency, generics, protocols · easy / medium / hard -->`,
		''
	].join('\n');
	return `${REPO_URL}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
