<svelte:head>
	<title>About · Swift Quiz</title>
</svelte:head>

<h1>About</h1>

<div class="prose">
	<p>
		Swift Quiz is a collection of short, tricky Swift programs. Each one has a single twist —
		something about how the language actually behaves that may not match what you'd guess at a
		glance. Predict the output, then read the explanation.
	</p>

	<p>It's modeled after Rust Quiz by David Tolnay.</p>

	<h2>Privacy</h2>
	<p>
		Your progress (which quizzes you've attempted and solved) is stored only in your browser's
		<code>localStorage</code>. Nothing is sent to a server. Clear it any time from the
		<a href="/history">History</a> page.
	</p>

	<h2>Authoring</h2>
	<p>
		Each quiz is a Markdown file plus a folder of Swift source. See
		<code>src/lib/quizzes/</code> in the repository for examples and the README for the format.
	</p>
</div>
