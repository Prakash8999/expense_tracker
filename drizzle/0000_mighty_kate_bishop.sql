CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`icon` text DEFAULT 'wallet' NOT NULL,
	`color` text DEFAULT '#6366F1' NOT NULL,
	`created_at` integer NOT NULL,
	`is_archived` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text,
	`amount` real NOT NULL,
	`period` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`type` text DEFAULT 'expense' NOT NULL,
	`parent_id` text,
	`is_default` integer DEFAULT 0,
	`sort_order` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `debt_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`debt_id` text NOT NULL,
	`amount` real NOT NULL,
	`date` integer NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`id` text PRIMARY KEY NOT NULL,
	`person_name` text NOT NULL,
	`type` text NOT NULL,
	`total_amount` real NOT NULL,
	`remaining_amount` real NOT NULL,
	`date` integer NOT NULL,
	`due_date` integer,
	`note` text,
	`is_settled` integer DEFAULT 0,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`expiry_date` integer,
	`barcode_data` text,
	`image_path` text,
	`note` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goal_contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`amount` real NOT NULL,
	`date` integer NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`target_amount` real NOT NULL,
	`current_amount` real DEFAULT 0 NOT NULL,
	`target_date` integer,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `group_members` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`name` text NOT NULL,
	`is_user` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `investments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`purchase_price` real NOT NULL,
	`current_value` real NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`purchase_date` integer NOT NULL,
	`note` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `planned_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`category_id` text,
	`account_id` text NOT NULL,
	`frequency` text NOT NULL,
	`start_date` integer NOT NULL,
	`next_due_date` integer NOT NULL,
	`reminder_days` text,
	`is_active` integer DEFAULT 1,
	`note` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shopping_items` (
	`id` text PRIMARY KEY NOT NULL,
	`list_id` text NOT NULL,
	`name` text NOT NULL,
	`expected_price` real,
	`is_checked` integer DEFAULT 0,
	`sort_order` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `shopping_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`is_completed` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `splits` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`group_id` text NOT NULL,
	`member_id` text NOT NULL,
	`amount` real NOT NULL,
	`is_paid` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`to_account_id` text,
	`category_id` text,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`date` integer NOT NULL,
	`note` text,
	`group_id` text,
	`is_recurring` integer DEFAULT 0,
	`recurring_id` text,
	`created_at` integer NOT NULL
);
