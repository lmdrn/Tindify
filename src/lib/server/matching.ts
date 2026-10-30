import { eq } from 'drizzle-orm';
import { db, schema } from './db';
import type { MusicData, MusicStats } from './music';
import type { LoveType, Network, NetworkNode } from '$lib/types';

// Compatibilité = cosinus entre deux profils pondérés.
// Poids d'un artiste : son rang (le n°1 compte plus que le n°40) × sa rareté sur le campus (IDF),
// pour qu'aimer le même artiste confidentiel pèse plus qu'aimer Daft Punk.

type Person = {
	id: number;
	login: string;
	loveType: LoveType | null;
	stats: MusicStats;
	artists: Map<string, number>; // clé artiste → poids de rang
	genres: Map<string, number>;
	names: Map<string, string>; // clé artiste → nom affiché
};
type Vec = Map<string, number>;

export type Match = {
	id: number;
	login: string;
	loveType: LoveType | null;
	compat: number;
	sharedArtists: string[];
	sharedGenres: number;
	mainstreamGap: number | null;
};

const rankWeight = (i: number) => 1 / Math.log2(i + 2);
const artistKey = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]/gu, '');

function toPerson(row: { id: number; login: string; loveType: LoveType | null; data: MusicData; stats: MusicStats }): Person {
	const artists: Vec = new Map(), genres: Vec = new Map(), names = new Map<string, string>();
	row.data.artists.forEach((a, i) => {
		const k = artistKey(a.name);
		if (!artists.has(k)) {
			artists.set(k, rankWeight(i));
			names.set(k, a.name);
		}
		for (const g of a.genres) genres.set(g, (genres.get(g) ?? 0) + rankWeight(i));
	});
	return { id: row.id, login: row.login, loveType: row.loveType, stats: row.stats, artists, genres, names };
}

function cosine(a: Vec, b: Vec, idf: Map<string, number>) {
	let dot = 0, na = 0, nb = 0;
	for (const [k, w] of a) {
		const x = w * (idf.get(k) ?? 1);
		na += x * x;
		const v = b.get(k);
		if (v !== undefined) dot += x * v * (idf.get(k) ?? 1);
	}
	for (const [k, w] of b) {
		const x = w * (idf.get(k) ?? 1);
		nb += x * x;
	}
	return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

function idfOf(vecs: Vec[]) {
	const df = new Map<string, number>();
	for (const v of vecs) for (const k of v.keys()) df.set(k, (df.get(k) ?? 0) + 1);
	const n = vecs.length;
	return new Map([...df].map(([k, d]) => [k, Math.log(1 + n / d)]));
}

type Model = { people: Person[]; aIdf: Map<string, number>; gIdf: Map<string, number>; at: number };
let cache: Model | null = null;
export const invalidate = () => (cache = null);

function model(): Model {
	if (cache && Date.now() - cache.at < 60_000) return cache;
	const rows = db
		.select({
			id: schema.users.id,
			login: schema.users.login,
			loveType: schema.users.loveType,
			data: schema.musicProfiles.data,
			stats: schema.musicProfiles.stats
		})
		.from(schema.users)
		.innerJoin(schema.musicProfiles, eq(schema.musicProfiles.userId, schema.users.id))
		.all();
	const people = rows.map(toPerson);
	cache = { people, aIdf: idfOf(people.map((p) => p.artists)), gIdf: idfOf(people.map((p) => p.genres)), at: Date.now() };
	return cache;
}

function score(m: Model, a: Person, b: Person): Match {
	const ac = cosine(a.artists, b.artists, m.aIdf);
	const gc = a.genres.size && b.genres.size ? cosine(a.genres, b.genres, m.gIdf) : ac;
	const raw = 0.7 * ac + 0.3 * gc;
	const shared = [...a.artists.keys()]
		.filter((k) => b.artists.has(k))
		.sort((x, y) => a.artists.get(y)! * b.artists.get(y)! - a.artists.get(x)! * b.artists.get(x)!);
	return {
		id: b.id,
		login: b.login,
		loveType: b.loveType,
		// racine : étale les scores vers le haut, sinon tout le monde est entre 5 et 30 %
		compat: Math.min(99, Math.round(100 * Math.sqrt(raw))),
		sharedArtists: shared.map((k) => a.names.get(k)!),
		sharedGenres: [...a.genres.keys()].filter((g) => b.genres.has(g)).length,
		mainstreamGap:
			a.stats.mainstream !== null && b.stats.mainstream !== null ? Math.abs(a.stats.mainstream - b.stats.mainstream) : null
	};
}

export function topMatches(userId: number, n = 5): Match[] {
	const m = model();
	const me = m.people.find((p) => p.id === userId);
	if (!me) return [];
	return m.people
		.filter((p) => p.id !== userId)
		.map((p) => score(m, me, p))
		.sort((x, y) => y.compat - x.compat)
		.slice(0, n);
}

/** Distribution de l'indice mainstream sur le campus, en 20 tranches de 5 points. */
export function mainstreamHistogram(): number[] {
	const bins = Array<number>(20).fill(0);
	for (const p of model().people) if (p.stats.mainstream !== null) bins[Math.min(19, Math.floor(p.stats.mainstream / 5))]++;
	return bins;
}

/** Le réseau autour du coeur : chaque personne est reliée à ses deux meilleures compatibilités. */
export function network(viewerId: number | null): Network {
	const m = model();
	const seen = new Set<string>();
	const links: [number, number][] = [];
	const viewer = viewerId === null ? undefined : m.people.find((p) => p.id === viewerId);
	for (const a of m.people) {
		const best = m.people
			.filter((b) => b.id !== a.id)
			.map((b) => ({ id: b.id, s: 0.7 * cosine(a.artists, b.artists, m.aIdf) + 0.3 * cosine(a.genres, b.genres, m.gIdf) }))
			.sort((x, y) => y.s - x.s)
			.slice(0, 2);
		for (const b of best) {
			const k = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
			if (!seen.has(k)) {
				seen.add(k);
				links.push([a.id, b.id]);
			}
		}
	}
	const nodes: NetworkNode[] = m.people.map((p) =>
		viewerId === null
			? { id: p.id }
			: {
					id: p.id,
					me: p.id === viewerId,
					login: p.login,
					loveType: p.loveType,
					top3: p.stats.top3,
					obsession: p.stats.obsession ? `${p.stats.obsession.track} · ${p.stats.obsession.artist}` : null,
					genre: p.stats.topGenre?.name ?? null,
					mainstream: p.stats.mainstream,
					compat: viewer && p.id !== viewerId ? score(m, viewer, p).compat : null
				}
	);
	return { nodes, links, total: nodes.length };
}
