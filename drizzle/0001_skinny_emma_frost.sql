ALTER TABLE `shopping_items` ADD `category` text;--> statement-breakpoint
ALTER TABLE `shopping_lists` ADD `budget` real;--> statement-breakpoint
ALTER TABLE `transactions` ADD `status` text DEFAULT 'success';