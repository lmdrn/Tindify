<script lang="ts">
	import { enhance } from '$app/forms';
	import { dicts } from '$lib/i18n';
	import PanelClose from '$lib/components/PanelClose.svelte';

	let { data } = $props();
	const t = $derived(dicts[data.lang]);

	type Step =
		| { kind: 'exhibit'; title: string; body: string; chart?: boolean }
		| { kind: 'question'; index: number };

	const steps = $derived.by((): Step[] => {
		const s = data.stats;
		if (!s) return [];
		const ex: Step[] = [];
		if (s.top3[0]) ex.push({ kind: 'exhibit', ...t.quiz.topArtist(s.top3[0], s.topArtistTracks) });
		if (s.mainstream !== null) ex.push({ kind: 'exhibit', chart: true, ...t.quiz.mainstream(s.mainstream, data.lessNiche ?? 0, data.total ?? 1) });
		if (s.obsession) ex.push({ kind: 'exhibit', ...t.quiz.obsession(s.obsession.track, s.obsession.artist, s.obsession.plays) });
		if (s.topGenre && s.topGenre.share >= 0.15) ex.push({ kind: 'exhibit', ...t.quiz.genre(s.topGenre.name, s.topGenre.share) });
		return [...ex, ...t.quiz.questions.map((_, index): Step => ({ kind: 'question', index }))];
	});
	const exhibits = $derived(steps.filter((s) => s.kind === 'exhibit').length);

	let i = $state(0);
	let answers = $state<(number | null)[]>([null, null, null, null, null, null]);
	const step = $derived(steps[i]);
	const last = $derived(i === steps.length - 1);
	const histMax = $derived(Math.max(1, ...(data.histogram ?? [])));
	const myBin = $derived(data.stats?.mainstream != null ? Math.min(19, Math.floor(data.stats.mainstream / 5)) : -1);
	const errorText = $derived(
		data.error === 'spotify403' ? t.errors.spotify403 : data.error === 'spotify' ? t.errors.spotify : data.error === 'oauth' ? t.errors.oauth : null
	);
</script>

<section class="panel board">
	<PanelClose label={t.close} />
	{#if !data.stats}
		<div class="k sign"><span>{t.nav.quiz}</span></div>
		<h1 class="disp">{t.need.spotify}</h1>
		{#if errorText}<p class="notice">{errorText}</p>{/if}
		<div><a class="btn red sign" href="/auth/spotify" data-sveltekit-reload>{t.home.ctaSpotify}</a></div>
	{:else if step}
		{#key i}
			<div class="step">
				<div class="k sign">
					{#if step.kind === 'exhibit'}
						<span>{t.quiz.exhibit(i + 1, exhibits)}</span>
					{:else}
						<span>{t.quiz.question(step.index + 1, t.quiz.questions.length)}</span><span>{t.quiz.pick}</span>
					{/if}
				</div>

				{#if step.kind === 'exhibit'}
					<h1 class="disp">{@html step.title}</h1>
					{#if step.chart && data.histogram}
						<div>
							<div class="dist" aria-hidden="true">
								{#each data.histogram as v, b (b)}
									<span class:me={b === myBin} style="height:{(v / histMax) * 100}%"></span>
								{/each}
							</div>
							<div class="axis sign"><span>{t.quiz.axis0}</span><span>{t.quiz.axis1}</span></div>
						</div>
					{/if}
					<p>{step.body}</p>
				{:else}
					{@const q = t.quiz.questions[step.index]}
					<h1 class="disp q">{q.q}</h1>
					<div class="opts">
						{#each q.a as [label], a (a)}
							<button type="button" aria-pressed={answers[step.index] === a} onclick={() => (answers[step.index] = a)}>{label}</button>
						{/each}
					</div>
					{#if answers[step.index] !== null}<p class="notice">{q.a[answers[step.index]!][1]}</p>{/if}
				{/if}
			</div>
		{/key}

		{#if last}
			<form method="POST" use:enhance>
				<input type="hidden" name="answers" value={JSON.stringify(answers)} />
				<button class="red sign" disabled={answers.some((a) => a === null)}>{t.quiz.finish}</button>
			</form>
		{:else}
			<div>
				<button class="sign" disabled={step.kind === 'question' && answers[step.index] === null} onclick={() => i++}>{t.quiz.next}</button>
			</div>
		{/if}
	{/if}
</section>

<style>
	.step {
		display: grid;
		gap: 18px;
		animation: in 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}
	@keyframes in {
		from {
			opacity: 0;
			transform: translateY(14px);
			clip-path: inset(0 0 100% 0);
		}
		to {
			opacity: 1;
			transform: none;
			clip-path: inset(0 0 0 0);
		}
	}
	.q {
		font-size: clamp(32px, 4vw, 52px);
	}
	.dist {
		display: grid;
		grid-template-columns: repeat(20, 1fr);
		align-items: end;
		gap: 3px;
		height: 130px;
		border-bottom: 1px solid var(--ink);
	}
	.dist span {
		background: #b9b9b3;
		min-height: 1px;
	}
	.dist span.me {
		background: var(--blood-hi);
	}
	.axis {
		display: flex;
		justify-content: space-between;
		color: var(--mute);
		font-size: 11px;
		margin-top: 6px;
	}
	.opts {
		display: grid;
		grid-template-columns: 1fr 1fr;
		/* compense le -1px des boutons (bordures fusionnées) que le panneau défilant couperait */
		padding: 1px 0 0 1px;
	}
	.opts button {
		text-align: left;
		margin: -1px 0 0 -1px;
		padding: 14px;
		font-size: 14px;
	}
	.opts button[aria-pressed='true'] {
		background: var(--ink);
		color: var(--board);
		position: relative;
	}
	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	button:disabled:hover {
		background: var(--board);
		color: var(--ink);
	}
	button.red:disabled:hover {
		background: var(--blood);
		color: #fff;
	}
	@media (max-width: 560px) {
		.opts {
			grid-template-columns: 1fr;
		}
	}
</style>
