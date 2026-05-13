<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { contributeUrl } from '$lib/quiz/issue';
	import { getHistory } from '$lib/storage/history.svelte';

	const { quizIds }: { quizIds: number[] } = $props();

	const links = [
		{ href: resolve('/'), label: 'Quizzes' },
		{ href: resolve('/history'), label: 'History' },
		{ href: resolve('/about'), label: 'About' }
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
		goto(resolve('/quiz/[id]', { id: String(choice) }));
	}
</script>

<header>
	<a class="brand" href={resolve('/')}>
		<span class="brand-mark">Swift</span><span class="brand-quiz">Quiz</span>
	</a>
	<nav>
		<button type="button" class="random" onclick={pickRandom} disabled={quizIds.length === 0}>
			Random
		</button>
		{#each links as { href, label } (href)}
			<a {href} class:active={page.url.pathname === href}>{label}</a>
		{/each}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a class="contribute" href={contributeUrl()} target="_blank" rel="noopener noreferrer">
			Contribute
		</a>
		<a
			class="github"
			href="https://github.com/FlickerSoul/swift-quiz"
			target="_blank"
			rel="noopener noreferrer"
			aria-label="View on GitHub"
			title="View on GitHub"
		>
			<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
				<path
					fill="currentColor"
					d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
				/>
			</svg>
		</a>
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

	.contribute {
		font-size: 0.9rem;
		padding: 0.3rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--fg-muted);
		text-decoration: none;
	}
	.contribute:hover {
		color: var(--accent);
		border-color: var(--accent);
	}

	.github {
		display: inline-flex;
		align-items: center;
		color: var(--fg-muted);
		transform: translateY(0.2rem);
	}
	.github:hover {
		color: var(--fg);
	}
</style>
