import type { LoveType } from '$lib/types';
import { esc } from './esc';

const fr = {
	nav: { home: 'Le bassin', quiz: 'Le quiz', result: 'Ton diagnostic', matches: 'Tes matchs', me: 'Mon compte' },
	login: 'Connexion 42',
	close: 'Fermer',
	logout: 'Déconnexion',
	home: {
		title: 'Ton <span class="r">Spotify</span> sait déjà avec qui tu vas finir.',
		pool: 'Bassin de 42 Lausanne',
		swimmers: (n: number) => `${n} nageur·se${n > 1 ? 's' : ''} fiché·e${n > 1 ? 's' : ''}`,
		depth: 'Profondeur 2,10 m',
		cta: 'Se connecter avec 42',
		ctaSpotify: 'Connecter Spotify',
		ctaQuiz: 'Passer le quiz',
		ctaMatches: 'Voir mes matchs',
		hint: 'Glisse pour tourner autour · clique un nageur',
		locked: 'Connecte-toi avec 42 pour voir qui nage ici.'
	},
	card: { you: 'Toi', top3: 'Top 3', obsession: 'Obsession', genre: 'Genre', mainstream: 'Mainstream', compat: 'Avec toi', noType: 'Pas encore diagnostiqué·e' },
	rules: ['Interdit de courir après quelqu\'un', 'Interdit de plonger dans ses sentiments', 'Douche obligatoire après un ghosting', 'Le maître-nageur ne te sauvera pas'],
	rulesTitle: 'Règlement du bassin',
	quiz: {
		exhibit: (i: number, n: number) => `Pièce à conviction ${String(i).padStart(2, '0')} / ${String(n).padStart(2, '0')}`,
		question: (i: number, n: number) => `Question ${String(i).padStart(2, '0')} / ${String(n).padStart(2, '0')}`,
		next: 'Pièce suivante',
		finish: 'Obtenir mon diagnostic',
		pick: 'Choisis une réponse, on juge.',
		topArtist: (name: string, tracks: number) => ({
			title: `Ton artiste n°1 est <span class="r">${esc(name)}</span>. On a prévenu tes futur·es ex.`,
			body:
				tracks > 1
					? `${name} occupe ${tracks} places de ton top morceaux. Ce n'est plus un goût musical, c'est une dépendance.`
					: `Et pourtant aucun de tes morceaux préférés n'est de ${name}. Tu aimes l'idée de ${name}, pas ${name}. Ça explique beaucoup de choses.`
		}),
		mainstream: (score: number, below: number, total: number) => ({
			title:
				score < 50
					? `Tu te crois <span class="r">underground</span>. Tu es à ${score} sur 100.`
					: `Tu écoutes ce que tout le monde écoute. <span class="r">${score}</span> sur 100.`,
			body:
				score < 50
					? `Plus niche que ${below} personne${below > 1 ? 's' : ''} sur ${total}. Tu peux les mépriser en silence, depuis le grand bain.`
					: `${total - below - 1} personne${total - below - 1 > 1 ? 's' : ''} sur ${total} ont plus de personnalité musicale que toi. Ta mère connaît tes artistes.`
		}),
		axis0: '0 · personne ne connaît',
		axis1: '100 · ta mère connaît',
		obsession: (track: string, artist: string, plays: number) => ({
			title: `<span class="r">${plays} fois</span> « ${esc(track)} » dans tes 50 dernières écoutes.`,
			body: `${artist} n'a rien demandé. Si tu fais ça à une chanson, imagine ce que tu fais à une personne.`
		}),
		genre: (name: string, share: number) => ({
			title: `${Math.round(share * 100)} % de tes artistes font du <span class="r">${esc(name)}</span>.`,
			body: 'On appelle ça un trait de caractère. Ou un cri à l\'aide.'
		}),
		questions: [
			{
				q: "Quelqu'un t'envoie une playlist « pour toi ». Tu fais quoi ?",
				a: [
					['Je lis les titres et je réponds « trop bien » sans écouter', 'Lu, pas écouté. On note.'],
					["Je l'écoute en boucle en analysant chaque parole", 'Tu as déjà choisi la chanson du mariage. Respire.'],
					['Je réponds avec une meilleure playlist', "Ce n'est pas de l'amour, c'est une compétition."],
					['Je la compare à celle que mon ex m\'avait faite', 'Ton ex ne pense pas à toi. Promis.']
				]
			},
			{
				q: 'Ton crush like ta story à 2 h du matin. Tu…',
				a: [
					['Réponds dans la minute avec trois messages', 'Trois messages. À 2 h. Calme.'],
					['Attends trois jours pour pas paraître desperate', 'Trois jours, puis jamais. On te connaît.'],
					['Fais une capture et analyses avec quatre ami·es', 'Le groupe « URGENT » a 214 messages non lus.'],
					['Changes la musique de ta story pour envoyer un message', 'Communiquer par chanson interposée. Très sain.']
				]
			},
			{
				q: 'Ta chanson de rupture préférée ?',
				a: [
					['Une balade triste, en boucle, la nuit', 'Tu ne veux pas guérir, tu veux une bande-son.'],
					["Un son qui tape, j'ai déjà quelqu'un d'autre", 'Deuil express. Livraison en 24 h.'],
					["J'ai pas de rupture, j'ai un cluster", 'Le seul lien stable de ta vie est le Wi-Fi de 42.'],
					['Celle de notre premier date, que je renvoie à l\'ex', '« Ça m\'a fait penser à toi ». Non.']
				]
			},
			{
				q: 'Le premier date idéal ?',
				a: [
					['Le concert de mon artiste préféré, on ne se parle pas', 'Tu ne cherches pas quelqu\'un, tu cherches un public.'],
					['Un appel Discord de six heures pendant qu\'on code', 'Romantique, si on aime les segfaults.'],
					['On verra, on se capte', '« On se capte » n\'est pas un plan. C\'est une fuite.'],
					['Un week-end à Paris, proposé au deuxième message', 'Au deuxième message. Tu vas faire peur à quelqu\'un.']
				]
			},
			{
				q: "Quelqu'un te dit « on n'a pas besoin de mettre un mot ». Tu…",
				a: [
					['Parfait, c\'est exactement ce que je voulais', 'Six mois sans mot, et ensuite ?'],
					['Pars. Je me concentre sur moi', 'Tu te concentres sur toi depuis 2021.'],
					['Mets un mot quand même, mais dans une chanson', 'Il ne l\'écoutera pas. Elle non plus.'],
					['Ne réponds plus jamais', 'Efficace. Glaçant, mais efficace.']
				]
			},
			{
				q: 'Vendredi soir, tu…',
				a: [
					['Es au cluster jusqu\'à 4 h', 'Le cluster ne t\'aimera jamais en retour.'],
					['Restes seul·e avec un vinyle et une tisane', 'Personne n\'est assez bien pour ta tisane.'],
					['Envoies « tu fais quoi » à trois personnes', 'Trois personnes, zéro intention.'],
					['Écris à l\'ex « juste pour savoir comment tu vas »', 'Tu sais très bien comment il ou elle va.']
				]
			}
		]
	},
	types: {
		ghoster: {
			name: 'Le Ghoster',
			tag: 'disparaît après le 3e message',
			roast: "Tu écoutes des chansons sur des gens qui disparaissent, et c'est toi qui disparais. Quatorze conversations ouvertes, zéro réponse en cours. Tu ne fuis pas l'amour, tu fuis les notifications."
		},
		toxic: {
			name: 'Le Romantique Toxique',
			tag: 'une chanson = un signe',
			roast: "Chaque morceau qui passe en aléatoire est un message de l'univers. Tu as déjà écrit trois lettres jamais envoyées et une playlist de 4 h pour quelqu'un qui ne connaît pas ton nom de famille."
		},
		situationship: {
			name: 'La Situationship',
			tag: '« pas besoin de mettre un mot »',
			roast: "Tu n'as pas de relation, tu as des « trucs ». Tout le monde sait que vous êtes ensemble sauf vous deux. Ton statut amoureux est « en cours de chargement » depuis huit mois."
		},
		ex: {
			name: "L'Ex Qui Revient",
			tag: '« tu me manques » à 2 h',
			roast: 'Tu as supprimé son numéro, mais tu le connais par coeur. Ta playlist « on avance » contient exclusivement des chansons sur le fait de ne pas avancer.'
		},
		lovebomber: {
			name: 'Le Love-Bomber',
			tag: 'playlist commune au jour 2',
			roast: "Jour 1 : un like. Jour 2 : une playlist commune. Jour 3 : tu parles d'adopter un chat. Jour 4 : tu ne sais plus son prénom. Tu aimes vite, fort, et très peu longtemps."
		},
		standby: {
			name: 'Le Coeur en Veille',
			tag: '« je me concentre sur moi »',
			roast: "Tu te protèges. De quoi, personne ne sait. Ton coeur est en mode avion depuis la piscine de 2021, et tu appelles ça « travailler sur toi »."
		},
		main: {
			name: 'Le Main Character',
			tag: 'vit dans un clip, toi tu es figurant·e',
			roast: "Chaque trajet en bus est un clip et chaque personne que tu croises est figurante. Tu ne cherches pas l'amour, tu cherches quelqu'un pour tenir la caméra."
		},
		cluster: {
			name: 'Le Fantôme du Cluster',
			tag: 'connecté·e 14 h par jour, jamais là',
			roast: "Tu vis à 42, tu dors à 42, tu écoutes de la musique pour ne pas entendre les autres à 42. Ta relation la plus longue est avec un projet qui ne compile pas."
		}
	} satisfies Record<LoveType, { name: string; tag: string; roast: string }>,
	result: {
		label: 'Ton type amoureux',
		axes: ['Disponibilité émotionnelle', 'Red flags musicaux', 'Mainstream', 'Délai de réponse estimé'],
		days: (n: number) => `${n} jour${n > 1 ? 's' : ''}`,
		stamp: 'Interdit de plonger dans tes sentiments',
		see: 'Voir qui va te supporter',
		redo: 'Refaire le quiz',
		all: 'Les 8 types'
	},
	matches: {
		label: 'Classement du bassin',
		title: 'Tes 5 meilleures erreurs',
		sharedArtists: 'artistes communs',
		sharedGenres: 'genres communs',
		gap: 'écart mainstream',
		why: [
			'Vous pleurez sur les mêmes chansons, mais pas pour la même personne.',
			'Assez proches pour vous plaire, assez flous pour ne jamais rien décider.',
			'Même playlist, mêmes problèmes. Bon courage.',
			'Meilleur goût que toi, et parfaitement au courant.',
			'Assez en commun pour gâcher trois mois.'
		],
		none: 'Personne en commun. Même la piscine te trouve bizarre.',
		foot: 'Score = artistes et genres en commun, pondérés par leur rang. Les artistes très connus comptent moins : aimer Daft Punk ne fait pas de vous des âmes soeurs.'
	},
	me: {
		title: 'Mon compte',
		skin: 'Skin du coeur',
		finish: 'Finition',
		skins: { none: 'Aucun', arrow: 'Flèche', wings: 'Ailes', halo: 'Auréole', barbed: 'Barbelés', buoy: 'Bouée' },
		finishes: { or: 'Or', noir: 'Noir' },
		save: 'Enregistrer',
		saved: 'Enregistré.',
		spotify: 'Spotify',
		linked: 'Compte Spotify relié.',
		updated: (d: string) => `Données mises à jour le ${d}.`,
		refresh: 'Mettre à jour mes données',
		unlink: 'Délier Spotify',
		link: 'Connecter Spotify',
		danger: 'Supprimer mon compte',
		dangerText: 'Supprime ton profil, tes données Spotify et ton diagnostic. Irréversible.',
		confirm: 'Tape ton login pour confirmer',
		delete: 'Supprimer définitivement'
	},
	need: {
		login: 'Connecte-toi avec 42 pour continuer.',
		spotify: 'Connecte ton Spotify : on a besoin de preuves.',
		quiz: 'Passe le quiz d\'abord. On ne diagnostique pas sans examen.'
	},
	errors: {
		campus: 'Réservé aux étudiant·es de 42 Lausanne. Le bassin est privé.',
		oauth: 'La connexion a échoué. Réessaie.',
		spotify403: "Spotify refuse l'accès : en mode développement, ton compte Spotify doit être ajouté à la liste des testeurs de l'app.",
		spotify: 'Spotify ne répond pas. Réessaie dans un moment.'
	},
	errorPage: {
		notFound: { title: 'Grand bain, mauvais couloir.', body: "Cette page n'existe pas. Comme ta dernière relation." },
		forbidden: { title: 'Accès au bassin refusé.', body: "Tu n'as pas le droit d'être ici. Le maître-nageur te regarde." },
		server: { title: 'Bassin fermé pour vidange.', body: 'Erreur de notre côté. On remet de l\'eau, réessaie dans un moment.' },
		back: 'Retour au bassin'
	},
	sampleLegend: 'données d\'exemple',
	onHold: {
		sign: 'Avis aux nageur·ses',
		title: 'Projet <span class="r">en pause</span> :(',
		body: "Malheureusement, Spotify n'autorise plus les petits projets à utiliser son API : seule une poignée de personnes peut connecter son compte. Tu peux quand même te balader dans le bassin.",
		ok: "D'accord"
	}
};

export default fr;
export type Dict = typeof fr;
