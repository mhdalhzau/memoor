CREATE TABLE `attendance` (
	`attendance_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`store_id` int NOT NULL,
	`date` timestamp DEFAULT (now()),
	`check_in` text,
	`check_out` text,
	`shift` text,
	`lateness_minutes` int DEFAULT 0,
	`overtime_minutes` int DEFAULT 0,
	`break_duration` int DEFAULT 0,
	`overtime` decimal(4,2) DEFAULT '0',
	`notes` text,
	`attendance_status` text DEFAULT ('belum_diatur'),
	`status` text DEFAULT ('pending'),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `attendance_attendance_id` PRIMARY KEY(`attendance_id`)
);
--> statement-breakpoint
CREATE TABLE `cashflow` (
	`cashflow_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`store_id` int NOT NULL,
	`category` text NOT NULL,
	`type` text NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`description` text,
	`customer_id` varchar(36),
	`piutang_id` varchar(36),
	`sales_id` varchar(36),
	`payment_status` text DEFAULT ('lunas'),
	`jumlah_galon` decimal(12,2),
	`pajak_ongkos` decimal(10,2),
	`pajak_transfer` decimal(10,2) DEFAULT '2500',
	`total_pengeluaran` decimal(12,2),
	`konter` text,
	`pajak_transfer_rekening` decimal(10,2),
	`hasil` decimal(12,2),
	`date` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `cashflow_cashflow_id` PRIMARY KEY(`cashflow_id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`customer_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`address` text,
	`type` text DEFAULT ('customer'),
	`store_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `customers_customer_id` PRIMARY KEY(`customer_id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`inventory_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`product_id` varchar(36) NOT NULL,
	`store_id` int NOT NULL,
	`current_stock` decimal(10,3) DEFAULT '0',
	`minimum_stock` decimal(10,3) DEFAULT '0',
	`maximum_stock` decimal(10,3),
	`last_updated` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `inventory_inventory_id` PRIMARY KEY(`inventory_id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`inventory_transaction_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`product_id` varchar(36) NOT NULL,
	`store_id` int NOT NULL,
	`type` text NOT NULL,
	`quantity` decimal(10,3) NOT NULL,
	`reference_type` text,
	`reference_id` varchar(36),
	`notes` text,
	`user_id` varchar(36) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `inventory_transactions_inventory_transaction_id` PRIMARY KEY(`inventory_transaction_id`)
);
--> statement-breakpoint
CREATE TABLE `overtime` (
	`overtime_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`store_id` int NOT NULL,
	`date` timestamp NOT NULL,
	`hours` decimal(4,2) NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT ('pending'),
	`approved_by` varchar(36),
	`approved_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `overtime_overtime_id` PRIMARY KEY(`overtime_id`)
);
--> statement-breakpoint
CREATE TABLE `payroll` (
	`payroll_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`store_id` int NOT NULL,
	`month` text NOT NULL,
	`base_salary` decimal(10,2) NOT NULL,
	`overtime_pay` decimal(10,2) DEFAULT '0',
	`bonuses` text,
	`deductions` text,
	`total_amount` decimal(10,2) NOT NULL,
	`status` text DEFAULT ('pending'),
	`paid_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `payroll_payroll_id` PRIMARY KEY(`payroll_id`)
);
--> statement-breakpoint
CREATE TABLE `payroll_config` (
	`payroll_config_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`payroll_cycle` text NOT NULL DEFAULT ('30'),
	`overtime_rate` decimal(10,2) NOT NULL DEFAULT '10000',
	`start_date` text NOT NULL,
	`next_payroll_date` text,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `payroll_config_payroll_config_id` PRIMARY KEY(`payroll_config_id`)
);
--> statement-breakpoint
CREATE TABLE `piutang` (
	`piutang_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`customer_id` varchar(36) NOT NULL,
	`store_id` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`description` text NOT NULL,
	`due_date` timestamp,
	`status` text DEFAULT ('belum_lunas'),
	`paid_amount` decimal(12,2) DEFAULT '0',
	`paid_at` timestamp,
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `piutang_piutang_id` PRIMARY KEY(`piutang_id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`product_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`name` text NOT NULL,
	`description` text,
	`sku` text,
	`category` text,
	`unit` text NOT NULL,
	`buying_price` decimal(12,2),
	`selling_price` decimal(12,2),
	`supplier_id` varchar(36),
	`status` text DEFAULT ('active'),
	`store_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `products_product_id` PRIMARY KEY(`product_id`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`proposal_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`store_id` int NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`estimated_cost` decimal(10,2),
	`description` text NOT NULL,
	`status` text DEFAULT ('pending'),
	`reviewed_by` varchar(36),
	`reviewed_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `proposals_proposal_id` PRIMARY KEY(`proposal_id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`sales_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`store_id` int NOT NULL,
	`user_id` varchar(36),
	`date` timestamp DEFAULT (now()),
	`total_sales` decimal(12,2) NOT NULL,
	`transactions` int NOT NULL,
	`average_ticket` decimal(12,2),
	`total_qris` decimal(12,2) DEFAULT '0',
	`total_cash` decimal(12,2) DEFAULT '0',
	`meter_start` decimal(10,3),
	`meter_end` decimal(10,3),
	`total_liters` decimal(10,3),
	`total_income` decimal(12,2) DEFAULT '0',
	`total_expenses` decimal(12,2) DEFAULT '0',
	`income_details` text,
	`expense_details` text,
	`shift` text,
	`check_in` text,
	`check_out` text,
	`submission_date` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `sales_sales_id` PRIMARY KEY(`sales_id`)
);
--> statement-breakpoint
CREATE TABLE `setoran` (
	`setoran_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`employee_name` text NOT NULL,
	`employee_id` varchar(36),
	`jam_masuk` text NOT NULL,
	`jam_keluar` text NOT NULL,
	`nomor_awal` decimal(10,3) NOT NULL,
	`nomor_akhir` decimal(10,3) NOT NULL,
	`total_liter` decimal(10,3) NOT NULL,
	`total_setoran` decimal(12,2) NOT NULL,
	`qris_setoran` decimal(12,2) NOT NULL,
	`cash_setoran` decimal(12,2) NOT NULL,
	`expenses_data` text,
	`total_expenses` decimal(12,2) NOT NULL,
	`income_data` text,
	`total_income` decimal(12,2) NOT NULL,
	`total_keseluruhan` decimal(12,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `setoran_setoran_id` PRIMARY KEY(`setoran_id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`store_id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`phone` text,
	`manager` text,
	`description` text,
	`status` text DEFAULT ('active'),
	`entry_time_start` text DEFAULT ('07:00'),
	`entry_time_end` text DEFAULT ('09:00'),
	`exit_time_start` text DEFAULT ('17:00'),
	`exit_time_end` text DEFAULT ('19:00'),
	`timezone` text DEFAULT ('Asia/Jakarta'),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `stores_store_id` PRIMARY KEY(`store_id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`supplier_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`name` text NOT NULL,
	`contact_person` text,
	`phone` text,
	`email` text,
	`address` text,
	`description` text,
	`status` text DEFAULT ('active'),
	`store_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `suppliers_supplier_id` PRIMARY KEY(`supplier_id`)
);
--> statement-breakpoint
CREATE TABLE `user_stores` (
	`user_store_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`store_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_stores_user_store_id` PRIMARY KEY(`user_store_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`email` varchar(255) NOT NULL,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`phone` text,
	`salary` decimal(12,2),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`wallet_id` varchar(36) NOT NULL DEFAULT (uuid()),
	`store_id` int NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`balance` decimal(15,2) DEFAULT '0',
	`account_number` text,
	`description` text,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `wallets_wallet_id` PRIMARY KEY(`wallet_id`)
);
