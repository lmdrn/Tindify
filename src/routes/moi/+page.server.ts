import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { syncMusic, unlink, SpotifyError } from '$lib/server/spotify';
import { destroySession } from '$lib/server/session';
import { invalidate } from '$lib/server/matching';
import { FINISHES, SKINS } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(303, '/auth/42');
	const id = locals.user.id;
	const linked = !!db.select({ id: schema.spotifyAccounts.userId }).from(schema.spotifyAccounts).where(eq(schema.spotifyAccounts.userId, id)).get();
	const profile = db.select({ updatedAt: schema.musicProfiles.updatedAt }).from(schema.musicProfiles).where(eq(schema.musicProfiles.userId, id)).get();
	return { linked, updatedAt: profile?.updatedAt ?? null };
};

const need = (u: App.Locals['user']) => {
	if (!u) redirect(303, '/auth/42');
	return u;
};

export const actions: Actions = {
	skin: async ({ request, locals }) => {
		const u = need(locals.user);
		const f = await request.formData();
		const skin = String(f.get('skin')), finish = String(f.get('finish'));
		if (!(SKINS as readonly string[]).includes(skin) || !(FINISHES as readonly string[]).includes(finish)) return fail(400);
		db.update(schema.users).set({ skin, finish }).where(eq(schema.users.id, u.id)).run();
		return { saved: true };
	},
	refresh: async ({ locals }) => {
		const u = need(locals.user);
		try {
			await syncMusic(u.id);
		} catch (e) {
			return fail(502, { error: e instanceof SpotifyError && e.status === 403 ? 'spotify403' : 'spotify' });
		}
		invalidate();
		return { refreshed: true };
	},
	unlink: async ({ locals }) => {
		const u = need(locals.user);
		unlink(u.id);
		invalidate();
		return { unlinked: true };
	},
	logout: async ({ cookies }) => {
		destroySession(cookies);
		redirect(303, '/');
	},
	delete: async ({ request, locals, cookies }) => {
		const u = need(locals.user);
		if (String((await request.formData()).get('confirm')).trim() !== u.login) return fail(400, { confirmError: true });
		destroySession(cookies);
		db.delete(schema.users).where(eq(schema.users.id, u.id)).run(); // cascade : sessions, Spotify, données
		invalidate();
		redirect(303, '/');
	}
};
