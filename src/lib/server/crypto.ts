import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { config } from './env';

// AES-256-GCM : chiffré et authentifié (un token modifié en base ne se déchiffre pas).
export function encrypt(plain: string): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', config.encryptionKey, iv);
	const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
	return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.');
}

export function decrypt(payload: string): string {
	const [iv, tag, data] = payload.split('.').map((s) => Buffer.from(s, 'base64url'));
	const decipher = createDecipheriv('aes-256-gcm', config.encryptionKey, iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
