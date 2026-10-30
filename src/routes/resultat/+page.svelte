<script lang="ts">
	import { dicts } from '$lib/i18n';
	import PanelClose from '$lib/components/PanelClose.svelte';
	import { LOVE_TYPES } from '$lib/types';

	let { data } = $props();
	const t = $derived(dicts[data.lang]);
	const type = $derived(t.types[data.loveType]);
	const a = $derived(data.axes);
</script>

<section class="panel board">
	<PanelClose label={t.close} />
	<div class="k sign"><span>{t.result.label}</span></div>
	<h1 class="disp code">{type.name}</h1>
	<p>{type.roast}</p>
	<div class="axes">
		<div class="ax">
			<div class="row2 sign"><span>{t.result.axes[0]}</span><span>{a.availability} %</span></div>
			<div class="bar"><span style="width:{a.availability}%"></span></div>
		</div>
		<div class="ax">
			<div class="row2 sign"><span>{t.result.axes[1]}</span><span>{a.redFlags} %</span></div>
			<div class="bar"><span class="hot" style="width:{a.redFlags}%"></span></div>
		</div>
		{#if a.mainstream !== null}
			<div class="ax">
				<div class="row2 sign"><span>{t.result.axes[2]}</span><span>{a.mainstream} %</span></div>
				<div class="bar"><span style="width:{a.mainstream}%"></span></div>
			</div>
		{/if}
		<div class="ax">
			<div class="row2 sign"><span>{t.result.axes[3]}</span><span>{t.result.days(a.replyDays)}</span></div>
			<div class="bar"><span class="hot" style="width:{Math.min(100, 8 + a.replyDays * 6)}%"></span></div>
		</div>
	</div>
	<div class="stamp sign">{t.result.stamp}</div>
	<div class="row">
		<a class="btn red sign" href="/matchs">{t.result.see}</a>
		<a class="btn sign" href="/quiz">{t.result.redo}</a>
	</div>
	<h2 class="sign mute all">{t.result.all}</h2>
	<div class="types">
		{#each LOVE_TYPES as k (k)}
			<div class:you={k === data.loveType}><b class="disp">{t.types[k].name}</b><small>{t.types[k].tag}</small></div>
		{/each}
	</div>
</section>

<style>
	.code {
		font-size: clamp(60px, 8.4vw, 128px);
		color: var(--blood-hi);
		overflow-wrap: anywhere;
	}
	.axes {
		display: grid;
		gap: 14px;
	}
	.row2 {
		display: flex;
		justify-content: space-between;
		gap: 10px;
	}
	.bar {
		height: 12px;
		background: #d4d4cf;
		margin-top: 5px;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--ink);
	}
	.bar span.hot {
		background: var(--blood-hi);
	}
	.stamp {
		justify-self: start;
		border: 3px solid var(--blood-hi);
		color: var(--blood-hi);
		padding: 4px 12px;
		transform: rotate(-3deg);
		font-size: 15px;
	}
	.all {
		margin: 8px 0 -8px;
		font-size: 12px;
	}
	.types {
		display: grid;
		grid-template-columns: 1fr 1fr;
		border-top: 1px solid var(--ink);
		border-left: 1px solid var(--ink);
	}
	.types div {
		border-right: 1px solid var(--ink);
		border-bottom: 1px solid var(--ink);
		padding: 9px 10px;
		min-width: 0;
	}
	.types b {
		display: block;
		font-size: 22px;
	}
	.types small {
		color: var(--mute);
		font-size: 12px;
	}
	.types .you {
		background: var(--ink);
		color: var(--board);
	}
	.types .you small {
		color: #bdbdb7;
	}
</style>
