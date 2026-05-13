<script>
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>About · Swift Quiz</title>
</svelte:head>

<h1>About</h1>

<div class="prose">
	<p>
		Swift Quiz is a collection of short, tricky Swift programs that help you understand the
		underlying model of the language.
	</p>

	<p>
		It's modeled after
		<a href="https://dtolnay.github.io/rust-quiz/" target="_blank" rel="noopener noreferrer">
			Rust Quiz</a
		> by David Tolnay.
	</p>

	<h2>Privacy</h2>
	<p>
		Your progress (which quizzes you've attempted and solved) is stored only in your browser's
		<code>localStorage</code>. Nothing is sent to a server. Clear it any time from the
		<a href={resolve('/history')}>History</a> page.
	</p>

	<h2>Authoring</h2>
	<p>
		Each quiz is a Markdown file plus a folder of Swift source. See
		<code>src/lib/quizzes/</code> in
		<a href="https://github.com/FlickerSoul/swift-quiz" target="_blank" rel="noopener noreferrer"
			>the repository</a
		> for examples and the README for the format.
	</p>
</div>
