CREATE TABLE `group_expense_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`expense_id` text NOT NULL,
	`member_id` text NOT NULL,
	`paid_share` real DEFAULT 0 NOT NULL,
	`owed_share` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `group_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`description` text NOT NULL,
	`category_id` text,
	`total_amount` real NOT NULL,
	`date` integer NOT NULL,
	`receipt_image` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `group_settlements` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`from_member_id` text NOT NULL,
	`to_member_id` text NOT NULL,
	`amount` real NOT NULL,
	`date` integer NOT NULL
);
