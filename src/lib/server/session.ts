import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { eq, lt } from 'drizzle-orm';
import { db, schema } from './db';
import { randomToken, sha256 } from './crypto';

const COOKIE = 'tindify_session';
const DAYS = 30;

export const cookieOptions = { path: '/', httpOnly: true, sameSite: 'lax', secure: !dev } as const;

export function createSession(cookies: Cookies, userId: number) {
	const token = randomToken();
	const expiresAt = new Date(Date.now() + DAYS * 864e5);
	db.insert(schema.sessions).values({ id: sha256(token), userId, expiresAt }).run();
	cookies.set(COOKIE, token, { ...cookieOptions, expires: expiresAt });
}

export function readSession(cookies: Cookies) {
	const token = cookies.get(COOKIE);
	if (!token) return null;
	const row = db
		.select({ user: schema.users, expiresAt: schema.sessions.expiresAt })
		.from(schema.sessions)
		.innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
		.where(eq(schema.sessions.id, sha256(token)))
		.get();
	if (!row || row.expiresAt.getTime() < Date.now()) {
		cookies.delete(COOKIE, { path: '/' });
		return null;
	}
	return row.user;
}

export function destroySession(cookies: Cookies) {
	const token = cookies.get(COOKIE);
	if (token) db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token))).run();
	cookies.delete(COOKIE, { path: '/' });
	db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date())).run();
}
