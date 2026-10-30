import type { Cookies } from '@sveltejs/kit';
import { randomToken } from './crypto';
import { cookieOptions } from './session';

// Protection CSRF du flux OAuth : le state renvoyé par le fournisseur doit égaler le cookie posé avant le départ.
export function newState(cookies: Cookies, name: string) {
	const state = randomToken(24);
	cookies.set(`oauth_${name}`, state, { ...cookieOptions, maxAge: 600 });
	return state;
}

export function checkState(cookies: Cookies, name: string, received: string | null) {
	const expected = cookies.get(`oauth_${name}`);
	cookies.delete(`oauth_${name}`, { path: '/' });
	return !!expected && !!received && expected === received;
}
