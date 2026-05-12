<script lang="ts">
	import { onMount } from 'svelte';
	import DifficultyBadge from './DifficultyBadge.svelte';
	import type { QuizSummary } from '$lib/quiz/types';
	import { getRecord } from '$lib/storage/history.svelte';

	const { quiz }: { quiz: QuizSummary } = $props();

	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	const record = $derived(mounted ? getRecord(quiz.id) : undefined);
	const status = $derived.by(() => {
		if (!record) return null;
		if (record.solveCount > 0) return { kind: 'solved' as const, n: record.solveCount };
		if (record.attempts.length > 0) return { kind: 'attempted' as const, n: record.attempts.length };
		return null;
	});
</script>

<a class="card" href="/quiz/{quiz.id}">
	<span class="id">#{quiz.id}</span>
	<span class="title">{quiz.title}</span>
	<DifficultyBadge difficulty={quiz.difficulty} />
	{#if status}
		<span class="status {status.kind}">
			{#if status.kind === 'solved'}
				Solved ✓{status.n > 1 ? ` (${status.n}×)` : ''}
			{:else}
				Attempted ×{status.n}
			{/if}
		</span>
	{/if}
</a>

<style>
	.card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--border);
		text-decoration: none;
		color: inherit;
	}
	.card:hover .title {
		color: var(--accent);
	}
	.id {
		color: var(--fg-muted);
		font-variant-numeric: tabular-nums;
		font-size: 0.9rem;
		min-width: 2.5rem;
	}
	.title {
		flex: 1;
		font-size: 1rem;
	}
	.status {
		font-size: 0.8rem;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		background: var(--surface);
	}
	.status.solved {
		color: var(--ok);
		background: var(--ok-bg);
	}
	.status.attempted {
		color: var(--fg-muted);
	}
</style>
