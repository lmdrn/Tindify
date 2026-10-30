import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	const u = locals.user;
	const hasMusic =
		!!u && !!db.select({ id: schema.musicProfiles.userId }).from(schema.musicProfiles).where(eq(schema.musicProfiles.userId, u.id)).get();
	return {
		lang: locals.lang,
		user: u ? { id: u.id, login: u.login, skin: u.skin, finish: u.finish, loveType: u.loveType, hasMusic } : null
	};
};
