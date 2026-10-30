import { config } from './env';

export const redirectUri = () => `${config.origin}/auth/42/callback`;

export function authorizeUrl(state: string) {
	const q = new URLSearchParams({
		client_id: config.fortyTwo.uid,
		redirect_uri: redirectUri(),
		response_type: 'code',
		scope: 'public',
		state
	});
	return `https://api.intra.42.fr/oauth/authorize?${q}`;
}

type Me = { login: string; campus: { name: string }[]; campus_users?: { campus_id: number; is_primary: boolean }[] };

/** Retourne le login et le campus, ou null si la personne n'est pas du campus autorisé. */
export async function fetchStudent(code: string): Promise<{ login: string; campus: string } | null> {
	const tokenRes = await fetch('https://api.intra.42.fr/oauth/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'authorization_code',
			client_id: config.fortyTwo.uid,
			client_secret: config.fortyTwo.secret,
			code,
			redirect_uri: redirectUri()
		})
	});
	if (!tokenRes.ok) {
		// le corps contient seulement un code d'erreur OAuth (ex. invalid_client), jamais le secret
		const body = await tokenRes.json().catch(() => ({}));
		throw new Error(`42 token ${tokenRes.status} ${body.error ?? ''} ${body.error_description ?? ''}`.trim());
	}
	const { access_token } = await tokenRes.json();
	const meRes = await fetch('https://api.intra.42.fr/v2/me', { headers: { Authorization: `Bearer ${access_token}` } });
	if (!meRes.ok) throw new Error(`42 me ${meRes.status}`);
	const me: Me = await meRes.json();
	const campus = me.campus.find((c) => c.name.toLowerCase().includes(config.fortyTwo.campus));
	return campus ? { login: me.login, campus: campus.name } : null;
}
