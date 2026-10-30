import { eq } from 'drizzle-orm';
import { db, schema } from './db';
import { config } from './env';
import { decrypt, encrypt } from './crypto';
import { computeStats, type Artist, type MusicData, type Track } from './music';

const SCOPES = 'user-top-read user-read-recently-played';
export const redirectUri = () => `${config.origin}/auth/spotify/callback`;

export function authorizeUrl(state: string) {
	const q = new URLSearchParams({
		client_id: config.spotify.uid,
		response_type: 'code',
		redirect_uri: redirectUri(),
		scope: SCOPES,
		state
	});
	return `https://accounts.spotify.com/authorize?${q}`;
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number };

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
	const res = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: 'Basic ' + Buffer.from(`${config.spotify.uid}:${config.spotify.secret}`).toString('base64')
		},
		body: new URLSearchParams(body)
	});
	if (!res.ok) throw new Error(`Spotify token ${res.status}`);
	return res.json();
}

export class SpotifyError extends Error {
	constructor(public status: number) {
		super(`Spotify API ${status}`);
	}
}

async function api<T>(token: string, path: string): Promise<T> {
	const res = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
	if (!res.ok) throw new SpotifyError(res.status);
	return res.json();
}

/** Échange le code OAuth, enregistre les tokens chiffrés et importe les données musicales. */
export async function linkAccount(userId: number, code: string) {
	const t = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri() });
	const me = await api<{ id: string }>(t.access_token, '/me');
	const row = {
		spotifyId: me.id,
		accessToken: encrypt(t.access_token),
		refreshToken: encrypt(t.refresh_token ?? ''),
		expiresAt: new Date(Date.now() + (t.expires_in - 60) * 1000)
	};
	db.insert(schema.spotifyAccounts)
		.values({ userId, ...row })
		.onConflictDoUpdate({ target: schema.spotifyAccounts.userId, set: row })
		.run();
	await syncMusic(userId);
}

async function validToken(userId: number): Promise<string | null> {
	const acc = db.select().from(schema.spotifyAccounts).where(eq(schema.spotifyAccounts.userId, userId)).get();
	if (!acc) return null;
	if (acc.expiresAt.getTime() > Date.now()) return decrypt(acc.accessToken);
	const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: decrypt(acc.refreshToken) });
	db.update(schema.spotifyAccounts)
		.set({
			accessToken: encrypt(t.access_token),
			...(t.refresh_token ? { refreshToken: encrypt(t.refresh_token) } : {}),
			expiresAt: new Date(Date.now() + (t.expires_in - 60) * 1000)
		})
		.where(eq(schema.spotifyAccounts.userId, userId))
		.run();
	return t.access_token;
}

type SArtist = { id: string; name: string; genres?: string[]; popularity?: number; images?: { url: string }[] };
type STrack = { name: string; artists: { name: string }[] };

// Certaines apps en mode développement refusent limit=50 : on retombe sur la limite par défaut.
async function top<T>(token: string, kind: 'artists' | 'tracks'): Promise<T[]> {
	try {
		return (await api<{ items: T[] }>(token, `/me/top/${kind}?limit=50&time_range=medium_term`)).items;
	} catch (e) {
		if (e instanceof SpotifyError && e.status === 400) return (await api<{ items: T[] }>(token, `/me/top/${kind}`)).items;
		throw e;
	}
}

export async function syncMusic(userId: number) {
	const token = await validToken(userId);
	if (!token) return;
	const [artists, tracks, recent] = await Promise.all([
		top<SArtist>(token, 'artists'),
		top<STrack>(token, 'tracks'),
		api<{ items: { track: STrack }[] }>(token, '/me/player/recently-played?limit=50')
			.then((r) => r.items.map((i) => i.track))
			.catch(() => [] as STrack[])
	]);
	const toTrack = (t: STrack): Track => ({ name: t.name, artist: t.artists[0]?.name ?? '?' });
	const data: MusicData = {
		artists: artists.map(
			(a): Artist => ({
				id: a.id,
				name: a.name,
				genres: a.genres ?? [],
				popularity: typeof a.popularity === 'number' ? a.popularity : null,
				image: a.images?.[0]?.url ?? null
			})
		),
		tracks: tracks.map(toTrack),
		recent: recent.map(toTrack)
	};
	const row = { data, stats: computeStats(data), updatedAt: new Date() };
	db.insert(schema.musicProfiles)
		.values({ userId, ...row })
		.onConflictDoUpdate({ target: schema.musicProfiles.userId, set: row })
		.run();
}

export function unlink(userId: number) {
	db.delete(schema.spotifyAccounts).where(eq(schema.spotifyAccounts.userId, userId)).run();
	db.delete(schema.musicProfiles).where(eq(schema.musicProfiles.userId, userId)).run();
}
