<script lang="ts">
	import { grade } from '$lib/quiz/grade';
	import type { AnswerKind, Quiz, Submission } from '$lib/quiz/types';
	import { recordAttempt } from '$lib/storage/history.svelte';

	const { quiz }: { quiz: Quiz } = $props();

	const KINDS: { value: AnswerKind; label: string }[] = [
		{ value: 'prints', label: 'Prints' },
		{ value: 'compile-error', label: "Doesn't compile" },
		{ value: 'trap', label: 'Runtime trap' },
		{ value: 'non-deterministic', label: 'Non-deterministic' }
	];

	let typedKind = $state<AnswerKind>('prints');
	let typedOutput = $state('');
	let choiceIndex = $state<number | null>(null);
	let submitted = $state(false);
	let revealed = $state(false);
	let result = $state<ReturnType<typeof grade> | null>(null);

	function buildSubmission(): Submission | null {
		if (quiz.mode === 'typed') {
			return { mode: 'typed', kind: typedKind, output: typedOutput };
		}
		if (choiceIndex === null) return null;
		return { mode: 'choice', index: choiceIndex };
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (submitted) return;
		const sub = buildSubmission();
		if (!sub) return;
		const r = grade(quiz, sub);
		result = r;
		submitted = true;
		recordAttempt(quiz.id, {
			at: Date.now(),
			correct: r.correct,
			submitted: sub.mode === 'typed' ? `${sub.kind}|${sub.output}` : `choice:${sub.index}`
		});
	}

	function handleReveal() {
		if (submitted || revealed) return;
		revealed = true;
	}

	const showExplanation = $derived(submitted || revealed);
</script>

<form onsubmit={handleSubmit} aria-labelledby="answer-heading">
	<h2 id="answer-heading" class="visually-hidden">Your answer</h2>

	{#if quiz.mode === 'typed'}
		<fieldset disabled={submitted}>
			<legend>What does this program do?</legend>
			<div class="kinds">
				{#each KINDS as opt (opt.value)}
					<label class="kind">
						<input type="radio" name="kind" value={opt.value} bind:group={typedKind} />
						<span>{opt.label}</span>
					</label>
				{/each}
			</div>
			{#if typedKind === 'prints'}
				<label class="output">
					<span>Expected output</span>
					<textarea
						bind:value={typedOutput}
						placeholder="exact text the program prints"
						rows="3"
						spellcheck="false"
					></textarea>
				</label>
			{/if}
		</fieldset>
	{:else}
		<fieldset disabled={submitted}>
			<legend>Pick the correct outcome</legend>
			<div class="choices">
				{#each quiz.options as option, i (i)}
					<label class="choice" class:selected={choiceIndex === i}>
						<input type="radio" name="choice" value={i} bind:group={choiceIndex} />
						<span>{option}</span>
					</label>
				{/each}
			</div>
		</fieldset>
	{/if}

	<div class="actions">
		<button type="submit" class="primary" disabled={submitted}>Submit</button>
		{#if !submitted}
			<button type="button" class="ghost" onclick={handleReveal}>Reveal answer</button>
		{/if}
	</div>

	{#if submitted && result}
		<div class="result" class:correct={result.correct} class:wrong={!result.correct}>
			{#if result.correct}
				<strong>Correct.</strong>
			{:else}
				<strong>Not quite.</strong>
				The answer is <code>{result.correctAnswer}</code>.
			{/if}
		</div>
	{:else if revealed}
		<div class="result revealed">
			Revealed: the answer is
			<code>
				{#if quiz.mode === 'typed'}
					{#if quiz.answer.kind === 'prints'}
						Prints: {quiz.answer.output}
					{:else if quiz.answer.kind === 'compile-error'}
						Doesn't compile
					{:else if quiz.answer.kind === 'trap'}
						Runtime trap
					{:else}
						Non-deterministic
					{/if}
				{:else}
					{quiz.options[quiz.correct]}
				{/if}
			</code>
		</div>
	{/if}
</form>

{#if showExplanation}
	<section class="explanation prose">
		<h2>Explanation</h2>
		{@html quiz.explanationHtml}
	</section>
{/if}

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 2rem;
	}
	fieldset {
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 1rem 1.25rem;
		margin: 0;
	}
	fieldset:disabled {
		opacity: 0.75;
	}
	legend {
		padding: 0 0.4rem;
		font-size: 0.9rem;
		color: var(--fg-muted);
	}
	.kinds,
	.choices {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.kind,
	.choice {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		cursor: pointer;
		padding: 0.3rem 0;
	}
	.kind input,
	.choice input {
		accent-color: var(--accent);
	}
	.output {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-top: 0.75rem;
	}
	.output span {
		font-size: 0.85rem;
		color: var(--fg-muted);
	}
	textarea {
		font: inherit;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--surface);
		color: inherit;
		resize: vertical;
	}
	textarea:focus {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.actions {
		display: flex;
		gap: 0.75rem;
	}
	button {
		font: inherit;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
	}
	.primary {
		background: var(--accent);
		color: white;
		border: 1px solid var(--accent);
	}
	.primary:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.ghost {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--fg-muted);
	}
	.ghost:hover {
		color: var(--fg);
	}
	.result {
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		font-size: 0.95rem;
	}
	.result.correct {
		background: var(--ok-bg);
		border-color: var(--ok);
		color: var(--ok);
	}
	.result.wrong {
		background: var(--bad-bg);
		border-color: var(--bad);
		color: var(--bad);
	}
	.result code {
		font-family: var(--font-mono);
		background: rgba(0, 0, 0, 0.04);
		padding: 0.05em 0.4em;
		border-radius: 3px;
	}
	.explanation {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
	}
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
