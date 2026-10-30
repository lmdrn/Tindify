import type { Handle } from '@sveltejs/kit';
import { readSession } from '$lib/server/session';
import { isLang } from '$lib/i18n';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = readSession(event.cookies);

	const cookieLang = event.cookies.get('lang');
	event.locals.lang = isLang(cookieLang)
		? cookieLang
		: (event.request.headers.get('accept-language') ?? '').toLowerCase().startsWith('en')
			? 'en'
			: 'fr';

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	return response;
};
