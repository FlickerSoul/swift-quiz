<script lang="ts">
	import { onMount } from 'svelte';
	import AnswerForm from '$lib/components/AnswerForm.svelte';
	import DifficultyBadge from '$lib/components/DifficultyBadge.svelte';
	import QuizNav from '$lib/components/QuizNav.svelte';
	import { clearQuiz, getRecord } from '$lib/storage/history.svelte';

	const { data } = $props();
	const { quiz, prevId, nextId } = $derived(data);

	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	const record = $derived(mounted ? getRecord(quiz.id) : undefined);

	function formatWhen(ts: number): string {
		const diff = Date.now() - ts;
		const min = 60_000;
		const hour = 60 * min;
		const day = 24 * hour;
		if (diff < min) return 'just now';
		if (diff < hour) return `${Math.floor(diff / min)}m ago`;
		if (diff < day) return `${Math.floor(diff / hour)}h ago`;
		return `${Math.floor(diff / day)}d ago`;
	}
</script>

<svelte:head>
	<title>#{quiz.id} — {quiz.title} · Swift Quiz</title>
</svelte:head>

<article>
	<header class="quiz-head">
		<span class="id">#{quiz.id}</span>
		<h1>{quiz.title}</h1>
		<DifficultyBadge difficulty={quiz.difficulty} />
	</header>
	{#if quiz.topics.length > 0}
		<ul class="topics">
			{#each quiz.topics as topic (topic)}
				<li>{topic}</li>
			{/each}
		</ul>
	{/if}

	<section class="code">
		{#each quiz.codeFiles as file (file.name)}
			{#if quiz.codeFiles.length > 1}
				<p class="filename">{file.name}</p>
			{/if}
			{@html file.html}
		{/each}
	</section>

	{#if quiz.hintHtml}
		<details class="hint">
			<summary>Hint</summary>
			<div class="prose">{@html quiz.hintHtml}</div>
		</details>
	{/if}

	<AnswerForm {quiz} />

	{#if mounted && record && record.attempts.length > 0}
		<section class="prior">
			<header class="prior-head">
				<h3>Your past attempts</h3>
				<button class="ghost" onclick={() => clearQuiz(quiz.id)}>Reset this quiz</button>
			</header>
			<ol>
				{#each record.attempts as att, i (i)}
					<li class:correct={att.correct} class:wrong={!att.correct}>
						<span class="mark">{att.correct ? '✓' : '✗'}</span>
						<code>{att.submitted}</code>
						<span class="when">{formatWhen(att.at)}</span>
					</li>
				{/each}
			</ol>
		</section>
	{/if}

	<QuizNav {prevId} {nextId} />
</article>

<style>
	.quiz-head {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}
	.quiz-head h1 {
		flex: 1;
		margin: 0;
		font-size: 1.5rem;
	}
	.id {
		color: var(--fg-muted);
		font-variant-numeric: tabular-nums;
	}
	.topics {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.topics li {
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		background: var(--surface);
		color: var(--fg-muted);
	}
	.code {
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.filename {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--fg-muted);
		margin: 0;
	}
	.hint {
		margin-top: 1.25rem;
		padding: 0.5rem 1rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--surface);
	}
	.hint summary {
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--fg-muted);
	}
	.prior {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
	}
	.prior-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
	}
	.prior h3 {
		margin: 0;
		font-size: 1rem;
		color: var(--fg-muted);
		font-weight: 500;
	}
	.ghost {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.25rem 0.7rem;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--fg-muted);
		cursor: pointer;
	}
	.ghost:hover {
		color: var(--fg);
	}
	.prior ol {
		list-style: none;
		padding: 0;
		margin: 0.75rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.prior li {
		display: flex;
		gap: 0.6rem;
		align-items: baseline;
		font-size: 0.9rem;
	}
	.prior .mark {
		font-weight: 600;
	}
	.prior li.correct .mark {
		color: var(--ok);
	}
	.prior li.wrong .mark {
		color: var(--bad);
	}
	.prior code {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--fg-muted);
	}
	.when {
		margin-left: auto;
		color: var(--fg-muted);
		font-size: 0.8rem;
	}
</style>
