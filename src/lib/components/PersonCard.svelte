<script lang="ts">
	import type { Dict } from '$lib/i18n/fr';
	import type { NetworkNode } from '$lib/types';

	let { node, t, loggedIn, onclose }: { node: NetworkNode; t: Dict; loggedIn: boolean; onclose: () => void } = $props();
</script>

<aside class="card board" aria-live="polite">
	<button class="x" onclick={onclose} aria-label="×">×</button>
	{#if !loggedIn || !node.login}
		<p class="locked">{t.home.locked}</p>
		<a class="btn red sign" href="/auth/42" data-sveltekit-reload>{t.home.cta}</a>
	{:else}
		{#if node.me}<span class="sign r">{t.card.you}</span>{/if}
		<h2 class="disp">{node.login}</h2>
		<div class="sign type">{node.loveType ? t.types[node.loveType].name : t.card.noType}</div>
		<dl>
			<dt class="sign">{t.card.top3}</dt>
			<dd>
				<ol>
					{#each node.top3 ?? [] as a (a)}<li>{a}</li>{/each}
				</ol>
			</dd>
			{#if node.obsession}<dt class="sign">{t.card.obsession}</dt><dd>{node.obsession}</dd>{/if}
			{#if node.genre}<dt class="sign">{t.card.genre}</dt><dd>{node.genre}</dd>{/if}
			{#if node.mainstream !== null && node.mainstream !== undefined}<dt class="sign">{t.card.mainstream}</dt><dd>{node.mainstream} / 100</dd>{/if}
			{#if node.compat !== null && node.compat !== undefined}
				<dt class="sign">{t.card.compat}</dt>
				<dd>{node.compat} %<span class="meter"><span style="width:{node.compat}%"></span></span></dd>
			{/if}
		</dl>
	{/if}
</aside>

<style>
	.card {
		position: fixed;
		z-index: 4;
		right: max(16px, env(safe-area-inset-right, 0px));
		top: calc(84px + env(safe-area-inset-top, 0px));
		width: min(320px, calc(100% - 32px));
		padding: 16px 16px 18px;
	}
	h2 {
		font-size: 38px;
		overflow-wrap: anywhere;
	}
	.type {
		color: var(--blood-hi);
		margin-top: 4px;
	}
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 7px 14px;
		margin: 14px 0 0;
		font-size: 14px;
	}
	dt {
		color: var(--mute);
		padding-top: 2px;
		font-size: 11px;
	}
	dd {
		margin: 0;
		font-variant-numeric: tabular-nums;
		min-width: 0;
	}
	ol {
		margin: 0;
		padding-left: 1.2em;
	}
	.x {
		position: absolute;
		top: 8px;
		right: 8px;
		padding: 1px 8px;
	}
	.meter {
		display: block;
		height: 8px;
		background: #d4d4cf;
		margin-top: 5px;
	}
	.meter span {
		display: block;
		height: 100%;
		background: var(--blood-hi);
	}
	.locked {
		margin: 0 28px 14px 0;
	}
	@media (max-width: 760px) {
		.card {
			top: auto;
			bottom: max(16px, env(safe-area-inset-bottom, 0px));
		}
	}
</style>
