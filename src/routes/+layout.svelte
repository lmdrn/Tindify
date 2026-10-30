<script lang="ts">
	import '@fontsource/big-shoulders-display/800';
	import '@fontsource/big-shoulders-display/900';
	import '@fontsource/barlow/400';
	import '@fontsource/barlow/600';
	import '@fontsource/barlow-semi-condensed/500';
	import '@fontsource/barlow-semi-condensed/600';
	import '../app.css';
	// préchargées pour que le titre ne change pas de police pendant le chargement
	import fontDisplay from '@fontsource/big-shoulders-display/files/big-shoulders-display-latin-900-normal.woff2?url';
	import fontSign from '@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-600-normal.woff2?url';
	import fontBody from '@fontsource/barlow/files/barlow-latin-400-normal.woff2?url';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { dicts } from '$lib/i18n';
	import type { PoolScene } from '$lib/scene/pool';
	import type { Finish, Network, NetworkNode, Skin } from '$lib/types';
	import PersonCard from '$lib/components/PersonCard.svelte';
	import { skinPreview } from '$lib/preview.svelte';

	let { data, children } = $props();
	const t = $derived(dicts[data.lang]);

	let canvas: HTMLCanvasElement;
	let pool = $state<PoolScene | null>(null);
	let selected = $state<NetworkNode | null>(null);
	let network = $state<Network | null>(null);
	let sceneReady = $state(false);
	let fontsReady = $state(false);

	const isHome = $derived(page.route.id === '/');
	// valeurs simples : les effets ne se relancent que si elles changent vraiment, pas à chaque navigation
	const userId = $derived(data.user?.id ?? null);
	const loveType = $derived(data.user?.loveType ?? null);
	const skin = $derived((skinPreview.skin ?? data.user?.skin ?? 'none') as Skin);
	const finish = $derived((skinPreview.finish ?? data.user?.finish ?? 'or') as Finish);

	async function switchLang(e: MouseEvent, l: 'fr' | 'en') {
		e.preventDefault();
		await fetch(`/lang?l=${l}`, { method: 'POST' });
		await invalidateAll();
	}
	const loggedIn = $derived(!!data.user);

	onMount(() => {
		let disposed = false;
		let scene: PoolScene | undefined;
		document.fonts.ready.then(() => (fontsReady = true));
		// filet de sécurité : la scène apparaît même si le réseau tarde
		const fallback = setTimeout(() => (sceneReady = true), 3000);
		// three.js n'est chargé que côté navigateur
		import('$lib/scene/pool').then(({ PoolScene }) => {
			if (disposed) return;
			scene = new PoolScene(canvas, {
				onSelect: (n) => (selected = n),
				onReady: () => (sceneReady = true),
				reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
			});
			pool = scene;
			if (import.meta.env.DEV) (window as unknown as { __pool: PoolScene }).__pool = scene;
		});
		return () => {
			disposed = true;
			clearTimeout(fallback);
			scene?.dispose();
		};
	});

	// le réseau dépend de la personne connectée (anonyme sinon)
	$effect(() => {
		void userId;
		void loveType;
		fetch('/api/network')
			.then((r) => r.json())
			.then((n: Network) => (network = n));
	});
	$effect(() => {
		if (pool && network) pool.setNetwork(network);
	});
	$effect(() => {
		pool?.setSkin(skin, finish);
	});
	$effect(() => {
		pool?.setPanel(!isHome);
	});
	$effect(() => {
		pool?.setRules(t.rulesTitle, t.rules);
	});
	$effect(() => {
		document.documentElement.lang = data.lang;
	});
</script>

<svelte:head>
	<title>Tindify</title>
	<meta name="description" content={t.home.title.replace(/<[^>]+>/g, '')} />
	{#each [fontDisplay, fontSign, fontBody] as href (href)}
		<link rel="preload" as="font" type="font/woff2" {href} crossorigin="anonymous" />
	{/each}
</svelte:head>

<canvas bind:this={canvas} class="gl" class:ready={sceneReady} aria-label={t.home.hint}></canvas>

<div class="ui" class:ready={fontsReady}>

<header class="top">
	<a href="/" class="disp logo">Tind<span class="r">i</span>fy</a>
	<nav aria-label="Tindify">
		{#if loggedIn}
			<a href="/quiz" aria-current={page.url.pathname === '/quiz' ? 'page' : undefined}>{t.nav.quiz}</a>
			<a href="/resultat" aria-current={page.url.pathname === '/resultat' ? 'page' : undefined}>{t.nav.result}</a>
			<a href="/matchs" aria-current={page.url.pathname === '/matchs' ? 'page' : undefined}>{t.nav.matches}</a>
		{/if}
	</nav>
	<div class="right">
		<a class="lang" href="/lang?l=fr&to={encodeURIComponent(page.url.pathname)}" aria-current={data.lang === 'fr' ? 'true' : undefined} onclick={(e) => switchLang(e, 'fr')}>FR</a>
		<a class="lang" href="/lang?l=en&to={encodeURIComponent(page.url.pathname)}" aria-current={data.lang === 'en' ? 'true' : undefined} onclick={(e) => switchLang(e, 'en')}>EN</a>
		{#if data.user}
			<a class="btn sign me" href="/moi" aria-current={page.url.pathname === '/moi' ? 'page' : undefined}>{data.user.login}</a>
		{:else}
			<a class="btn red sign" href="/auth/42" data-sveltekit-reload>{t.login}</a>
		{/if}
	</div>
</header>

{#if isHome && selected}
	<PersonCard node={selected} {t} {loggedIn} onclose={() => pool?.select(-1)} />
{/if}

{@render children()}
</div>

<style>
	.gl {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		height: 100dvh;
		display: block;
		cursor: grab;
		touch-action: none;
	}
	.gl {
		opacity: 0;
		transition: opacity 0.9s ease-out;
	}
	.gl.ready {
		opacity: 1;
	}
	/* le texte attend ses polices ; au pire il apparaît après 1,5 s même sans JavaScript */
	.ui {
		opacity: 0;
		animation: show 0s 1.5s forwards;
		transition: opacity 0.35s ease-out;
	}
	.ui.ready {
		opacity: 1;
		animation: none;
	}
	@keyframes show {
		to {
			opacity: 1;
		}
	}
	.gl:active {
		cursor: grabbing;
	}
	.top {
		position: fixed;
		z-index: 5;
		top: env(safe-area-inset-top, 0px);
		left: 0;
		right: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 22px;
		padding-block: 14px;
		padding-left: max(16px, env(safe-area-inset-left, 0px));
		padding-right: max(16px, env(safe-area-inset-right, 0px));
		pointer-events: none;
	}
	.top > * {
		pointer-events: auto;
	}
	.logo {
		font-size: 40px;
		text-decoration: none;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
	}
	nav a,
	.lang {
		font-family: var(--sign);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 12px;
		text-decoration: none;
		padding: 6px 11px;
		border: 1px solid var(--ink);
		margin-left: -1px;
		background: var(--board);
	}
	nav a[aria-current='page'],
	.lang[aria-current],
	.me[aria-current='page'] {
		background: var(--ink);
		color: var(--board);
	}
	.right {
		margin-left: auto;
		display: flex;
		align-items: center;
	}
	.right .btn {
		margin-left: 10px;
		padding: 6px 12px;
		font-size: 12px;
	}
</style>
