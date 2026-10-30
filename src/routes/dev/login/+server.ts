import { error, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { createSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

// En développement uniquement : se connecter en tant que faux profil (/dev/login?as=<login>) sans passer par 42.
export const GET: RequestHandler = ({ url, cookies }) => {
	if (!dev) error(404);
	const as = url.searchParams.get('as');
	const user = as
		? db.select().from(schema.users).where(eq(schema.users.login, as)).get()
		: db.select().from(schema.users).where(eq(schema.users.isFake, true)).get();
	if (!user?.isFake) error(404, 'Faux profil introuvable (lancer npm run seed)');
	createSession(cookies, user.id);
	redirect(303, '/');
};
