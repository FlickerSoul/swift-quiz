<script lang="ts">
	import type { Difficulty } from '$lib/quiz/types';

	const { difficulty }: { difficulty: Difficulty } = $props();

	const STARS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
</script>

<span class="badge" title={difficulty} aria-label="Difficulty: {difficulty}">
	{#each Array(3) as _, i (i)}
		<span class="star" class:filled={i < STARS[difficulty]}>★</span>
	{/each}
</span>

<style>
	.badge {
		display: inline-flex;
		gap: 1px;
		font-size: 0.9rem;
		line-height: 1;
	}
	.star {
		color: var(--border);
	}
	.star.filled {
		color: var(--accent);
	}
</style>
