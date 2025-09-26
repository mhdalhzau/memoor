-- MySQL Database Backup
-- Generated: 2025-09-26T01:23:07.000Z
-- Database: defaultdb

USE `defaultdb`;

-- Table: attendance
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE "attendance" (
  "id" varchar(36) NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "store_id" int NOT NULL,
  "date" timestamp NULL DEFAULT (now()),
  "check_in" text,
  "check_out" text,
  "shift" text,
  "lateness_minutes" int DEFAULT '0',
  "overtime_minutes" int DEFAULT '0',
  "break_duration" int DEFAULT '0',
  "overtime" decimal(4,2) DEFAULT '0.00',
  "notes" text,
  "attendance_status" text DEFAULT (_utf8mb4'belum_diatur'),
  "status" text DEFAULT (_utf8mb4'pending'),
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: cashflow
DROP TABLE IF EXISTS `cashflow`;
CREATE TABLE "cashflow" (
  "id" varchar(36) NOT NULL,
  "store_id" int NOT NULL,
  "category" text NOT NULL,
  "type" text NOT NULL,
  "amount" decimal(10,2) NOT NULL,
  "description" text,
  "customer_id" varchar(36) DEFAULT NULL,
  "piutang_id" varchar(36) DEFAULT NULL,
  "payment_status" text DEFAULT (_utf8mb4'lunas'),
  "jumlah_galon" decimal(8,2) DEFAULT NULL,
  "pajak_ongkos" decimal(10,2) DEFAULT NULL,
  "pajak_transfer" decimal(10,2) DEFAULT '2500.00',
  "total_pengeluaran" decimal(12,2) DEFAULT NULL,
  "konter" text,
  "pajak_transfer_rekening" decimal(10,2) DEFAULT NULL,
  "hasil" decimal(12,2) DEFAULT NULL,
  "date" timestamp NULL DEFAULT (now()),
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: customers
DROP TABLE IF EXISTS `customers`;
CREATE TABLE "customers" (
  "id" varchar(36) NOT NULL,
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "address" text,
  "type" text DEFAULT (_utf8mb4'customer'),
  "store_id" int NOT NULL,
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: inventory
DROP TABLE IF EXISTS `inventory`;
CREATE TABLE "inventory" (
  "id" varchar(36) NOT NULL,
  "product_id" varchar(36) NOT NULL,
  "store_id" int NOT NULL,
  "current_stock" decimal(10,3) DEFAULT '0.000',
  "minimum_stock" decimal(10,3) DEFAULT '0.000',
  "maximum_stock" decimal(10,3) DEFAULT NULL,
  "last_updated" timestamp NULL DEFAULT (now()),
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: inventory_transactions
DROP TABLE IF EXISTS `inventory_transactions`;
CREATE TABLE "inventory_transactions" (
  "id" varchar(36) NOT NULL,
  "product_id" varchar(36) NOT NULL,
  "store_id" int NOT NULL,
  "type" text NOT NULL,
  "quantity" decimal(10,3) NOT NULL,
  "reference_type" text,
  "reference_id" varchar(36) DEFAULT NULL,
  "notes" text,
  "user_id" varchar(36) NOT NULL,
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: overtime
DROP TABLE IF EXISTS `overtime`;
CREATE TABLE "overtime" (
  "id" varchar(36) NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "store_id" int NOT NULL,
  "date" timestamp NOT NULL,
  "hours" decimal(4,2) NOT NULL,
  "reason" text NOT NULL,
  "status" text DEFAULT (_utf8mb4'pending'),
  "approved_by" varchar(36) DEFAULT NULL,
  "approved_at" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: payroll
DROP TABLE IF EXISTS `payroll`;
CREATE TABLE "payroll" (
  "id" varchar(36) NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "store_id" int NOT NULL,
  "month" text NOT NULL,
  "base_salary" decimal(10,2) NOT NULL,
  "overtime_pay" decimal(10,2) DEFAULT '0.00',
  "bonuses" text,
  "deductions" text,
  "total_amount" decimal(10,2) NOT NULL,
  "status" text DEFAULT (_utf8mb4'pending'),
  "paid_at" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: payroll_config
DROP TABLE IF EXISTS `payroll_config`;
CREATE TABLE "payroll_config" (
  "id" varchar(36) NOT NULL,
  "payroll_cycle" text NOT NULL DEFAULT (_utf8mb4'30'),
  "overtime_rate" decimal(10,2) NOT NULL DEFAULT '10000.00',
  "start_date" text NOT NULL,
  "next_payroll_date" text,
  "is_active" tinyint(1) DEFAULT '1',
  "created_at" timestamp NULL DEFAULT (now()),
  "updated_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: piutang
DROP TABLE IF EXISTS `piutang`;
CREATE TABLE "piutang" (
  "id" varchar(36) NOT NULL,
  "customer_id" varchar(36) NOT NULL,
  "store_id" int NOT NULL,
  "amount" decimal(10,2) NOT NULL,
  "description" text NOT NULL,
  "due_date" timestamp NULL DEFAULT NULL,
  "status" text DEFAULT (_utf8mb4'belum_lunas'),
  "paid_amount" decimal(10,2) DEFAULT '0.00',
  "paid_at" timestamp NULL DEFAULT NULL,
  "created_by" varchar(36) NOT NULL,
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: products
DROP TABLE IF EXISTS `products`;
CREATE TABLE "products" (
  "id" varchar(36) NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "sku" text,
  "category" text,
  "unit" text NOT NULL,
  "buying_price" decimal(12,2) DEFAULT NULL,
  "selling_price" decimal(12,2) DEFAULT NULL,
  "supplier_id" varchar(36) DEFAULT NULL,
  "status" text DEFAULT (_utf8mb4'active'),
  "store_id" int NOT NULL,
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: proposals
DROP TABLE IF EXISTS `proposals`;
CREATE TABLE "proposals" (
  "id" varchar(36) NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "store_id" int NOT NULL,
  "title" text NOT NULL,
  "category" text NOT NULL,
  "estimated_cost" decimal(10,2) DEFAULT NULL,
  "description" text NOT NULL,
  "status" text DEFAULT (_utf8mb4'pending'),
  "reviewed_by" varchar(36) DEFAULT NULL,
  "reviewed_at" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: sales
DROP TABLE IF EXISTS `sales`;
CREATE TABLE "sales" (
  "id" varchar(36) NOT NULL,
  "store_id" int NOT NULL,
  "user_id" varchar(36) DEFAULT NULL,
  "date" timestamp NULL DEFAULT (now()),
  "total_sales" decimal(12,2) NOT NULL,
  "transactions" int NOT NULL,
  "average_ticket" decimal(8,2) DEFAULT NULL,
  "total_qris" decimal(12,2) DEFAULT '0.00',
  "total_cash" decimal(12,2) DEFAULT '0.00',
  "meter_start" decimal(10,3) DEFAULT NULL,
  "meter_end" decimal(10,3) DEFAULT NULL,
  "total_liters" decimal(10,3) DEFAULT NULL,
  "total_income" decimal(12,2) DEFAULT '0.00',
  "total_expenses" decimal(12,2) DEFAULT '0.00',
  "income_details" text,
  "expense_details" text,
  "shift" text,
  "check_in" text,
  "check_out" text,
  "submission_date" text,
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: setoran
DROP TABLE IF EXISTS `setoran`;
CREATE TABLE "setoran" (
  "id" varchar(36) NOT NULL,
  "employee_name" text NOT NULL,
  "employee_id" varchar(36) DEFAULT NULL,
  "jam_masuk" text NOT NULL,
  "jam_keluar" text NOT NULL,
  "nomor_awal" decimal(10,3) NOT NULL,
  "nomor_akhir" decimal(10,3) NOT NULL,
  "total_liter" decimal(10,3) NOT NULL,
  "total_setoran" decimal(12,2) NOT NULL,
  "qris_setoran" decimal(12,2) NOT NULL,
  "cash_setoran" decimal(12,2) NOT NULL,
  "expenses_data" text,
  "total_expenses" decimal(12,2) NOT NULL,
  "income_data" text,
  "total_income" decimal(12,2) NOT NULL,
  "total_keseluruhan" decimal(12,2) NOT NULL,
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: stores
DROP TABLE IF EXISTS `stores`;
CREATE TABLE "stores" (
  "id" int NOT NULL,
  "name" text NOT NULL,
  "address" text,
  "phone" text,
  "manager" text,
  "description" text,
  "status" text DEFAULT (_utf8mb4'active'),
  "entry_time_start" text DEFAULT (_utf8mb4'07:00'),
  "entry_time_end" text DEFAULT (_utf8mb4'09:00'),
  "exit_time_start" text DEFAULT (_utf8mb4'17:00'),
  "exit_time_end" text DEFAULT (_utf8mb4'19:00'),
  "timezone" text DEFAULT (_utf8mb4'Asia/Jakarta'),
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: suppliers
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE "suppliers" (
  "id" varchar(36) NOT NULL,
  "name" text NOT NULL,
  "contact_person" text,
  "phone" text,
  "email" text,
  "address" text,
  "description" text,
  "status" text DEFAULT (_utf8mb4'active'),
  "store_id" int NOT NULL,
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: user_stores
DROP TABLE IF EXISTS `user_stores`;
CREATE TABLE "user_stores" (
  "id" varchar(36) NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "store_id" int NOT NULL,
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

-- Table: users
DROP TABLE IF EXISTS `users`;
CREATE TABLE "users" (
  "id" varchar(36) NOT NULL,
  "email" varchar(255) NOT NULL,
  "password" text NOT NULL,
  "name" text NOT NULL,
  "role" text NOT NULL,
  "phone" text,
  "salary" decimal(12,2) DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id"),
  UNIQUE KEY "users_email_unique" ("email")
);

-- Table: wallets
DROP TABLE IF EXISTS `wallets`;
CREATE TABLE "wallets" (
  "id" varchar(36) NOT NULL,
  "store_id" int NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "balance" decimal(15,2) DEFAULT '0.00',
  "account_number" text,
  "description" text,
  "is_active" tinyint(1) DEFAULT '1',
  "created_at" timestamp NULL DEFAULT (now()),
  "updated_at" timestamp NULL DEFAULT (now()),
  PRIMARY KEY ("id")
);

