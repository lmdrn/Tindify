import { redirect } from '@sveltejs/kit';
import { topMatches } from '$lib/server/matching';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(303, '/auth/42');
	if (!locals.user.loveType) redirect(303, '/quiz');
	return { matches: topMatches(locals.user.id, 5) };
};
