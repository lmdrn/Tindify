<script lang="ts">
	import { onMount } from 'svelte';
	import type { Dict } from '$lib/i18n/fr';

	let { t }: { t: Dict } = $props();
	let dialog: HTMLDialogElement;
	const KEY = 'tindify-onhold-seen';

	onMount(() => {
		// une fois par visite ; le stockage peut être bloqué (navigation privée)
		try {
			if (sessionStorage.getItem(KEY)) return;
		} catch {}
		dialog.showModal();
	});

	function close() {
		try {
			sessionStorage.setItem(KEY, '1');
		} catch {}
		dialog.close();
	}
</script>

<dialog bind:this={dialog} class="board" aria-labelledby="onhold-title" onclose={close}>
	<span class="sign r">{t.onHold.sign}</span>
	<h2 id="onhold-title" class="disp">{@html t.onHold.title}</h2>
	<p>{t.onHold.body}</p>
	<button class="red sign" onclick={close}>{t.onHold.ok}</button>
</dialog>

<style>
	dialog {
		max-width: min(440px, calc(100vw - 32px));
		padding: 26px 26px 22px;
		color: var(--ink);
	}
	dialog::backdrop {
		background: rgba(13, 13, 12, 0.45);
	}
	h2 {
		font-size: 48px;
		margin: 10px 0 14px;
	}
	p {
		margin: 0 0 20px;
		line-height: 1.45;
	}
</style>
