CREATE TABLE `plant_photos` (
	`plant_id` text PRIMARY KEY NOT NULL,
	`data` blob NOT NULL,
	`mime_type` text DEFAULT 'image/jpeg' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
