import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { mainstreamHistogram, invalidate } from '$lib/server/matching';
import { computeType } from '$lib/server/personality';
import { QUESTION_TYPES } from '$lib/quiz';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.user) redirect(303, '/auth/42');
	const profile = db.select().from(schema.musicProfiles).where(eq(schema.musicProfiles.userId, locals.user.id)).get();
	if (!profile) return { stats: null, error: url.searchParams.get('error') };

	const others = db.select({ stats: schema.musicProfiles.stats }).from(schema.musicProfiles).all();
	const me = profile.stats.mainstream;
	return {
		stats: profile.stats,
		histogram: mainstreamHistogram(),
		lessNiche: me === null ? 0 : others.filter((o) => o.stats.mainstream !== null && o.stats.mainstream > me).length,
		total: others.length,
		error: url.searchParams.get('error')
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/auth/42');
		let answers: unknown;
		try {
			answers = JSON.parse(String((await request.formData()).get('answers')));
		} catch {
			return fail(400);
		}
		const valid =
			Array.isArray(answers) &&
			answers.length === QUESTION_TYPES.length &&
			answers.every((a, i) => Number.isInteger(a) && a >= 0 && a < QUESTION_TYPES[i].length);
		if (!valid) return fail(400);

		const profile = db.select().from(schema.musicProfiles).where(eq(schema.musicProfiles.userId, locals.user.id)).get();
		const loveType = computeType(answers as number[], profile?.stats ?? null);
		db.update(schema.users).set({ loveType, quizAnswers: answers as number[] }).where(eq(schema.users.id, locals.user.id)).run();
		invalidate();
		redirect(303, '/resultat');
	}
};
