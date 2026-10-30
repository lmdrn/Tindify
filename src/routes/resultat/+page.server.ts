import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { axes } from '$lib/server/personality';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(303, '/auth/42');
	if (!locals.user.loveType) redirect(303, '/quiz');
	const profile = db.select().from(schema.musicProfiles).where(eq(schema.musicProfiles.userId, locals.user.id)).get();
	return { loveType: locals.user.loveType, axes: axes(locals.user.loveType, profile?.stats ?? null, locals.user.id) };
};
