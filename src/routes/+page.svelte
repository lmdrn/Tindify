<script lang="ts">
	import { page } from '$app/state';
	import { dicts } from '$lib/i18n';

	let { data } = $props();
	const t = $derived(dicts[data.lang]);
	const error = $derived(page.url.searchParams.get('error'));
	const errorText = $derived(error === 'campus' ? t.errors.campus : error === 'oauth' ? t.errors.oauth : null);
</script>

<section class="home">
	{#if errorText}<p class="notice board">{errorText}</p>{/if}
	<h1 class="disp">{@html t.home.title}</h1>
	<div class="meta sign">
		<span>{t.home.pool}</span>
		<span>{t.home.swimmers(data.total)}</span>
		<span>{t.home.depth}</span>
		<span class="hint">{t.home.hint}</span>
	</div>
	{#if !data.user}
		<a class="btn red sign cta" href="/auth/42" data-sveltekit-reload>{t.home.cta}</a>
	{:else if !data.user.hasMusic}
		<a class="btn red sign cta" href="/quiz">{t.home.ctaSpotify}</a>
	{:else if !data.user.loveType}
		<a class="btn red sign cta" href="/quiz">{t.home.ctaQuiz}</a>
	{:else}
		<a class="btn red sign cta" href="/matchs">{t.home.ctaMatches}</a>
	{/if}
</section>

<style>
	.home {
		position: fixed;
		z-index: 3;
		left: max(16px, env(safe-area-inset-left, 0px));
		bottom: max(22px, env(safe-area-inset-bottom, 0px));
		max-width: min(780px, calc(100% - 32px));
		pointer-events: none;
	}
	h1 {
		font-size: clamp(46px, 7.6vw, 112px);
	}
	.meta {
		margin-top: 14px;
		display: flex;
		flex-wrap: wrap;
		gap: 6px 18px;
		color: var(--mute);
	}
	.cta {
		pointer-events: auto;
		margin-top: 16px;
		padding: 13px 18px;
	}
	.notice {
		pointer-events: auto;
		margin: 0 0 16px;
		padding: 10px 14px;
		border-left: 4px solid var(--blood-hi);
		max-width: 52ch;
	}
	@media (max-width: 760px) {
		.hint {
			display: none;
		}
	}
</style>
