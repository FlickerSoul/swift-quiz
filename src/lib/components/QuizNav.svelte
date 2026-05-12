<script lang="ts">
	const { prevId, nextId }: { prevId: number | null; nextId: number | null } = $props();
</script>

<nav class="quiz-nav">
	<div>
		{#if prevId !== null}
			<a href="/quiz/{prevId}" rel="prev">← Previous</a>
		{/if}
	</div>
	<div>
		{#if nextId !== null}
			<a href="/quiz/{nextId}" rel="next">Next →</a>
		{/if}
	</div>
</nav>

<style>
	.quiz-nav {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
	}
	a {
		color: var(--fg-muted);
		text-decoration: none;
		font-size: 0.95rem;
	}
	a:hover {
		color: var(--accent);
	}
</style>