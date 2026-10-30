import type { LoveType } from './types';

// Pour chaque question, le type amoureux que trahit chaque réponse (dans l'ordre des réponses).
// Les textes sont dans src/lib/i18n.
export const QUESTION_TYPES: LoveType[][] = [
	['ghoster', 'toxic', 'main', 'ex'],
	['lovebomber', 'ghoster', 'toxic', 'main'],
	['toxic', 'lovebomber', 'cluster', 'ex'],
	['main', 'cluster', 'situationship', 'lovebomber'],
	['situationship', 'standby', 'toxic', 'ghoster'],
	['cluster', 'standby', 'situationship', 'ex']
];
