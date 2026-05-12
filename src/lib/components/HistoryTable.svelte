<script lang="ts">
	import type { QuizSummary } from '$lib/quiz/types';
	import {
		clearAll,
		clearQuiz,
		getHistory
	} from '$lib/storage/history.svelte';
	import { onMount } from 'svelte';

	const { quizzes }: { quizzes: QuizSummary[] } = $props();

	const titleById = $derived(new Map(quizzes.map((q) => [q.id, q.title])));

	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	const history = $derived(mounted ? getHistory() : {});
	const entries = $derived(
		Object.entries(history)
			.map(([id, rec]) => ({ id: Number(id), rec }))
			.sort((a, b) => a.id - b.id)
	);

	let confirmingClearAll = $state(false);
	let confirmTimer: ReturnType<typeof setTimeout> | null = null;

	function startConfirmClearAll() {
		if (confirmingClearAll) {
			clearAll();
			confirmingClearAll = false;
			if (confirmTimer) clearTimeout(confirmTimer);
			return;
		}
		confirmingClearAll = true;
		confirmTimer = setTimeout(() => {
			confirmingClearAll = false;
		}, 3000);
	}

	function formatWhen(ts: number): string {
		const diff = Date.now() - ts;
		const min = 60_000;
		const hour = 60 * min;
		const day = 24 * hour;
		if (diff < min) return 'just now';
		if (diff < hour) return `${Math.floor(diff / min)}m ago`;
		if (diff < day) return `${Math.floor(diff / hour)}h ago`;
		const d = Math.floor(diff / day);
		if (d < 30) return `${d}d ago`;
		return new Date(ts).toLocaleDateString();
	}
</script>

{#if mounted && entries.length === 0}
	<p class="empty">No attempts yet. Solve a quiz to see it here.</p>
{:else if mounted}
	<div class="actions">
		<button class="danger" onclick={startConfirmClearAll}>
			{confirmingClearAll ? 'Click again to confirm' : 'Clear all history'}
		</button>
	</div>

	<ul class="entries">
		{#each entries as { id, rec } (id)}
			<li>
				<div class="entry-head">
					<a href="/quiz/{id}" class="title">#{id} {titleById.get(id) ?? '(unknown)'}</a>
					<span class="meta">
						{rec.attempts.length} attempt{rec.attempts.length === 1 ? '' : 's'},
						{rec.solveCount} solved
					</span>
					<button class="ghost" onclick={() => clearQuiz(id)}>Clear</button>
				</div>
				<ol class="attempts">
					{#each rec.attempts as att, i (i)}
						<li class="att" class:correct={att.correct} class:wrong={!att.correct}>
							<span class="mark">{att.correct ? '✓' : '✗'}</span>
							<code>{att.submitted}</code>
							<span class="when">{formatWhen(att.at)}</span>
						</li>
					{/each}
				</ol>
			</li>
		{/each}
	</ul>
{:else}
	<p class="empty">Loading…</p>
{/if}

<style>
	.empty {
		color: var(--fg-muted);
	}
	.actions {
		margin-bottom: 1.5rem;
	}
	button {
		font: inherit;
		padding: 0.4rem 0.9rem;
		border-radius: 6px;
		cursor: pointer;
	}
	.danger {
		background: var(--bad-bg);
		color: var(--bad);
		border: 1px solid var(--bad);
	}
	.ghost {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--fg-muted);
	}
	.ghost:hover {
		color: var(--fg);
	}
	.entries {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.entry-head {
		display: flex;
		gap: 1rem;
		align-items: baseline;
	}
	.title {
		font-weight: 500;
		text-decoration: none;
		color: inherit;
	}
	.title:hover {
		color: var(--accent);
	}
	.meta {
		flex: 1;
		color: var(--fg-muted);
		font-size: 0.85rem;
	}
	.attempts {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0 0 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.att {
		display: flex;
		gap: 0.6rem;
		align-items: baseline;
		font-size: 0.9rem;
	}
	.att .mark {
		font-weight: 600;
	}
	.att.correct .mark {
		color: var(--ok);
	}
	.att.wrong .mark {
		color: var(--bad);
	}
	.att code {
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
