-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: marlokk-mhdalhzau.j.aivencloud.com    Database: defaultdb
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '65b81dbc-9a74-11f0-8add-2a0953aab457:1-208';

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `attendance_id` varchar(36) NOT NULL,
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
  PRIMARY KEY (`attendance_id`),
  KEY `fk_attendance_store` (`store_id`),
  KEY `fk_attendance_user` (`user_id`),
  CONSTRAINT `fk_attendance_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_attendance_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES ('71e0dff9-fcc6-4c0d-9b99-a9520c44cf65','54a63740-4b35-4caa-87da-62c597b0665f',2,'2025-09-26 20:49:06','07:00','14:00',NULL,0,0,0,0.00,'Setoran harian - Hafiz','belum_diatur','pending','2025-09-26 20:49:06'),('7587b2b9-f8af-431e-be01-7f2a54dc2b3d','54a63740-4b35-4caa-87da-62c597b0665f',2,'2025-09-26 20:53:43','07:23','14:04',NULL,0,0,0,0.00,'Setoran harian - Hafiz','belum_diatur','pending','2025-09-26 20:53:43'),('a6371393-be5a-497f-88df-978952564bf5','54a63740-4b35-4caa-87da-62c597b0665f',2,'2025-09-27 00:00:00','07:00','14:00','pagi',0,0,0,0.00,'Auto-imported from sales data import on 2025-09-26','hadir','approved','2025-09-26 20:50:43'),('af5abe55-6d03-4a5f-9c6e-d31f21ec4d8a','54a63740-4b35-4caa-87da-62c597b0665f',2,'2025-09-25 00:00:00','07:41','13:45','pagi',0,0,0,0.00,'Auto-imported from sales data import on 2025-09-26','hadir','approved','2025-09-26 18:31:00'),('cda70547-ee5d-44b2-96ae-9873c570d175','54a63740-4b35-4caa-87da-62c597b0665f',1,'2025-09-23 00:00:00','07:00','14:00','pagi',0,0,0,0.00,'Auto-imported from sales data import on 2025-09-26','hadir','approved','2025-09-26 20:16:55'),('dc09b93f-19cd-4054-ab47-d071791a19db','df880e37-a056-436d-a258-6f3e8262bc1d',1,'2025-09-26 19:23:52','07:00','23:00',NULL,0,0,0,0.00,'Setoran harian - Endang','belum_diatur','pending','2025-09-26 19:23:52'),('f62d4951-6879-4c5f-b0f4-1efbd9296f43','54a63740-4b35-4caa-87da-62c597b0665f',2,'2025-09-26 19:06:02','07:00','14:00',NULL,0,0,0,0.00,'Setoran harian - Hafiz','belum_diatur','pending','2025-09-26 19:06:02'),('fee47d78-6f87-4f46-be42-c743a9461a05','54a63740-4b35-4caa-87da-62c597b0665f',2,'2025-09-26 19:54:42','02:02','03:03',NULL,0,0,0,0.00,'Setoran harian - Hafiz','belum_diatur','pending','2025-09-26 19:54:42');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cashflow`
--

