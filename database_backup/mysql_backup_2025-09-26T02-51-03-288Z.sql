-- MySQL Database Backup
-- Generated: 2025-09-26T02:51:03.849Z
-- Database: defaultdb

USE `defaultdb`;

-- Table: attendance
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `date` timestamp NULL DEFAULT (now()),
  `check_in` text,
  `check_out` text,
  `shift` text,
  `lateness_minutes` int DEFAULT '0',
  `overtime_minutes` int DEFAULT '0',
  `break_duration` int DEFAULT '0',
  `overtime` decimal(4,2) DEFAULT '0.00',
  `notes` text,
  `attendance_status` text DEFAULT (_utf8mb4'belum_diatur'),
  `status` text DEFAULT (_utf8mb4'pending'),
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: cashflow
DROP TABLE IF EXISTS `cashflow`;
CREATE TABLE `cashflow` (
  `id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `category` text NOT NULL,
  `type` text NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text,
  `customer_id` varchar(36) DEFAULT NULL,
  `piutang_id` varchar(36) DEFAULT NULL,
  `payment_status` text DEFAULT (_utf8mb4'lunas'),
  `jumlah_galon` decimal(8,2) DEFAULT NULL,
  `pajak_ongkos` decimal(10,2) DEFAULT NULL,
  `pajak_transfer` decimal(10,2) DEFAULT '2500.00',
  `total_pengeluaran` decimal(12,2) DEFAULT NULL,
  `konter` text,
  `pajak_transfer_rekening` decimal(10,2) DEFAULT NULL,
  `hasil` decimal(12,2) DEFAULT NULL,
  `date` timestamp NULL DEFAULT (now()),
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: customers
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` varchar(36) NOT NULL,
  `name` text NOT NULL,
  `email` text,
  `phone` text,
  `address` text,
  `type` text DEFAULT (_utf8mb4'customer'),
  `store_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: inventory
DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
  `id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `current_stock` decimal(10,3) DEFAULT '0.000',
  `minimum_stock` decimal(10,3) DEFAULT '0.000',
  `maximum_stock` decimal(10,3) DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT (now()),
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: inventory_transactions
DROP TABLE IF EXISTS `inventory_transactions`;
CREATE TABLE `inventory_transactions` (
  `id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `type` text NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `reference_type` text,
  `reference_id` varchar(36) DEFAULT NULL,
  `notes` text,
  `user_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: overtime
DROP TABLE IF EXISTS `overtime`;
CREATE TABLE `overtime` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `date` timestamp NOT NULL,
  `hours` decimal(4,2) NOT NULL,
  `reason` text NOT NULL,
  `status` text DEFAULT (_utf8mb4'pending'),
  `approved_by` varchar(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: payroll
DROP TABLE IF EXISTS `payroll`;
CREATE TABLE `payroll` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `month` text NOT NULL,
  `base_salary` decimal(10,2) NOT NULL,
  `overtime_pay` decimal(10,2) DEFAULT '0.00',
  `bonuses` text,
  `deductions` text,
  `total_amount` decimal(10,2) NOT NULL,
  `status` text DEFAULT (_utf8mb4'pending'),
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: payroll_config
DROP TABLE IF EXISTS `payroll_config`;
CREATE TABLE `payroll_config` (
  `id` varchar(36) NOT NULL,
  `payroll_cycle` text NOT NULL DEFAULT (_utf8mb4'30'),
  `overtime_rate` decimal(10,2) NOT NULL DEFAULT '10000.00',
  `start_date` text NOT NULL,
  `next_payroll_date` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: piutang
DROP TABLE IF EXISTS `piutang`;
CREATE TABLE `piutang` (
  `id` varchar(36) NOT NULL,
  `customer_id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text NOT NULL,
  `due_date` timestamp NULL DEFAULT NULL,
  `status` text DEFAULT (_utf8mb4'belum_lunas'),
  `paid_amount` decimal(10,2) DEFAULT '0.00',
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: products
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` varchar(36) NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `sku` text,
  `category` text,
  `unit` text NOT NULL,
  `buying_price` decimal(12,2) DEFAULT NULL,
  `selling_price` decimal(12,2) DEFAULT NULL,
  `supplier_id` varchar(36) DEFAULT NULL,
  `status` text DEFAULT (_utf8mb4'active'),
  `store_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: proposals
DROP TABLE IF EXISTS `proposals`;
CREATE TABLE `proposals` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `title` text NOT NULL,
  `category` text NOT NULL,
  `estimated_cost` decimal(10,2) DEFAULT NULL,
  `description` text NOT NULL,
  `status` text DEFAULT (_utf8mb4'pending'),
  `reviewed_by` varchar(36) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: sales
DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
  `id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `date` timestamp NULL DEFAULT (now()),
  `total_sales` decimal(12,2) NOT NULL,
  `transactions` int NOT NULL,
  `average_ticket` decimal(8,2) DEFAULT NULL,
  `total_qris` decimal(12,2) DEFAULT '0.00',
  `total_cash` decimal(12,2) DEFAULT '0.00',
  `meter_start` decimal(10,3) DEFAULT NULL,
  `meter_end` decimal(10,3) DEFAULT NULL,
  `total_liters` decimal(10,3) DEFAULT NULL,
  `total_income` decimal(12,2) DEFAULT '0.00',
  `total_expenses` decimal(12,2) DEFAULT '0.00',
  `income_details` text,
  `expense_details` text,
  `shift` text,
  `check_in` text,
  `check_out` text,
  `submission_date` text,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: setoran
DROP TABLE IF EXISTS `setoran`;
CREATE TABLE `setoran` (
  `id` varchar(36) NOT NULL,
  `employee_name` text NOT NULL,
  `employee_id` varchar(36) DEFAULT NULL,
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
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: stores
DROP TABLE IF EXISTS `stores`;
CREATE TABLE `stores` (
  `id` int NOT NULL,
  `name` text NOT NULL,
  `address` text,
  `phone` text,
  `manager` text,
  `description` text,
  `status` text DEFAULT (_utf8mb4'active'),
  `entry_time_start` text DEFAULT (_utf8mb4'07:00'),
  `entry_time_end` text DEFAULT (_utf8mb4'09:00'),
  `exit_time_start` text DEFAULT (_utf8mb4'17:00'),
  `exit_time_end` text DEFAULT (_utf8mb4'19:00'),
  `timezone` text DEFAULT (_utf8mb4'Asia/Jakarta'),
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: stores
INSERT INTO `stores` (`id`, `name`, `address`, `phone`, `manager`, `description`, `status`, `entry_time_start`, `entry_time_end`, `exit_time_start`, `exit_time_end`, `timezone`, `created_at`) VALUES (1, '213', '123 Main Street', '021-1234567', 'SPBU Manager', 'Main store location with full services', 'active', '07:00', '09:00', '17:00', '19:00', 'Asia/Jakarta', '2025-09-26 01:23:52.000');
INSERT INTO `stores` (`id`, `name`, `address`, `phone`, `manager`, `description`, `status`, `entry_time_start`, `entry_time_end`, `exit_time_start`, `exit_time_end`, `timezone`, `created_at`) VALUES (2, 'Branch Store', '456 Branch Avenue', '021-2345678', NULL, 'Branch store location', 'active', '07:00', '09:00', '17:00', '19:00', 'Asia/Jakarta', '2025-09-26 01:23:52.000');

-- Table: suppliers
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` varchar(36) NOT NULL,
  `name` text NOT NULL,
  `contact_person` text,
  `phone` text,
  `email` text,
  `address` text,
  `description` text,
  `status` text DEFAULT (_utf8mb4'active'),
  `store_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: user_stores
DROP TABLE IF EXISTS `user_stores`;
CREATE TABLE `user_stores` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: user_stores
INSERT INTO `user_stores` (`id`, `user_id`, `store_id`, `created_at`) VALUES ('00358a93-171b-455a-9490-8015cee25fd9', 'df880e37-a056-436d-a258-6f3e8262bc1d', 1, '2025-09-26 01:23:54.000');
INSERT INTO `user_stores` (`id`, `user_id`, `store_id`, `created_at`) VALUES ('8196ba30-9b9c-493b-9e5c-3d1308738520', '54a63740-4b35-4caa-87da-62c597b0665f', 1, '2025-09-26 01:23:54.000');
INSERT INTO `user_stores` (`id`, `user_id`, `store_id`, `created_at`) VALUES ('85ccf344-60b4-4af4-af4d-8110d8202bbb', '40603306-34ce-4e7b-845d-32c2fc4aee93', 2, '2025-09-26 01:23:54.000');
INSERT INTO `user_stores` (`id`, `user_id`, `store_id`, `created_at`) VALUES ('a5432181-bfc8-41f4-b5f0-4cde121faf32', '4e6f8c80-2116-414d-918b-2adb872bb3d7', 1, '2025-09-26 01:23:54.000');
INSERT INTO `user_stores` (`id`, `user_id`, `store_id`, `created_at`) VALUES ('a67a3e30-fd1e-436b-8712-680e36897fbb', '4a4d8a7d-f284-44a2-aa0b-18561a2b99d1', 1, '2025-09-26 01:49:38.000');
INSERT INTO `user_stores` (`id`, `user_id`, `store_id`, `created_at`) VALUES ('aa369040-be59-46c8-84d1-da46c27ada87', '40603306-34ce-4e7b-845d-32c2fc4aee93', 1, '2025-09-26 01:23:54.000');
INSERT INTO `user_stores` (`id`, `user_id`, `store_id`, `created_at`) VALUES ('b8db0d76-51b7-4ae7-a962-6d853da2ea8a', '68ceed41-485b-43eb-8ef5-b805db398cb0', 1, '2025-09-26 01:23:54.000');
INSERT INTO `user_stores` (`id`, `user_id`, `store_id`, `created_at`) VALUES ('eadcbbaf-ed21-42fc-b0a3-ed5748fd29d2', '4e6f8c80-2116-414d-918b-2adb872bb3d7', 2, '2025-09-26 01:23:54.000');

-- Table: users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` text NOT NULL,
  `name` text NOT NULL,
  `role` text NOT NULL,
  `phone` text,
  `salary` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table: users
INSERT INTO `users` (`id`, `email`, `password`, `name`, `role`, `phone`, `salary`, `created_at`) VALUES ('40603306-34ce-4e7b-845d-32c2fc4aee93', 'manager@spbu.com', '5271478b189e6f1a73a316f86209ec8900d93fa807d652fc52c5951b8ab154188a4a1525c47fce5f96b066b881a401e4ae071c81415a00f69f460b78efaeca2d.da313ffd30f2db8b47324dc4f8790eb5', 'SPBU Manager', 'manager', NULL, '15000000.00', '2025-09-26 01:23:54.000');
INSERT INTO `users` (`id`, `email`, `password`, `name`, `role`, `phone`, `salary`, `created_at`) VALUES ('4a4d8a7d-f284-44a2-aa0b-18561a2b99d1', 'alhafizaulia5@gmail.com', '9fb0ce6184ced3d123950cf7fdcfb61c1687af7730a8857dad64a4c2f69645642063a8acd08d1d38487ce37f6eefacf3326e3a4c3ef0874044fb48954be57f77.2cecbd9b802611b611c0d258f0148497', 'asd', 'staff', NULL, '0.00', '2025-09-26 01:49:38.000');
INSERT INTO `users` (`id`, `email`, `password`, `name`, `role`, `phone`, `salary`, `created_at`) VALUES ('4e6f8c80-2116-414d-918b-2adb872bb3d7', 'admin@spbu.com', '759776d92a32102a24edb143b4f36cf660affaf3d9fa784fe630f35774134f8aecacfbcae9e029d6581944c3cd7ac04e959a8b60b2d891905681ea4ebe48c32a.20118937654ceaf9c2243452b9d45176', 'SPBU Administrator', 'administrasi', NULL, '12000000.00', '2025-09-26 01:23:54.000');
INSERT INTO `users` (`id`, `email`, `password`, `name`, `role`, `phone`, `salary`, `created_at`) VALUES ('54a63740-4b35-4caa-87da-62c597b0665f', 'hafiz@spbu.com', 'f8e14a0f76ba4974428766d8553eadf7ab401c0701954efc4f4f4c57849617d3528a7e0a9ecc75fed8c8310951ef8a31e9f52e5900e9a7313eb9ca1e9fdd8bd3.0cf9d50b14833796f0b545a01b1878d4', 'Hafiz', 'staff', NULL, '8000000.00', '2025-09-26 01:23:54.000');
INSERT INTO `users` (`id`, `email`, `password`, `name`, `role`, `phone`, `salary`, `created_at`) VALUES ('68ceed41-485b-43eb-8ef5-b805db398cb0', 'putri@spbu.com', '89f4b4d54a5f0f28b586ef8936300d987322e4572afb57e9d4f986cba650252b04a31f619deedeace07cdc503e77f3e9e4352901295a50e80f3d7e1bc27688d2.4e5f7e37609aab482b30efd65cdd5197', 'Putri', 'staff', NULL, '8000000.00', '2025-09-26 01:23:54.000');
INSERT INTO `users` (`id`, `email`, `password`, `name`, `role`, `phone`, `salary`, `created_at`) VALUES ('df880e37-a056-436d-a258-6f3e8262bc1d', 'endang@spbu.com', '0659c1c5370c59ef337def93d03324cb6a9a9929019b687bedb9efb1c1cb1251011e3a355b1ecf6b5377f0ebb4dffe0c9d5502b64ffa6de9dab62a1295abee67.a7692c21b1dffba27338067710e85d2a', 'Endang', 'staff', NULL, '8000000.00', '2025-09-26 01:23:54.000');

-- Table: wallets
DROP TABLE IF EXISTS `wallets`;
CREATE TABLE `wallets` (
  `id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `balance` decimal(15,2) DEFAULT '0.00',
  `account_number` text,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

