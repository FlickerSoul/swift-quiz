<script lang="ts">
	import HistoryTable from '$lib/components/HistoryTable.svelte';

	const { data } = $props();
</script>

<svelte:head>
	<title>History · Swift Quiz</title>
</svelte:head>

<h1>History</h1>
<p class="lede">
	Stored only in your browser. Nothing is sent to a server.
</p>

<HistoryTable quizzes={data.quizzes} />

<style>
	.lede {
		color: var(--fg-muted);
		max-width: 50ch;
		margin-bottom: 1.5rem;
	}
</style>
