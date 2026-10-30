import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import type { MusicData, MusicStats } from '$lib/server/music';
import type { LoveType } from '$lib/types';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	login: text('login').notNull().unique(),
	campus: text('campus'),
	isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
	isFake: integer('is_fake', { mode: 'boolean' }).notNull().default(false),
	skin: text('skin').notNull().default('none'),
	finish: text('finish').notNull().default('or'),
	loveType: text('love_type').$type<LoveType>(),
	quizAnswers: text('quiz_answers', { mode: 'json' }).$type<number[]>(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

export const sessions = sqliteTable('sessions', {
	// sha256 du token stocké dans le cookie : une fuite de la base ne donne pas de session valide
	id: text('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const spotifyAccounts = sqliteTable('spotify_accounts', {
	userId: integer('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	spotifyId: text('spotify_id').notNull(),
	refreshToken: text('refresh_token').notNull(), // chiffré
	accessToken: text('access_token').notNull(), // chiffré
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const musicProfiles = sqliteTable('music_profiles', {
	userId: integer('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	data: text('data', { mode: 'json' }).$type<MusicData>().notNull(),
	stats: text('stats', { mode: 'json' }).$type<MusicStats>().notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export type User = typeof users.$inferSelect;
