import { count } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	total: db.select({ n: count() }).from(schema.musicProfiles).get()?.n ?? 0
});
