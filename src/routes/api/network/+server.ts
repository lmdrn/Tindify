import { json } from '@sveltejs/kit';
import { network } from '$lib/server/matching';
import type { RequestHandler } from './$types';

// Visiteurs : positions anonymes seulement. Membres : logins, tops et compatibilité.
export const GET: RequestHandler = ({ locals }) =>
	json(network(locals.user?.id ?? null), { headers: { 'Cache-Control': 'private, no-store' } });
