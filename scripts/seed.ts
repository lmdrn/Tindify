// Faux profils pour tester le rendu et le matching sans vrais comptes.
//   npm run seed           → crée 150 profils (is_fake = 1)
//   npm run unseed         → les supprime
import { eq } from 'drizzle-orm';
import { db, schema } from '../src/lib/server/db';
import { computeStats, type Artist, type MusicData } from '../src/lib/server/music';
import { LOVE_TYPES, SKINS, FINISHES } from '../src/lib/types';

const N = Number(process.env.SEED_COUNT ?? 150);

if (process.argv.includes('--remove')) {
	const n = db.delete(schema.users).where(eq(schema.users.isFake, true)).run().changes;
	console.log(`${n} faux profils supprimés.`);
	process.exit(0);
}

type A = [name: string, genres: string[], popularity: number];
// Des « scènes » : chaque faux profil puise surtout dans une ou deux scènes, pour que les compatibilités aient du sens.
const SCENES: Record<string, A[]> = {
	rapfr: [
		['PNL', ['rap français', 'cloud rap'], 74], ['Jul', ['rap marseillais', 'rap français'], 78], ['Nekfeu', ['rap français'], 72],
		['Gazo', ['drill française', 'rap français'], 76], ['SCH', ['rap marseillais', 'rap français'], 75], ['Damso', ['rap belge', 'rap français'], 77],
		['Hamza', ['rap belge', 'trap'], 71], ['Laylow', ['rap français', 'cloud rap'], 68], ['Ninho', ['rap français'], 79], ['Tiakola', ['rap français', 'afro'], 73]
	],
	sadindie: [
		['Mitski', ['indie rock', 'sad indie'], 76], ['Phoebe Bridgers', ['indie folk', 'sad indie'], 70], ['Radiohead', ['art rock', 'alternative'], 80],
		['Big Thief', ['indie folk'], 58], ['Elliott Smith', ['sad indie', 'singer-songwriter'], 62], ['Weyes Blood', ['chamber pop'], 55],
		['Cocteau Twins', ['dream pop', 'shoegaze'], 57], ['Slowdive', ['shoegaze', 'dream pop'], 60], ['Alex G', ['indie rock', 'lo-fi'], 61], ['Adrianne Lenker', ['indie folk', 'sad indie'], 50]
	],
	hyperpop: [
		['Charli xcx', ['hyperpop', 'pop'], 82], ['SOPHIE', ['hyperpop', 'experimental'], 55], ['100 gecs', ['hyperpop'], 58],
		['Bladee', ['cloud rap', 'drain'], 62], ['Arca', ['experimental', 'electronic'], 50], ['Caroline Polachek', ['art pop'], 65],
		['Yung Lean', ['cloud rap'], 61], ['Ecco2k', ['drain', 'art pop'], 52], ['Oklou', ['art pop', 'electronic'], 48], ['Shygirl', ['club', 'hyperpop'], 54]
	],
	electro: [
		['Daft Punk', ['french house', 'electronic'], 81], ['Burial', ['uk garage', 'electronic'], 59], ['Aphex Twin', ['idm', 'electronic'], 64],
		['Justice', ['french house', 'electronic'], 68], ['Fred again..', ['house', 'electronic'], 77], ['Floating Points', ['electronic', 'jazz'], 52],
		['Jamie xx', ['uk garage', 'electronic'], 63], ['Bicep', ['house', 'electronic'], 65], ['Four Tet', ['electronic', 'idm'], 60], ['Kavinsky', ['synthwave', 'french house'], 66]
	],
	pop: [
		['Taylor Swift', ['pop'], 98], ['Dua Lipa', ['pop', 'dance pop'], 89], ['Angèle', ['pop belge', 'variété française'], 75],
		['Aya Nakamura', ['afro', 'pop urbaine'], 80], ['SZA', ['r&b', 'pop'], 88], ['Billie Eilish', ['pop', 'art pop'], 92],
		['Stromae', ['variété française', 'electronic'], 79], ['Sabrina Carpenter', ['pop'], 90], ['The Weeknd', ['r&b', 'pop'], 95], ['Lana Del Rey', ['art pop', 'sad indie'], 87]
	],
	rnb: [
		['Frank Ocean', ['r&b alternatif', 'r&b'], 84], ['Steve Lacy', ['r&b alternatif', 'neo soul'], 74], ['Daniel Caesar', ['r&b', 'neo soul'], 77],
		['Solange', ['r&b alternatif', 'neo soul'], 62], ['Kali Uchis', ['r&b', 'latin'], 81], ['Tems', ['afro', 'r&b'], 75],
		['Erykah Badu', ['neo soul'], 63], ['Sampha', ['r&b alternatif', 'electronic'], 58], ['Childish Gambino', ['r&b', 'hip hop'], 82], ['Bad Bunny', ['reggaeton', 'latin'], 94]
	],
	metal: [
		['Deftones', ['alternative metal', 'shoegaze'], 72], ['Gojira', ['metal', 'progressive metal'], 66], ['Sleep Token', ['metal', 'alternative metal'], 75],
		['Bring Me the Horizon', ['metalcore'], 77], ['Spiritbox', ['metalcore'], 64], ['Deafheaven', ['blackgaze', 'shoegaze'], 52],
		['Tool', ['progressive metal'], 70], ['System of a Down', ['alternative metal'], 80], ['Knocked Loose', ['hardcore', 'metalcore'], 60], ['Björk', ['art pop', 'experimental'], 66]
	]
};
const SCENE_KEYS = Object.keys(SCENES);
const SYL = ['ma', 'lo', 'ri', 'ke', 'tu', 'no', 'va', 'si', 'be', 'da', 'ro', 'ni', 'ze', 'pa', 'li', 'jo', 'mi', 'ga'];

