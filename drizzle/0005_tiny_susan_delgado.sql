CREATE TABLE `quiz_results` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_slug` text NOT NULL,
	`score` integer NOT NULL,
	`total_questions` integer NOT NULL,
	`best_streak` integer DEFAULT 0 NOT NULL,
	`completed_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
