// Données musicales d'une personne et statistiques dérivées.
// Spotify ne fournit pas le temps d'écoute : on s'en tient aux tops et aux 50 dernières écoutes.

export type Artist = { id: string; name: string; genres: string[]; popularity: number | null; image: string | null };
export type Track = { name: string; artist: string };

export type MusicData = {
	artists: Artist[]; // classés, n°1 en premier
	tracks: Track[]; // top morceaux classés
	recent: Track[]; // dernières écoutes, plus récente en premier
};

export type MusicStats = {
	top3: string[];
	mainstream: number | null; // popularité moyenne des 20 premiers artistes, 0-100
	topGenre: { name: string; share: number } | null; // share : part des artistes du top portant ce genre
	obsession: { track: string; artist: string; plays: number } | null; // titre le plus répété dans les 50 dernières écoutes
	topArtistTracks: number; // nombre de top morceaux de l'artiste n°1
	distinctArtists: number;
};

export function computeStats(d: MusicData): MusicStats {
	const top20 = d.artists.slice(0, 20);
	const pops = top20.map((a) => a.popularity).filter((p): p is number => typeof p === 'number');
	const mainstream = pops.length >= 5 ? Math.round(pops.reduce((s, p) => s + p, 0) / pops.length) : null;

	const genreCount = new Map<string, number>();
	for (const a of d.artists) for (const g of new Set(a.genres)) genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
	const best = [...genreCount.entries()].sort((a, b) => b[1] - a[1])[0];
	const topGenre = best && d.artists.length ? { name: best[0], share: best[1] / d.artists.length } : null;

	const plays = new Map<string, { track: Track; n: number }>();
	for (const t of d.recent) {
		const k = `${t.name}\u0000${t.artist}`;
		const e = plays.get(k);
		if (e) e.n++;
		else plays.set(k, { track: t, n: 1 });
	}
	const rep = [...plays.values()].sort((a, b) => b.n - a.n)[0];
	const obsession = rep && rep.n >= 2 ? { track: rep.track.name, artist: rep.track.artist, plays: rep.n } : null;

	const first = d.artists[0]?.name;
	return {
		top3: d.artists.slice(0, 3).map((a) => a.name),
		mainstream,
		topGenre,
		obsession,
		topArtistTracks: first ? d.tracks.filter((t) => t.artist === first).length : 0,
		distinctArtists: new Set([...d.tracks, ...d.recent].map((t) => t.artist)).size
	};
}
