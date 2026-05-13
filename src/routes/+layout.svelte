<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';

	const { data, children } = $props();
</script>

<div class="app">
	<Header quizIds={data.quizIds} />
	<main>
		{@render children()}
	</main>
</div>
