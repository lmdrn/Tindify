import { redirect } from '@sveltejs/kit';
import { linkAccount, SpotifyError } from '$lib/server/spotify';
import { checkState } from '$lib/server/oauthState';
import { invalidate } from '$lib/server/matching';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
	if (!locals.user) redirect(303, '/auth/42');
	const code = url.searchParams.get('code');
	if (!code || !checkState(cookies, 'spotify', url.searchParams.get('state'))) redirect(303, '/quiz?error=oauth');
	try {
		await linkAccount(locals.user.id, code);
	} catch (e) {
		console.error('Spotify OAuth', e);
		redirect(303, `/quiz?error=${e instanceof SpotifyError && e.status === 403 ? 'spotify403' : 'spotify'}`);
	}
	invalidate();
	redirect(303, '/quiz');
};
