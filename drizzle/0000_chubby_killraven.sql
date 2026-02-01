CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`auth_provider` text DEFAULT 'email' NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`city` text,
	`state` text,
	`date_of_birth` integer,
	`target_exam_date` integer,
	`newsletter_opted_in` integer DEFAULT false NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`study_streak` integer DEFAULT 0 NOT NULL,
	`last_study_date` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);