import { redirect, type Cookies } from '@sveltejs/kit';
import { isLang } from '$lib/i18n';
import type { RequestHandler } from './$types';

const setLang = (cookies: Cookies, l: string | null) => {
	if (isLang(l)) cookies.set('lang', l, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 365 * 864e2 });
};

// Sans JavaScript : lien classique puis redirection.
export const GET: RequestHandler = ({ url, cookies }) => {
	setLang(cookies, url.searchParams.get('l'));
	const to = url.searchParams.get('to') ?? '/';
	// uniquement un chemin local, jamais une URL externe
	redirect(303, /^\/(?![/\\])/.test(to) ? to : '/');
};

// Avec JavaScript : on change juste le cookie, la page se met à jour sans recharger la piscine.
export const POST: RequestHandler = async ({ request, cookies }) => {
	setLang(cookies, new URL(request.url).searchParams.get('l'));
	return new Response(null, { status: 204 });
};
