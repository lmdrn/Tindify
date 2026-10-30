import { env } from '$env/dynamic/private';

function required(name: string): string {
	const v = env[name];
	if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
	return v;
}

export const config = {
	get origin() {
		return (env.ORIGIN ?? 'http://localhost:5173').replace(/\/$/, '');
	},
	get encryptionKey() {
		const key = Buffer.from(required('ENCRYPTION_KEY'), 'hex');
		if (key.length !== 32) throw new Error('ENCRYPTION_KEY doit faire 32 octets en hex (64 caractères)');
		return key;
	},
	fortyTwo: {
		get uid() {
			return required('UID_42');
		},
		get secret() {
			return required('SECRET_42');
		},
		get campus() {
			return (env.ALLOWED_CAMPUS ?? 'Lausanne').toLowerCase();
		},
		get adminLogin() {
			return env.ADMIN_LOGIN ?? '';
		}
	},
	spotify: {
		get uid() {
			return required('UID_SPOTI');
		},
		get secret() {
			return required('SECRET_SPOTI');
		}
	}
};
