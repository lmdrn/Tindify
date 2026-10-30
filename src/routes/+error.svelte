<script lang="ts">
	import { page } from '$app/state';
	import { dicts, isLang } from '$lib/i18n';

	const lang = $derived(isLang(page.data?.lang) ? page.data.lang : 'fr');
	const t = $derived(dicts[lang].errorPage);
	const msg = $derived(page.status === 404 ? t.notFound : page.status === 401 || page.status === 403 ? t.forbidden : t.server);
</script>

<svelte:head><title>{page.status} · Tindify</title></svelte:head>

<section class="err">
	<div class="disp code">{page.status}</div>
	<h1 class="disp">{msg.title}</h1>
	<p>{msg.body}</p>
	<a class="btn red sign" href="/">{t.back}</a>
</section>

<style>
	.err {
		position: fixed;
		z-index: 3;
		inset: 0;
		padding: 90px max(16px, env(safe-area-inset-right, 0px)) 24px max(16px, env(safe-area-inset-left, 0px));
		display: grid;
		place-content: center;
		justify-items: center;
		text-align: center;
		gap: 14px;
		pointer-events: none;
	}
	.err a {
		pointer-events: auto;
	}
	.code {
		font-size: clamp(120px, 22vw, 300px);
		color: var(--blood-hi);
		line-height: 0.8;
	}
	h1 {
		font-size: clamp(40px, 6vw, 88px);
	}
	p {
		margin: 0;
		font-size: 17px;
		max-width: 46ch;
		background: var(--board);
		border: 1px solid var(--ink);
		padding: 8px 14px;
	}
</style>
