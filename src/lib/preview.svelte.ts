import type { Finish, Skin } from './types';

// Aperçu du skin choisi sur /moi, affiché sur le coeur avant l'enregistrement.
// null = afficher ce qui est enregistré.
export const skinPreview = $state<{ skin: Skin | null; finish: Finish | null }>({ skin: null, finish: null });
