<script lang="ts">
	import { dicts } from '$lib/i18n';
	import PanelClose from '$lib/components/PanelClose.svelte';

	let { data } = $props();
	const t = $derived(dicts[data.lang]);
</script>

<section class="panel board">
	<PanelClose label={t.close} />
	<div class="k sign"><span>{t.matches.label}</span></div>
	<h1 class="disp">{t.matches.title}</h1>
	{#if data.matches.length === 0}
		<p>{t.matches.none}</p>
	{/if}
	<div class="list">
		{#each data.matches as m, i (m.id)}
			<article class="match">
				<div class="disp pct" class:r={i === 0}>{m.compat}%</div>
				<div class="who">
					<strong>{m.login}</strong>
					{#if m.loveType}<span class="sign r">{t.types[m.loveType].name}</span>{/if}
				</div>
				<div class="why">
					{#if m.sharedArtists.length}{`${m.sharedArtists.slice(0, 3).join(', ')} · `}{/if}{t.matches.why[i % t.matches.why.length]}
				</div>
				<div class="stats">
					<div><b>{m.sharedArtists.length}</b><small>{t.matches.sharedArtists}</small></div>
					<div><b>{m.sharedGenres}</b><small>{t.matches.sharedGenres}</small></div>
					<div><b>{m.mainstreamGap ?? '—'}</b><small>{t.matches.gap}</small></div>
				</div>
			</article>
		{/each}
	</div>
	<p class="sign mute foot">{t.matches.foot}</p>
</section>

<style>
	.list {
		display: grid;
		gap: 16px;
	}
	.match {
		border-top: 1px solid var(--ink);
		padding-top: 12px;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 4px 16px;
	}
	.pct {
		font-size: 56px;
		font-variant-numeric: tabular-nums;
		grid-row: span 3;
		min-width: 2.2em;
	}
	.who {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 12px;
		align-items: baseline;
	}
	.who strong {
		font-size: 18px;
	}
	.why {
		color: var(--mute);
		font-size: 13px;
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		margin-top: 6px;
	}
	.stats div {
		border: 1px solid var(--line);
		padding: 6px 8px;
		min-width: 0;
	}
	.stats b {
		display: block;
		font-size: 18px;
		font-variant-numeric: tabular-nums;
	}
	.stats small {
		color: var(--mute);
		font-family: var(--sign);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 10px;
	}
	.foot {
		font-size: 11px;
		line-height: 1.6;
		letter-spacing: 0.08em;
	}
</style>
