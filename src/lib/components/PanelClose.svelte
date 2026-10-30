<script lang="ts">
	let { label }: { label: string } = $props();
</script>

<a href="/" class="close" aria-label={label} title={label}>×</a>

<style>
	.close {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 34px;
		height: 34px;
		display: grid;
		place-items: center;
		border: 1px solid var(--ink);
		background: var(--board);
		text-decoration: none;
		font-size: 22px;
		line-height: 1;
	}
	.close:hover {
		background: var(--ink);
		color: var(--board);
	}
</style>