DROP TABLE IF EXISTS `cashflow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cashflow` (
  `cashflow_id` varchar(36) NOT NULL,
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
  PRIMARY KEY (`cashflow_id`),
  KEY `fk_cashflow_store` (`store_id`),
  KEY `fk_cashflow_customer` (`customer_id`),
  KEY `fk_cashflow_piutang` (`piutang_id`),
  CONSTRAINT `fk_cashflow_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cashflow_piutang` FOREIGN KEY (`piutang_id`) REFERENCES `piutang` (`piutang_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cashflow_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cashflow`
--

LOCK TABLES `cashflow` WRITE;
/*!40000 ALTER TABLE `cashflow` DISABLE KEYS */;
INSERT INTO `cashflow` VALUES ('12c5963d-d2ba-48d9-a39c-6dda026744d6',2,'Expense','Other',1000000.00,'Expenses from sales import (Auto-imported on 2025-09-26)',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-27 00:00:00','2025-09-26 21:34:40'),('20808b45-d0c5-4687-8ca9-fb65abe8c445',2,'Expense','Other',31312313.00,'s',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-26 19:54:43','2025-09-26 19:54:43'),('21b14db4-f237-4f8e-85b0-3b423ac30907',2,'Expense','Other',20000.00,'l',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-26 19:06:04','2025-09-26 19:06:04'),('24a0d35d-8f36-455a-b712-295da9e8972c',1,'Expense','Other',50000.00,'makan (Auto-imported from sales data)',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-23 00:00:00','2025-09-26 20:16:56'),('2c586ccf-de6e-4478-aa8e-e21b4ff83253',2,'Income','Sales',21000000.00,'Cash Sales 2025-09-27',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-27 00:00:00','2025-09-26 21:34:38'),('3a6d0615-c733-43ef-a948-ace73d4d4941',1,'Income','Other',200000.00,'bang dedi (Auto-imported from sales data)',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-23 00:00:00','2025-09-26 20:16:56'),('42911b10-9011-486b-b330-cb5d90ddae00',2,'Income','Other',4000000.00,'Income from sales import (Auto-imported on 2025-09-26)',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-27 00:00:00','2025-09-26 20:51:48'),('4508c54e-1fa5-4c2c-b7fc-c81ffae1c651',2,'Expense','Other',123123.00,'as',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-26 19:23:54','2025-09-26 19:23:54'),('498a4ec9-7ee0-4834-b594-4ff94b0248f7',2,'Income','Other',4000000.00,'bayar utang',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-26 20:49:06','2025-09-26 20:49:06'),('61f715cd-e7be-485a-ad17-b80dcfe78252',2,'Income','Other',23123.00,'s',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-26 19:23:55','2025-09-26 19:23:55'),('64670a4a-22e2-4059-8650-3c2b027a7963',2,'Income','Sales',21000000.00,'Cash Sales 2025-09-27',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-27 00:00:00','2025-09-26 20:51:48'),('6cf47f2e-71c2-474e-af52-866331d21215',2,'Income','Other',231.00,'asd',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-26 20:53:44','2025-09-26 20:53:44'),('7ff749ed-dcd7-474d-8e7c-93a72ab8ab9b',1,'Expense','Other',50000.00,'minum (Auto-imported from sales data)',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-23 00:00:00','2025-09-26 20:16:57'),('941311ef-c5cc-466a-8fa8-4a85e50cba65',2,'Income','Other',30000.00,'a',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-26 19:06:04','2025-09-26 19:06:04'),('9f3d0eea-83e8-4116-9547-38a2adcb4445',2,'Income','Other',4000000.00,'Income from sales import (Auto-imported on 2025-09-26)',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-27 00:00:00','2025-09-26 20:50:43'),('b6cb48b6-f6a7-4551-8006-d00da30cd047',2,'Income','Sales',114877.00,'Cash Sales 2025-09-26',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-26 20:53:44','2025-09-26 20:53:43'),('ba29dc0c-d714-4da4-96b8-dd6d430e13e8',2,'Expense','Other',213.00,'asd',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-26 20:53:43','2025-09-26 20:53:43'),('ce426fdc-b435-4e3a-b604-2a7b5100faca',2,'Expense','Other',1000000.00,'Expenses from sales import (Auto-imported on 2025-09-26)',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-27 00:00:00','2025-09-26 20:51:48'),('e3d1e171-4e6e-41e0-abe4-dc66966b3040',2,'Expense','Other',1000000.00,'Expenses from sales import (Auto-imported on 2025-09-26)',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-27 00:00:00','2025-09-26 20:50:43'),('e52b5bd6-787e-477c-86b2-65ce616c0c2f',2,'Income','Other',4000000.00,'Income from sales import (Auto-imported on 2025-09-26)',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-27 00:00:00','2025-09-26 21:34:40'),('e77508b5-8651-49ea-abe9-d5bd1b1ee49b',2,'Income','Sales',21000000.00,'Cash Sales 2025-09-27',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-27 00:00:00','2025-09-26 20:50:42'),('f26d5846-0290-491b-a663-124273748f8c',2,'Expense','Other',1000000.00,'makan',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-26 20:49:06','2025-09-26 20:49:06'),('fd1c61b4-5e75-4d43-880a-794b4d78782e',2,'Income','Other',21312313.00,'123',NULL,NULL,'lunas',NULL,NULL,2500.00,NULL,NULL,NULL,NULL,'2025-09-26 19:54:44','2025-09-26 19:54:44');
/*!40000 ALTER TABLE `cashflow` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `customer_id` varchar(36) NOT NULL,
  `name` text NOT NULL,
  `email` text,
  `phone` text,
  `address` text,
  `type` text DEFAULT (_utf8mb4'customer'),
  `store_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`customer_id`),
  KEY `fk_customers_store` (`store_id`),
  CONSTRAINT `fk_customers_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('897e37b9-1102-4ec6-a916-8e0efe4633e5','QRIS Manager','','','','customer',2,'2025-09-26 21:34:39');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `inventory_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `current_stock` decimal(10,3) DEFAULT '0.000',
  `minimum_stock` decimal(10,3) DEFAULT '0.000',
  `maximum_stock` decimal(10,3) DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT (now()),
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`inventory_id`),
  KEY `fk_inventory_store` (`store_id`),
  KEY `fk_inventory_product` (`product_id`),
  CONSTRAINT `fk_inventory_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_inventory_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `inventory_transaction_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `type` text NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `reference_type` text,
  `reference_id` varchar(36) DEFAULT NULL,
  `notes` text,
  `user_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`inventory_transaction_id`),
  KEY `fk_invtrans_store` (`store_id`),
  KEY `fk_invtrans_product` (`product_id`),
  KEY `fk_invtrans_user` (`user_id`),
  CONSTRAINT `fk_invtrans_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_invtrans_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_invtrans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `overtime`
--

DROP TABLE IF EXISTS `overtime`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `overtime` (
  `overtime_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `date` timestamp NOT NULL,
  `hours` decimal(4,2) NOT NULL,
  `reason` text NOT NULL,
  `status` text DEFAULT (_utf8mb4'pending'),
  `approved_by` varchar(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`overtime_id`),
  KEY `fk_overtime_store` (`store_id`),
  KEY `fk_overtime_user` (`user_id`),
  KEY `fk_overtime_approver` (`approved_by`),
  CONSTRAINT `fk_overtime_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_overtime_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_overtime_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `overtime`
--

LOCK TABLES `overtime` WRITE;
/*!40000 ALTER TABLE `overtime` DISABLE KEYS */;
INSERT INTO `overtime` VALUES ('1a5b1fbe-55a0-4948-922f-f37a8247bd06','df880e37-a056-436d-a258-6f3e8262bc1d',1,'2025-09-26 19:23:51',6.00,'Lembur otomatis dari setoran - 6 jam (07:00 - 23:00)','pending',NULL,NULL,'2025-09-26 19:23:51');
/*!40000 ALTER TABLE `overtime` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll`
--

DROP TABLE IF EXISTS `payroll`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll` (
  `payroll_id` varchar(36) NOT NULL,
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
  PRIMARY KEY (`payroll_id`),
  KEY `fk_payroll_store` (`store_id`),
  KEY `fk_payroll_user` (`user_id`),
  CONSTRAINT `fk_payroll_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payroll_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll`
--

LOCK TABLES `payroll` WRITE;
/*!40000 ALTER TABLE `payroll` DISABLE KEYS */;
INSERT INTO `payroll` VALUES ('1eaae8b3-501c-4c4f-ad5c-cb23131292d0','54a63740-4b35-4caa-87da-62c597b0665f',2,'2025-09',120000.00,0.00,NULL,NULL,120000.00,'pending',NULL,'2025-09-26 20:18:27'),('277be1e7-1cb3-43c2-8563-c53117663cb7','df880e37-a056-436d-a258-6f3e8262bc1d',1,'2025-09',133333.33,0.00,NULL,NULL,133333.33,'pending',NULL,'2025-09-26 20:18:28'),('2c1fda08-e550-41f7-b915-f840fd5a3d3b','68ceed41-485b-43eb-8ef5-b805db398cb0',2,'2025-09',0.00,0.00,NULL,NULL,0.00,'pending',NULL,'2025-09-26 19:58:12'),('5d4b23b2-ca4f-4c2a-aa81-cea851b17fa4','54a63740-4b35-4caa-87da-62c597b0665f',2,'2025-09',120000.00,0.00,NULL,NULL,120000.00,'pending',NULL,'2025-09-26 19:58:12'),('a9e8905b-9f33-411b-a9e2-05c37af9ea19','68ceed41-485b-43eb-8ef5-b805db398cb0',2,'2025-09',0.00,0.00,NULL,NULL,0.00,'pending',NULL,'2025-09-26 20:18:26'),('e1c3fe8f-bcd7-4d17-97d8-6b4288e856ad','df880e37-a056-436d-a258-6f3e8262bc1d',1,'2025-09',133333.33,0.00,NULL,NULL,133333.33,'pending',NULL,'2025-09-26 19:58:13');
/*!40000 ALTER TABLE `payroll` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll_config`
--

DROP TABLE IF EXISTS `payroll_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_config` (
  `payroll_config_id` varchar(36) NOT NULL,
  `payroll_cycle` text NOT NULL DEFAULT (_utf8mb4'30'),
  `overtime_rate` decimal(10,2) NOT NULL DEFAULT '10000.00',
  `start_date` text NOT NULL,
  `next_payroll_date` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`payroll_config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_config`
--

LOCK TABLES `payroll_config` WRITE;
/*!40000 ALTER TABLE `payroll_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `payroll_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `piutang`
--

DROP TABLE IF EXISTS `piutang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `piutang` (
  `piutang_id` varchar(36) NOT NULL,
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
  PRIMARY KEY (`piutang_id`),
  KEY `fk_piutang_store` (`store_id`),
  KEY `fk_piutang_customer` (`customer_id`),
  KEY `fk_piutang_user` (`created_by`),
  CONSTRAINT `fk_piutang_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_piutang_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_piutang_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `piutang`
--

LOCK TABLES `piutang` WRITE;
/*!40000 ALTER TABLE `piutang` DISABLE KEYS */;
/*!40000 ALTER TABLE `piutang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `product_id` varchar(36) NOT NULL,
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
  PRIMARY KEY (`product_id`),
  KEY `fk_products_store` (`store_id`),
  KEY `fk_products_supplier` (`supplier_id`),
  CONSTRAINT `fk_products_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_products_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proposals`
--

DROP TABLE IF EXISTS `proposals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proposals` (
  `proposal_id` varchar(36) NOT NULL,
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
  PRIMARY KEY (`proposal_id`),
  KEY `fk_proposals_store` (`store_id`),
  KEY `fk_proposals_user` (`user_id`),
  KEY `fk_proposals_reviewer` (`reviewed_by`),
  CONSTRAINT `fk_proposals_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_proposals_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_proposals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proposals`
--

LOCK TABLES `proposals` WRITE;
/*!40000 ALTER TABLE `proposals` DISABLE KEYS */;
/*!40000 ALTER TABLE `proposals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `sales_id` varchar(36) NOT NULL,
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
  PRIMARY KEY (`sales_id`),
  KEY `fk_sales_store` (`store_id`),
  KEY `fk_sales_user` (`user_id`),
  CONSTRAINT `fk_sales_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sales_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES ('018335d1-17e9-4c3f-9d03-061da00102db',2,'54a63740-4b35-4caa-87da-62c597b0665f','2025-09-26 19:06:03',103500.00,2,51750.00,10000.00,93500.00,23.000,32.000,9.000,30000.00,20000.00,'[{\"id\":\"1758913545993\",\"description\":\"a\",\"amount\":30000}]','[{\"id\":\"1758913540995\",\"description\":\"l\",\"amount\":20000}]','pagi','07:00','14:00','2025-09-26-54a63740-4b35-4caa-87da-62c597b0665f-2','2025-09-26 19:06:03'),('2843c580-399d-4cbe-aee3-4ceb161f3c01',1,'54a63740-4b35-4caa-87da-62c597b0665f','2025-09-23 00:00:00',195000.00,2,97500.00,20000.00,95000.00,10.000,20.000,10.000,200000.00,100000.00,'[{\"description\":\"bang dedi\",\"amount\":200000}]','[{\"description\":\"makan\",\"amount\":50000},{\"description\":\"minum\",\"amount\":50000}]','pagi','07:00','14:00',NULL,'2025-09-26 20:16:55'),('2f884568-7a33-42e4-9d08-848998e5328a',2,'54a63740-4b35-4caa-87da-62c597b0665f','2025-09-25 00:00:00',210105.00,3,70035.00,0.00,210105.00,1946.510,1964.780,18.270,NULL,NULL,NULL,NULL,'pagi','07:41','13:45',NULL,'2025-09-26 18:30:59'),('53ed4d7a-8220-40fd-b294-aa2002dc77d3',1,'54a63740-4b35-4caa-87da-62c597b0665f','2025-09-22 17:00:00',195000.00,2,97500.00,20000.00,95000.00,10.000,20.000,10.000,200000.00,100000.00,'[{\"description\":\"bang dedi\",\"amount\":200000}]','[{\"description\":\"makan\",\"amount\":50000},{\"description\":\"minum\",\"amount\":50000}]','pagi','07:00','14:00',NULL,'2025-09-26 20:03:17'),('86fd8b43-ce51-4238-8be3-5aa032bb5cbc',2,'54a63740-4b35-4caa-87da-62c597b0665f','2025-09-27 00:00:00',24000000.00,240,100000.00,2000000.00,21000000.00,1000.000,3000.000,2000.000,4000000.00,1000000.00,NULL,NULL,'pagi','07:00','14:00',NULL,'2025-09-26 21:34:38'),('aee293f8-31db-479b-9db2-056d99da2a38',1,'68ceed41-485b-43eb-8ef5-b805db398cb0','2025-09-25 00:00:00',688250.00,7,98321.43,180000.00,688250.00,1964.780,2040.280,75.500,NULL,NULL,NULL,NULL,'siang','14:00','23:01',NULL,'2025-09-26 08:56:57'),('e9c0c419-df40-4529-9fd0-d8028b1d3119',2,'54a63740-4b35-4caa-87da-62c597b0665f','2025-09-26 20:53:44',114895.00,2,57447.50,123.00,114877.00,10.000,20.000,10.000,231.00,213.00,'[{\"id\":\"1758920015830\",\"description\":\"asd\",\"amount\":231}]','[{\"id\":\"1758920012835\",\"description\":\"asd\",\"amount\":213}]','pagi','07:23','14:04','2025-09-26-54a63740-4b35-4caa-87da-62c597b0665f-2','2025-09-26 20:53:43'),('efd0405c-e0c7-435d-b48f-fda13a71bb56',2,'df880e37-a056-436d-a258-6f3e8262bc1d','2025-09-26 19:23:53',1030288.00,2,515144.00,123212.00,1130288.00,123.000,232.000,109.000,23123.00,123123.00,'[{\"id\":\"1758914615199\",\"description\":\"s\",\"amount\":23123}]','[{\"id\":\"1758914610888\",\"description\":\"as\",\"amount\":123123}]','pagi','07:00','23:00','2025-09-26-df880e37-a056-436d-a258-6f3e8262bc1d-2','2025-09-26 19:23:53');
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `setoran`
--

DROP TABLE IF EXISTS `setoran`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `setoran` (
  `setoran_id` varchar(36) NOT NULL,
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
  PRIMARY KEY (`setoran_id`),
  KEY `fk_setoran_user` (`employee_id`),
  CONSTRAINT `fk_setoran_user` FOREIGN KEY (`employee_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `setoran`
--

LOCK TABLES `setoran` WRITE;
/*!40000 ALTER TABLE `setoran` DISABLE KEYS */;
INSERT INTO `setoran` VALUES ('1bd807ee-8a77-4ac4-8a55-168103f896f3','Hafiz','54a63740-4b35-4caa-87da-62c597b0665f','07:00','14:00',23.000,32.000,9.000,103500.00,10000.00,93500.00,'[{\"id\":\"1758913540995\",\"description\":\"l\",\"amount\":20000}]',20000.00,'[{\"id\":\"1758913545993\",\"description\":\"a\",\"amount\":30000}]',30000.00,103500.00,'2025-09-26 19:06:00'),('46017399-aee6-4f07-8485-3bfa7c25a1d9','Endang','df880e37-a056-436d-a258-6f3e8262bc1d','07:00','23:00',123.000,232.000,109.000,1253500.00,123212.00,1130288.00,'[{\"id\":\"1758914610888\",\"description\":\"as\",\"amount\":123123}]',123123.00,'[{\"id\":\"1758914615199\",\"description\":\"s\",\"amount\":23123}]',23123.00,1030288.00,'2025-09-26 19:23:49'),('7cec866b-ad2b-42d4-a433-af342f38d9b3','Hafiz','54a63740-4b35-4caa-87da-62c597b0665f','07:23','14:04',10.000,20.000,10.000,115000.00,123.00,114877.00,'[{\"id\":\"1758920012835\",\"description\":\"asd\",\"amount\":213}]',213.00,'[{\"id\":\"1758920015830\",\"description\":\"asd\",\"amount\":231}]',231.00,114895.00,'2025-09-26 20:53:42'),('bd447aab-ae29-4e57-a7b9-a2fb148fd00b','Hafiz','54a63740-4b35-4caa-87da-62c597b0665f','07:00','14:00',1000.000,3000.000,2000.000,23000000.00,2000000.00,21000000.00,'[{\"id\":\"1758919711998\",\"description\":\"makan\",\"amount\":1000000}]',1000000.00,'[{\"id\":\"1758919718613\",\"description\":\"bayar utang\",\"amount\":4000000}]',4000000.00,24000000.00,'2025-09-26 20:49:05'),('c29a0f6f-f351-4b8d-94f9-a88398c2e4fd','Hafiz','54a63740-4b35-4caa-87da-62c597b0665f','02:02','03:03',123.000,12333.000,12210.000,140415000.00,123.00,140414877.00,'[{\"id\":\"1758916470182\",\"description\":\"s\",\"amount\":31312313}]',31312313.00,'[{\"id\":\"1758916473663\",\"description\":\"123\",\"amount\":21312313}]',21312313.00,130414877.00,'2025-09-26 19:54:40');
/*!40000 ALTER TABLE `setoran` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stores`
--

DROP TABLE IF EXISTS `stores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stores` (
  `store_id` int NOT NULL,
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
  PRIMARY KEY (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
INSERT INTO `stores` VALUES (1,'Tiban Hills','123 Main Street','021-1234567','SPBU Manager','Main store location with full services','active','07:00','15:00','15:00','23:00','Asia/Jakarta','2025-09-26 01:23:52'),(2,'Patam Lestari','456 Branch Avenue','021-2345678','SPBU Manager','Branch store location','active','07:00','14:00','14:00','22:00','Asia/Jakarta','2025-09-26 01:23:52');
/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `supplier_id` varchar(36) NOT NULL,
  `name` text NOT NULL,
  `contact_person` text,
  `phone` text,
  `email` text,
  `address` text,
  `description` text,
  `status` text DEFAULT (_utf8mb4'active'),
  `store_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`supplier_id`),
  KEY `fk_suppliers_store` (`store_id`),
  CONSTRAINT `fk_suppliers_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_stores`
--

DROP TABLE IF EXISTS `user_stores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_stores` (
  `user_store_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`user_store_id`),
  KEY `fk_userstores_store` (`store_id`),
  KEY `fk_userstores_user` (`user_id`),
  CONSTRAINT `fk_userstores_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_userstores_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_stores`
--

LOCK TABLES `user_stores` WRITE;
/*!40000 ALTER TABLE `user_stores` DISABLE KEYS */;
INSERT INTO `user_stores` VALUES ('02dc9927-89c2-4581-a41a-da523993b3b2','4e6f8c80-2116-414d-918b-2adb872bb3d7',1,'2025-09-26 21:23:46'),('02e71a6c-2229-4e0e-8854-1f8ff2e2f181','68ceed41-485b-43eb-8ef5-b805db398cb0',2,'2025-09-26 21:23:38'),('16f047ed-8f6b-4919-aa5d-f34edecd5742','40603306-34ce-4e7b-845d-32c2fc4aee93',2,'2025-09-26 21:23:50'),('a36eba39-d7f7-4320-b8e0-8c91194b923f','4e6f8c80-2116-414d-918b-2adb872bb3d7',2,'2025-09-26 21:23:46'),('a8e192a3-b10e-4855-b534-626fc47b373d','df880e37-a056-436d-a258-6f3e8262bc1d',1,'2025-09-26 21:23:31'),('e535a919-acb6-449f-aba6-69c38ff5c406','40603306-34ce-4e7b-845d-32c2fc4aee93',1,'2025-09-26 21:23:50'),('fac93fc3-16b5-4781-9f32-20b655fa2b1c','54a63740-4b35-4caa-87da-62c597b0665f',2,'2025-09-26 21:23:42');
/*!40000 ALTER TABLE `user_stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` text NOT NULL,
  `name` text NOT NULL,
  `role` text NOT NULL,
  `phone` text,
  `salary` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('40603306-34ce-4e7b-845d-32c2fc4aee93','manager@spbu.com','5271478b189e6f1a73a316f86209ec8900d93fa807d652fc52c5951b8ab154188a4a1525c47fce5f96b066b881a401e4ae071c81415a00f69f460b78efaeca2d.da313ffd30f2db8b47324dc4f8790eb5','SPBU Manager','manager',NULL,15000000.00,'2025-09-26 01:23:54'),('4e6f8c80-2116-414d-918b-2adb872bb3d7','admin@spbu.com','759776d92a32102a24edb143b4f36cf660affaf3d9fa784fe630f35774134f8aecacfbcae9e029d6581944c3cd7ac04e959a8b60b2d891905681ea4ebe48c32a.20118937654ceaf9c2243452b9d45176','SPBU Administrator','administrasi',NULL,12000000.00,'2025-09-26 01:23:54'),('54a63740-4b35-4caa-87da-62c597b0665f','hafiz@spbu.com','f8e14a0f76ba4974428766d8553eadf7ab401c0701954efc4f4f4c57849617d3528a7e0a9ecc75fed8c8310951ef8a31e9f52e5900e9a7313eb9ca1e9fdd8bd3.0cf9d50b14833796f0b545a01b1878d4','Hafiz','staff',NULL,1800000.00,'2025-09-26 01:23:54'),('68ceed41-485b-43eb-8ef5-b805db398cb0','putri@spbu.com','89f4b4d54a5f0f28b586ef8936300d987322e4572afb57e9d4f986cba650252b04a31f619deedeace07cdc503e77f3e9e4352901295a50e80f3d7e1bc27688d2.4e5f7e37609aab482b30efd65cdd5197','Putri','staff',NULL,1800000.00,'2025-09-26 01:23:54'),('df880e37-a056-436d-a258-6f3e8262bc1d','endang@spbu.com','0659c1c5370c59ef337def93d03324cb6a9a9929019b687bedb9efb1c1cb1251011e3a355b1ecf6b5377f0ebb4dffe0c9d5502b64ffa6de9dab62a1295abee67.a7692c21b1dffba27338067710e85d2a','Endang','staff',NULL,4000000.00,'2025-09-26 01:23:54');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wallets`
--

DROP TABLE IF EXISTS `wallets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallets` (
  `wallet_id` varchar(36) NOT NULL,
  `store_id` int NOT NULL,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `balance` decimal(15,2) DEFAULT '0.00',
  `account_number` text,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`wallet_id`),
  KEY `fk_wallets_store` (`store_id`),
  CONSTRAINT `fk_wallets_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wallets`
--

LOCK TABLES `wallets` WRITE;
/*!40000 ALTER TABLE `wallets` DISABLE KEYS */;
/*!40000 ALTER TABLE `wallets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'defaultdb'
--

--
-- Dumping routines for database 'defaultdb'
--
/*!50003 DROP PROCEDURE IF EXISTS `show_all_tables_contents` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'REAL_AS_FLOAT,PIPES_AS_CONCAT,ANSI_QUOTES,IGNORE_SPACE,ONLY_FULL_GROUP_BY,ANSI,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER="avnadmin"@"%" PROCEDURE "show_all_tables_contents"()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE tbl_name VARCHAR(255);
    DECLARE cur CURSOR FOR 
        SELECT table_name 
        FROM information_schema.tables
        WHERE table_schema = 'defaultdb';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Temp table untuk menampung hasil
    DROP TEMPORARY TABLE IF EXISTS temp_output;
    CREATE TEMPORARY TABLE temp_output(
        table_name VARCHAR(255),
        row_data TEXT
    );

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO tbl_name;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SET @sql_text = CONCAT(
            'INSERT INTO temp_output(table_name, row_data) ',
            'SELECT ''', tbl_name, ''', CONCAT_WS('','', *) FROM `', tbl_name, '`'
        );

        PREPARE stmt FROM @sql_text;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;

    CLOSE cur;

    -- Tampilkan hasil
    SELECT * FROM temp_output;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-27  5:24:55
