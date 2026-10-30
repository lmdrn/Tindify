export const LOVE_TYPES = [
	'ghoster',
	'toxic',
	'situationship',
	'ex',
	'lovebomber',
	'standby',
	'main',
	'cluster'
] as const;
export type LoveType = (typeof LOVE_TYPES)[number];

export const SKINS = ['none', 'arrow', 'wings', 'halo', 'barbed', 'buoy'] as const;
export type Skin = (typeof SKINS)[number];

export const FINISHES = ['or', 'noir'] as const;
export type Finish = (typeof FINISHES)[number];

/** Ce que le client reçoit pour dessiner le réseau autour du coeur. */
export type NetworkNode = {
	id: number;
	me?: boolean;
	// présents uniquement pour les membres connectés
	login?: string;
	loveType?: LoveType | null;
	top3?: string[];
	obsession?: string | null;
	genre?: string | null;
	mainstream?: number | null;
	compat?: number | null;
};
export type Network = { nodes: NetworkNode[]; links: [number, number][]; total: number };
