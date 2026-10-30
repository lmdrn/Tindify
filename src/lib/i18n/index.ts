import fr from './fr';
import en from './en';

export const LANGS = ['fr', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const dicts = { fr, en };
export const isLang = (v: unknown): v is Lang => v === 'fr' || v === 'en';
