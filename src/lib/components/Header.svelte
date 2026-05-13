<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getHistory } from '$lib/storage/history.svelte';

	const { quizIds }: { quizIds: number[] } = $props();

	const links = [
		{ href: '/', label: 'Quizzes' },
		{ href: '/history', label: 'History' },
		{ href: '/about', label: 'About' }
	];

	function pickRandom() {
		if (quizIds.length === 0) return;
		const history = getHistory();
		const open = quizIds.filter((id) => history[id]?.solvedBy == null);
		const pool = open.length > 0 ? open : quizIds;
		const current = page.url.pathname.match(/^\/quiz\/(\d+)/)?.[1];
		const without = current ? pool.filter((id) => String(id) !== current) : pool;
		const choices = without.length > 0 ? without : pool;
		const choice = choices[Math.floor(Math.random() * choices.length)];
		goto(`/quiz/${choice}`);
	}
</script>

<header>
	<a class="brand" href="/">
		<span class="brand-mark">Swift</span><span class="brand-quiz">Quiz</span>
	</a>
	<nav>
		<button type="button" class="random" onclick={pickRandom} disabled={quizIds.length === 0}>
			Random
		</button>
		{#each links as { href, label } (href)}
			<a {href} class:active={page.url.pathname === href}>{label}</a>
		{/each}
	</nav>
</header>

<style>
	header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 2rem;
		padding: 1.25rem 0;
		border-bottom: 1px solid var(--border);
	}

	.brand {
		font-weight: 600;
		font-size: 1.1rem;
		letter-spacing: -0.01em;
		text-decoration: none;
		color: inherit;
	}
	.brand-mark {
		color: var(--accent);
	}
	.brand-quiz {
		color: var(--fg-muted);
	}

	nav {
		display: flex;
		align-items: baseline;
		gap: 1.25rem;
	}
	nav a {
		color: var(--fg-muted);
		text-decoration: none;
		font-size: 0.95rem;
	}
	nav a:hover {
		color: var(--fg);
	}
	nav a.active {
		color: var(--fg);
		font-weight: 500;
	}

	.random {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.3rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: transparent;
		color: var(--fg-muted);
		cursor: pointer;
	}
	.random:hover:not(:disabled) {
		color: var(--accent);
		border-color: var(--accent);
	}
	.random:disabled {
		opacity: 0.4;
		cursor: default;
	}
</style>
