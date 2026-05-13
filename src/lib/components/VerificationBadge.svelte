<script lang="ts">
	import type { VerificationStatus } from '$lib/quiz/types';

	const { status }: { status: VerificationStatus } = $props();

	const REASON_LABEL: Record<
		Extract<VerificationStatus, { kind: 'skipped' }>['reason'],
		string
	> = {
		'multi-file': 'multi-file quiz',
		'non-deterministic': 'non-deterministic',
		'choice-mode': 'multiple-choice quiz',
		'no-cache': 'not cached',
		disabled: 'verification disabled'
	};

	const tooltip = $derived.by(() => {
		if (status.kind === 'verified') return `Verified on Swift ${status.version}`;
		if (status.kind === 'failed') {
			return `Failed on Swift ${status.version}:\n${status.details}`;
		}
		return `Not verified (${REASON_LABEL[status.reason]})`;
	});
</script>

<span class="badge {status.kind}" title={tooltip}>
	{#if status.kind === 'verified'}
		<span class="mark" aria-hidden="true">✓</span>
		<span>Swift {status.version}</span>
	{:else if status.kind === 'failed'}
		<span class="mark" aria-hidden="true">✗</span>
		<span>Swift {status.version}</span>
	{:else}
		<span>Not verified</span>
	{/if}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		font-variant-numeric: tabular-nums;
		border: 1px solid transparent;
		white-space: nowrap;
	}
	.mark {
		font-weight: 700;
	}
	.verified {
		color: var(--ok);
		background: var(--ok-bg);
		border-color: var(--ok);
	}
	.failed {
		color: var(--bad);
		background: var(--bad-bg);
		border-color: var(--bad);
	}
	.skipped {
		color: var(--fg-muted);
		background: var(--surface);
		border-color: var(--border);
	}
</style>
