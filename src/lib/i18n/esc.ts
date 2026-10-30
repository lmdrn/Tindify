// Les titres du quiz sont rendus en HTML (pour le mot en rouge) : tout texte venant de Spotify passe par ici.
export const esc = (s: string) =>
	s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
