<script lang="ts">
	import { onMount } from 'svelte';
	import QuizCard from '$lib/components/QuizCard.svelte';
	import { getHistory } from '$lib/storage/history.svelte';

	const { data } = $props();

	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	const solved = $derived.by(() => {
		if (!mounted) return 0;
		const h = getHistory();
		return data.quizzes.filter((q) => (h[q.id]?.solveCount ?? 0) > 0).length;
	});
</script>

<svelte:head>
	<title>Swift Quiz</title>
	<meta
		name="description"
		content="Short, tricky Swift programs. Predict what each one does, then read the explanation."
	/>
</svelte:head>

<h1>Swift Quiz</h1>
<p class="lede">
	Each quiz is a short Swift program with a surprising twist. Predict what it does, then read the
	explanation.
</p>

{#if mounted}
	<p class="count">
		{solved} of {data.quizzes.length} solved
	</p>
{/if}

<ul class="quizzes">
	{#each data.quizzes as quiz (quiz.id)}
		<li><QuizCard {quiz} /></li>
	{/each}
</ul>

<style>
	.lede {
		color: var(--fg-muted);
		max-width: 50ch;
	}
	.count {
		color: var(--fg-muted);
		font-size: 0.9rem;
		margin-top: 1.5rem;
	}
	.quizzes {
		list-style: none;
		padding: 0;
		margin: 1.5rem 0 0;
		border-top: 1px solid var(--border);
	}
</style>