let seed = 42;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = <T>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const shuffle = <T>(a: T[]) => a.map((x) => [rnd(), x] as const).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

let created = 0;
for (let i = 0; i < N; i++) {
	const main = pick(SCENE_KEYS);
	const second = pick(SCENE_KEYS);
	const pool: A[] = [...shuffle([...SCENES[main]]).slice(0, 8), ...shuffle([...SCENES[second]]).slice(0, 4), ...shuffle(Object.values(SCENES).flat()).slice(0, 4)];
	const seen = new Set<string>();
	const artists: Artist[] = pool
		.filter(([name]) => !seen.has(name) && seen.add(name))
		.map(([name, genres, pop]) => ({ id: `fake-${name}`, name, genres, popularity: Math.max(1, Math.min(100, pop + Math.round((rnd() - 0.5) * 6))), image: null }));
	const fav = artists[0].name;
	const tracks = Array.from({ length: 20 }, (_, k) => ({ name: `Morceau ${k + 1}`, artist: rnd() < 0.35 ? fav : pick(artists).name }));
	const loop = pick(tracks);
	const recent = Array.from({ length: 50 }, () => (rnd() < 0.15 ? loop : pick(tracks)));
	const data: MusicData = { artists, tracks, recent };

	const login = `${pick(SYL)}${pick(SYL)}${pick(SYL)}${pick(['', 'r', 'n', 't', 's'])}`.slice(0, 8) + (i % 10);
	const exists = db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.login, login)).get();
	if (exists) continue;
	const u = db
		.insert(schema.users)
		.values({
			login,
			campus: 'Lausanne',
			isFake: true,
			loveType: rnd() < 0.85 ? pick(LOVE_TYPES) : null,
			skin: pick(SKINS),
			finish: pick(FINISHES)
		})
		.returning()
		.get();
	db.insert(schema.musicProfiles).values({ userId: u.id, data, stats: computeStats(data), updatedAt: new Date() }).run();
	created++;
}
console.log(`${created} faux profils créés.`);
