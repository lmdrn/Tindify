CREATE TABLE `music_profiles` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`stats` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `spotify_accounts` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`spotify_id` text NOT NULL,
	`refresh_token` text NOT NULL,
	`access_token` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`login` text NOT NULL,
	`campus` text,
	`is_admin` integer DEFAULT false NOT NULL,
	`is_fake` integer DEFAULT false NOT NULL,
	`skin` text DEFAULT 'none' NOT NULL,
	`finish` text DEFAULT 'or' NOT NULL,
	`love_type` text,
	`quiz_answers` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_login_unique` ON `users` (`login`);