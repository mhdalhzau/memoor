ALTER TABLE `inventory` MODIFY COLUMN `current_stock` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `inventory` MODIFY COLUMN `minimum_stock` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `inventory` MODIFY COLUMN `maximum_stock` decimal(10,2);--> statement-breakpoint
ALTER TABLE `inventory_transactions` MODIFY COLUMN `quantity` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` MODIFY COLUMN `meter_start` decimal(10,2);--> statement-breakpoint
ALTER TABLE `sales` MODIFY COLUMN `meter_end` decimal(10,2);--> statement-breakpoint
ALTER TABLE `sales` MODIFY COLUMN `total_liters` decimal(10,2);--> statement-breakpoint
ALTER TABLE `setoran` MODIFY COLUMN `nomor_awal` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `setoran` MODIFY COLUMN `nomor_akhir` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `setoran` MODIFY COLUMN `total_liter` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `piutang` ADD `sales_id` varchar(36);--> statement-breakpoint
ALTER TABLE `sales` ADD `status` text DEFAULT ('none');--> statement-breakpoint
ALTER TABLE `stores` ADD `shifts` text;