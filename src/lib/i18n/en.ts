import type { Dict } from './fr';
import { esc } from './esc';

const en: Dict = {
	nav: { home: 'The pool', quiz: 'The quiz', result: 'Your diagnosis', matches: 'Your matches', me: 'My account' },
	login: 'Log in with 42',
	close: 'Close',
	logout: 'Log out',
	home: {
		title: 'Your <span class="r">Spotify</span> already knows who you will end up with.',
		pool: '42 Lausanne pool',
		swimmers: (n: number) => `${n} swimmer${n > 1 ? 's' : ''} on file`,
		depth: 'Depth 2.10 m',
		cta: 'Log in with 42',
		ctaSpotify: 'Connect Spotify',
		ctaQuiz: 'Take the quiz',
		ctaMatches: 'See my matches',
		hint: 'Drag to orbit · click a swimmer',
		locked: 'Log in with 42 to see who swims here.'
	},
	card: { you: 'You', top3: 'Top 3', obsession: 'Obsession', genre: 'Genre', mainstream: 'Mainstream', compat: 'With you', noType: 'Not diagnosed yet' },
	rules: ['No running after anyone', 'No diving into your feelings', 'Shower required after ghosting', 'The lifeguard will not save you'],
	rulesTitle: 'Pool rules',
	quiz: {
		exhibit: (i: number, n: number) => `Exhibit ${String(i).padStart(2, '0')} / ${String(n).padStart(2, '0')}`,
		question: (i: number, n: number) => `Question ${String(i).padStart(2, '0')} / ${String(n).padStart(2, '0')}`,
		next: 'Next exhibit',
		finish: 'Get my diagnosis',
		pick: 'Pick an answer. We judge.',
		topArtist: (name: string, tracks: number) => ({
			title: `Your #1 artist is <span class="r">${esc(name)}</span>. We warned your future exes.`,
			body:
				tracks > 1
					? `${name} holds ${tracks} spots in your top tracks. That is not taste, that is a dependency.`
					: `Yet none of your top tracks are by ${name}. You love the idea of ${name}, not ${name}. That explains a lot.`
		}),
		mainstream: (score: number, below: number, total: number) => ({
			title:
				score < 50
					? `You think you are <span class="r">underground</span>. You score ${score} out of 100.`
					: `You listen to what everyone listens to. <span class="r">${score}</span> out of 100.`,
			body:
				score < 50
					? `More niche than ${below} out of ${total}. You may silently judge them from the deep end.`
					: `${total - below - 1} out of ${total} have more musical personality than you. Your mom knows your artists.`
		}),
		axis0: '0 · nobody knows them',
		axis1: '100 · your mom knows them',
		obsession: (track: string, artist: string, plays: number) => ({
			title: `<span class="r">${plays} times</span> "${esc(track)}" in your last 50 plays.`,
			body: `${artist} did not ask for this. If you do that to a song, imagine what you do to a person.`
		}),
		genre: (name: string, share: number) => ({
			title: `${Math.round(share * 100)}% of your artists make <span class="r">${esc(name)}</span>.`,
			body: 'Some call it a personality trait. Others call it a cry for help.'
		}),
		questions: [
			{
				q: 'Someone sends you a playlist "for you". What do you do?',
				a: [
					['Read the titles and reply "love it" without listening', 'Read, not played. Noted.'],
					['Loop it and analyse every lyric', 'You already picked the wedding song. Breathe.'],
					['Reply with a better playlist', 'That is not love, that is a competition.'],
					['Compare it to the one my ex made me', 'Your ex is not thinking about you. Promise.']
				]
			},
			{
				q: 'Your crush likes your story at 2 am. You…',
				a: [
					['Reply within a minute, three messages', 'Three messages. At 2 am. Easy.'],
					['Wait three days so you don\'t look desperate', 'Three days, then never. We know you.'],
					['Screenshot it and debrief with four friends', 'The "URGENT" group chat has 214 unread messages.'],
					['Change your story song to send a message', 'Communicating through songs. Very healthy.']
				]
			},
			{
				q: 'Your favourite breakup song?',
				a: [
					['A sad ballad, on loop, at night', 'You don\'t want to heal, you want a soundtrack.'],
					['A banger, I already have someone else', 'Express mourning. 24-hour delivery.'],
					['No breakups, I have a cluster', 'The only stable bond in your life is the 42 Wi-Fi.'],
					['Our first-date song, which I send to my ex', '"Made me think of you." No.']
				]
			},
			{
				q: 'The ideal first date?',
				a: [
					['My favourite artist\'s concert, no talking', 'You are not looking for someone, you are looking for an audience.'],
					['A six-hour Discord call while we code', 'Romantic, if you are into segfaults.'],
					['We\'ll see, let\'s link up', '"Let\'s link up" is not a plan. It is an escape route.'],
					['A weekend in Paris, offered on message two', 'Message two. You are going to scare someone.']
				]
			},
			{
				q: 'Someone says "we don\'t need a label". You…',
				a: [
					['Perfect, exactly what I wanted', 'Six months with no label, and then?'],
					['Leave. I\'m focusing on myself', 'You have been focusing on yourself since 2021.'],
					['Put a label on it anyway, in a song', 'They will not listen to it.'],
					['Never reply again', 'Efficient. Chilling, but efficient.']
				]
			},
			{
				q: 'Friday night, you…',
				a: [
					['Are at the cluster until 4 am', 'The cluster will never love you back.'],
					['Stay home with a record and herbal tea', 'Nobody is good enough for your tea.'],
					['Text "wyd" to three people', 'Three people, zero intentions.'],
					['Text the ex "just checking how you are"', 'You know exactly how they are.']
				]
			}
		]
	},
	types: {
		ghoster: {
			name: 'The Ghoster',
			tag: 'gone after message 3',
			roast: 'You listen to songs about people who vanish, and you are the one who vanishes. Fourteen open chats, zero replies in progress. You are not running from love, you are running from notifications.'
		},
		toxic: {
			name: 'The Toxic Romantic',
			tag: 'every song is a sign',
			roast: 'Every track on shuffle is a message from the universe. You have written three letters you never sent and a four-hour playlist for someone who does not know your last name.'
		},
		situationship: {
			name: 'The Situationship',
			tag: '"we don\'t need a label"',
			roast: 'You do not have relationships, you have "things". Everyone knows you are together except the two of you. Your relationship status has been "loading" for eight months.'
		},
		ex: {
			name: 'The Ex Who Returns',
			tag: '"miss you" at 2 am',
			roast: 'You deleted their number, but you know it by heart. Your "moving on" playlist is exclusively songs about not moving on.'
		},
		lovebomber: {
			name: 'The Love-Bomber',
			tag: 'shared playlist on day 2',
			roast: 'Day 1: a like. Day 2: a shared playlist. Day 3: you talk about adopting a cat. Day 4: you forget their name. You love fast, hard, and very briefly.'
		},
		standby: {
			name: 'The Standby Heart',
			tag: '"focusing on myself"',
			roast: 'You are protecting yourself. From what, nobody knows. Your heart has been in airplane mode since the 2021 piscine, and you call it "working on yourself".'
		},
		main: {
			name: 'The Main Character',
			tag: 'lives in a music video, you are an extra',
			roast: 'Every bus ride is a music video and everyone you pass is an extra. You are not looking for love, you are looking for someone to hold the camera.'
		},
		cluster: {
			name: 'The Cluster Ghost',
			tag: 'online 14 h a day, never there',
			roast: 'You live at 42, sleep at 42, and listen to music so you cannot hear anyone at 42. Your longest relationship is with a project that does not compile.'
		}
	},
	result: {
		label: 'Your love type',
		axes: ['Emotional availability', 'Musical red flags', 'Mainstream', 'Estimated reply time'],
		days: (n: number) => `${n} day${n > 1 ? 's' : ''}`,
		stamp: 'No diving into your feelings',
		see: 'See who can stand you',
		redo: 'Retake the quiz',
		all: 'All 8 types'
	},
	matches: {
		label: 'Pool rankings',
		title: 'Your 5 best mistakes',
		sharedArtists: 'shared artists',
		sharedGenres: 'shared genres',
		gap: 'mainstream gap',
		why: [
			'You cry to the same songs, just not about the same person.',
			'Close enough to like each other, vague enough to never decide.',
			'Same playlist, same problems. Good luck.',
			'Better taste than you, and fully aware of it.',
			'Enough in common to ruin three months.'
		],
		none: 'Nobody in common. Even the pool finds you weird.',
		foot: 'Score = shared artists and genres, weighted by rank. Huge artists count less: liking Daft Punk does not make you soulmates.'
	},
	me: {
		title: 'My account',
		skin: 'Heart skin',
		finish: 'Finish',
		skins: { none: 'None', arrow: 'Arrow', wings: 'Wings', halo: 'Halo', barbed: 'Barbed wire', buoy: 'Swim ring' },
		finishes: { or: 'Gold', noir: 'Black' },
		save: 'Save',
		saved: 'Saved.',
		spotify: 'Spotify',
		linked: 'Spotify account linked.',
		updated: (d: string) => `Data updated on ${d}.`,
		refresh: 'Refresh my data',
		unlink: 'Unlink Spotify',
		link: 'Connect Spotify',
		danger: 'Delete my account',
		dangerText: 'Deletes your profile, your Spotify data and your diagnosis. Cannot be undone.',
		confirm: 'Type your login to confirm',
		delete: 'Delete permanently'
	},
	need: {
		login: 'Log in with 42 to continue.',
		spotify: 'Connect your Spotify: we need evidence.',
		quiz: 'Take the quiz first. No diagnosis without an exam.'
	},
	errors: {
		campus: 'For 42 Lausanne students only. This pool is private.',
		oauth: 'Login failed. Try again.',
		spotify403: 'Spotify refused access: in development mode, your Spotify account must be on the app\'s tester list.',
		spotify: 'Spotify is not responding. Try again later.'
	},
	errorPage: {
		notFound: { title: 'Deep end, wrong lane.', body: 'This page does not exist. Like your last relationship.' },
		forbidden: { title: 'Pool access denied.', body: 'You are not allowed here. The lifeguard is watching.' },
		server: { title: 'Pool closed for draining.', body: 'Something broke on our side. We are refilling it, try again in a moment.' },
		back: 'Back to the pool'
	},
	sampleLegend: 'sample data',
	onHold: {
		sign: 'Notice to swimmers',
		title: 'Project <span class="r">on hold</span> :(',
		body: 'Unfortunately, Spotify no longer lets small projects use its API: only a handful of people can connect their account. You can still float around the pool.',
		ok: 'Got it'
	}
};

export default en;
