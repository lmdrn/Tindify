import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { config } from '$lib/server/env';
import { fetchStudent } from '$lib/server/fortytwo';
import { checkState } from '$lib/server/oauthState';
import { createSession } from '$lib/server/session';
import { invalidate } from '$lib/server/matching';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	if (!code || !checkState(cookies, '42', url.searchParams.get('state'))) redirect(303, '/?error=oauth');

	let student: Awaited<ReturnType<typeof fetchStudent>>;
	try {
		student = await fetchStudent(code);
	} catch (e) {
		console.error('42 OAuth', e);
		redirect(303, '/?error=oauth');
	}
	if (!student) redirect(303, '/?error=campus');

	let user = db.select().from(schema.users).where(eq(schema.users.login, student.login)).get();
	if (!user) {
		user = db
			.insert(schema.users)
			.values({ login: student.login, campus: student.campus, isAdmin: student.login === config.fortyTwo.adminLogin })
			.returning()
			.get();
		invalidate();
	}
	createSession(cookies, user.id);

	const hasMusic = db.select({ id: schema.musicProfiles.userId }).from(schema.musicProfiles).where(eq(schema.musicProfiles.userId, user.id)).get();
	redirect(303, hasMusic ? '/' : '/quiz');
};
