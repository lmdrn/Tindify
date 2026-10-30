import { LOVE_TYPES, type LoveType } from '$lib/types';
import { QUESTION_TYPES } from '$lib/quiz';
import type { MusicStats } from './music';

/** Chaque réponse vote pour un type ; les données d'écoute ajoutent un demi-vote pour départager. */
export function computeType(answers: number[], stats: MusicStats | null): LoveType {
	const score = new Map<LoveType, number>(LOVE_TYPES.map((t) => [t, 0]));
	answers.forEach((a, i) => {
		const t = QUESTION_TYPES[i]?.[a];
		if (t) score.set(t, score.get(t)! + 1);
	});
	const bump = (t: LoveType) => score.set(t, score.get(t)! + 0.5);
	if (stats) {
		if (stats.mainstream !== null && stats.mainstream >= 70) bump('main');
		if (stats.mainstream !== null && stats.mainstream < 35) bump('standby');
		if (stats.obsession && stats.obsession.plays >= 5) bump('ex');
		if (stats.topArtistTracks >= 8) bump('toxic');
		if (stats.distinctArtists >= 60) bump('lovebomber');
	}
	return [...score.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// Jauges du diagnostic : une base par type, légèrement décalée par les vraies données.
const BASE: Record<LoveType, [number, number, number]> = {
	ghoster: [12, 81, 4],
	toxic: [94, 88, 1],
	situationship: [41, 67, 9],
	ex: [58, 92, 0],
	lovebomber: [99, 74, 0],
	standby: [6, 38, 14],
	main: [27, 70, 2],
	cluster: [3, 55, 6]
};

export function axes(type: LoveType, stats: MusicStats | null, userId: number) {
	const jitter = ((userId * 2654435761) >>> 0) % 9;
	const [avail, flags, days] = BASE[type];
	return {
		availability: Math.max(1, Math.min(99, avail + jitter - 4)),
		redFlags: Math.max(1, Math.min(99, flags + (stats?.obsession?.plays ?? 0) - 2)),
		mainstream: stats?.mainstream ?? null,
		replyDays: days + (jitter % 3)
	};
}
