import type { User } from '$lib/server/db/schema';
import type { Lang } from '$lib/i18n';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			lang: Lang;
		}
	}
}

export {};
