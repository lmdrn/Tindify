import { redirect } from '@sveltejs/kit';
import { authorizeUrl } from '$lib/server/spotify';
import { newState } from '$lib/server/oauthState';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ cookies, locals }) => {
	if (!locals.user) redirect(303, '/auth/42');
	redirect(303, authorizeUrl(newState(cookies, 'spotify')));
};
