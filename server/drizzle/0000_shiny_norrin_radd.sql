CREATE TABLE `moisture_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`plant_id` text NOT NULL,
	`date` text NOT NULL,
	`level` text NOT NULL,
	`note` text,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plants` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`species_id` text NOT NULL,
	`nickname` text NOT NULL,
	`location` text NOT NULL,
	`added_date` text NOT NULL,
	`notes` text,
	`photo_url` text,
	`last_watered_date` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`species_id`) REFERENCES `species`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`jti` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `species` (
	`id` text PRIMARY KEY NOT NULL,
	`scientific_name` text NOT NULL,
	`difficulty` text NOT NULL,
	`ideal_moisture` text NOT NULL,
	`light` text NOT NULL,
	`water_hardness_tolerance` text NOT NULL,
	`cold_water_sensitive` integer NOT NULL,
	`watering_freq_min` integer NOT NULL,
	`watering_freq_max` integer NOT NULL,
	`temp_min` integer NOT NULL,
	`temp_max` integer NOT NULL,
	`safe_cats` integer NOT NULL,
	`safe_dogs` integer NOT NULL,
	`category` text NOT NULL,
	`subcategory` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `species_images` (
	`species_id` text PRIMARY KEY NOT NULL,
	`data` blob NOT NULL,
	`mime_type` text DEFAULT 'image/webp' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`species_id`) REFERENCES `species`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `species_translations` (
	`species_id` text NOT NULL,
	`lang` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`moisture_notes` text NOT NULL,
	`light_notes` text NOT NULL,
	`water_tips` text NOT NULL,
	`common_problems` text NOT NULL,
	PRIMARY KEY(`species_id`, `lang`),
	FOREIGN KEY (`species_id`) REFERENCES `species`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text,
	`lang` text DEFAULT 'en' NOT NULL,
	`water_profile` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `water_presets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`region` text NOT NULL,
	`level` text NOT NULL,
	`hardness_mg_l` real NOT NULL,
	`ph` real NOT NULL,
	`ca_mg_l` real NOT NULL,
	`mg_mg_l` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `watering_dates` (
	`id` text PRIMARY KEY NOT NULL,
	`plant_id` text NOT NULL,
	`date` text NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
