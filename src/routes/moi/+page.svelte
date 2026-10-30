<script lang="ts">
	import { enhance } from '$app/forms';
	import { dicts } from '$lib/i18n';
	import PanelClose from '$lib/components/PanelClose.svelte';
	import { FINISHES, SKINS } from '$lib/types';
	import { skinPreview } from '$lib/preview.svelte';
	import { onDestroy } from 'svelte';

	let { data, form } = $props();
	const t = $derived(dicts[data.lang]);
	const user = $derived(data.user!);
	const fmt = (d: Date) =>
		new Intl.DateTimeFormat(data.lang === 'fr' ? 'fr-CH' : 'en-GB', { dateStyle: 'long', timeStyle: 'short' }).format(d);
	// en quittant la page sans enregistrer, le coeur reprend le skin enregistré
	onDestroy(() => {
		skinPreview.skin = null;
		skinPreview.finish = null;
	});
	const errorText = $derived(form?.error === 'spotify403' ? t.errors.spotify403 : form?.error === 'spotify' ? t.errors.spotify : null);
</script>

<section class="panel board">
	<PanelClose label={t.close} />
	<div class="k sign"><span>{t.me.title}</span><span>{user.login}</span></div>
	<h1 class="disp">{user.login}</h1>

	<form method="POST" action="?/skin" use:enhance class="grp">
		<h2 class="sign">{t.me.skin}</h2>
		<div class="choices">
			{#each SKINS as s (s)}
				<label><input type="radio" name="skin" value={s} checked={user.skin === s} onchange={() => (skinPreview.skin = s)} /><span>{t.me.skins[s]}</span></label>
			{/each}
		</div>
		<h2 class="sign">{t.me.finish}</h2>
		<div class="choices">
			{#each FINISHES as f (f)}
				<label><input type="radio" name="finish" value={f} checked={user.finish === f} onchange={() => (skinPreview.finish = f)} /><span>{t.me.finishes[f]}</span></label>
			{/each}
		</div>
		<div class="row">
			<button class="sign">{t.me.save}</button>
			{#if form?.saved}<span class="mute">{t.me.saved}</span>{/if}
		</div>
	</form>

	<div class="grp">
		<h2 class="sign">{t.me.spotify}</h2>
		{#if errorText}<p class="notice">{errorText}</p>{/if}
		{#if data.linked}
			<p>{t.me.linked} {#if data.updatedAt}{t.me.updated(fmt(data.updatedAt))}{/if}</p>
			<div class="row">
				<form method="POST" action="?/refresh" use:enhance><button class="sign">{t.me.refresh}</button></form>
				<form method="POST" action="?/unlink" use:enhance><button class="sign">{t.me.unlink}</button></form>
			</div>
		{:else}
			<div><a class="btn red sign" href="/auth/spotify" data-sveltekit-reload>{t.me.link}</a></div>
		{/if}
	</div>

	<form method="POST" action="?/logout" use:enhance><button class="sign">{t.logout}</button></form>

	<form method="POST" action="?/delete" class="grp danger" use:enhance>
		<h2 class="sign r">{t.me.danger}</h2>
		<p>{t.me.dangerText}</p>
		<label class="confirm"><span class="sign mute">{t.me.confirm}</span><input id="confirm" name="confirm" autocomplete="off" required /></label>
		<div><button class="red sign">{t.me.delete}</button></div>
	</form>
</section>

<style>
	.grp {
		display: grid;
		gap: 10px;
		border-top: 1px solid var(--ink);
		padding-top: 14px;
	}
	h2 {
		margin: 0;
	}
	.choices {
		display: flex;
		flex-wrap: wrap;
		padding: 1px 0 0 1px;
	}
	.choices label {
		margin: -1px 0 0 -1px;
		cursor: pointer;
	}
	.choices input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.choices span {
		display: block;
		border: 1px solid var(--ink);
		padding: 7px 12px;
		background: var(--board);
	}
	.choices input:checked + span {
		background: var(--blood);
		border-color: var(--blood);
		color: #fff;
		position: relative;
	}
	.choices input:focus-visible + span {
		outline: 2px solid var(--blood-hi);
		outline-offset: 2px;
	}
	.danger {
		border-top-color: var(--blood-hi);
	}
	.confirm {
		display: grid;
		gap: 6px;
	}
	input#confirm {
		font: inherit;
		border: 1px solid var(--ink);
		padding: 8px 10px;
		background: #fff;
		max-width: 280px;
	}
</style>
