-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: pixel_lienzo_db
-- ------------------------------------------------------
-- Server version	8.0.45

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

--
-- Table structure for table `certificado_autenticidad`
--

DROP TABLE IF EXISTS `certificado_autenticidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificado_autenticidad` (
  `id_certificado` int NOT NULL AUTO_INCREMENT,
  `id_obra` int NOT NULL,
  `firma_digital_curador` text NOT NULL,
  `sello_tiempo` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `codigo_qr_validacion` varchar(500) DEFAULT NULL,
  `pdf_certificado_url` varchar(500) NOT NULL,
  PRIMARY KEY (`id_certificado`),
  UNIQUE KEY `id_obra` (`id_obra`),
  CONSTRAINT `fk_certificado_obra` FOREIGN KEY (`id_obra`) REFERENCES `obra_arte` (`id_obra`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificado_autenticidad`
--

LOCK TABLES `certificado_autenticidad` WRITE;
/*!40000 ALTER TABLE `certificado_autenticidad` DISABLE KEYS */;
INSERT INTO `certificado_autenticidad` VALUES (1,1,'firm_cur_01_valid_hash','2026-06-17 19:54:51','VAL_QR_001','http://store.com/cert1.pdf'),(2,2,'firm_cur_01_valid_hash','2026-06-17 19:54:51','VAL_QR_002','http://store.com/cert2.pdf'),(3,3,'firm_cur_02_valid_hash','2026-06-17 19:54:51','VAL_QR_003','http://store.com/cert3.pdf'),(4,4,'firm_cur_02_valid_hash','2026-06-17 19:54:51','VAL_QR_004','http://store.com/cert4.pdf'),(5,5,'firm_cur_03_valid_hash','2026-06-17 19:54:51','VAL_QR_005','http://store.com/cert5.pdf'),(6,6,'firm_cur_01_valid_hash','2026-06-17 19:54:51','VAL_QR_006','http://store.com/cert6.pdf'),(7,7,'firm_cur_03_valid_hash','2026-06-17 19:54:51','VAL_QR_007','http://store.com/cert7.pdf'),(8,8,'firm_cur_02_valid_hash','2026-06-17 19:54:51','VAL_QR_008','http://store.com/cert8.pdf'),(9,9,'firm_cur_01_valid_hash','2026-06-17 19:54:51','VAL_QR_009','http://store.com/cert9.pdf'),(10,10,'firm_cur_03_valid_hash','2026-06-17 19:54:51','VAL_QR_010','http://store.com/cert10.pdf'),(11,11,'firm_cur_01_valid_hash','2026-06-17 19:54:51','VAL_QR_011','http://store.com/cert11.pdf'),(12,12,'firm_cur_02_valid_hash','2026-06-17 19:54:51','VAL_QR_012','http://store.com/cert12.pdf'),(13,13,'firm_cur_03_valid_hash','2026-06-17 19:54:51','VAL_QR_013','http://store.com/cert13.pdf'),(14,14,'firm_cur_02_valid_hash','2026-06-17 19:54:51','VAL_QR_014','http://store.com/cert14.pdf'),(15,15,'firm_cur_01_valid_hash','2026-06-17 19:54:51','VAL_QR_015','http://store.com/cert15.pdf'),(16,16,'firm_cur_03_valid_hash','2026-06-17 19:54:51','VAL_QR_016','http://store.com/cert16.pdf'),(17,17,'firm_cur_02_valid_hash','2026-06-17 19:54:51','VAL_QR_017','http://store.com/cert17.pdf'),(18,18,'firm_cur_01_valid_hash','2026-06-17 19:54:51','VAL_QR_018','http://store.com/cert18.pdf'),(19,19,'firm_cur_03_valid_hash','2026-06-17 19:54:51','VAL_QR_019','http://store.com/cert19.pdf'),(20,20,'firm_cur_02_valid_hash','2026-06-17 19:54:51','VAL_QR_020','http://store.com/cert20.pdf'),(21,21,'firm_cur_01_hash_21','2026-06-18 10:00:47','VAL_QR_021','http://store.com/cert21.pdf'),(22,22,'firm_cur_01_hash_22','2026-06-18 10:00:47','VAL_QR_022','http://store.com/cert22.pdf'),(23,23,'firm_cur_02_hash_23','2026-06-18 10:00:47','VAL_QR_023','http://store.com/cert23.pdf'),(24,24,'firm_cur_02_hash_24','2026-06-18 10:00:47','VAL_QR_024','http://store.com/cert24.pdf'),(25,25,'firm_cur_03_hash_25','2026-06-18 10:00:47','VAL_QR_025','http://store.com/cert25.pdf'),(26,26,'firm_cur_01_hash_26','2026-06-18 10:00:47','VAL_QR_026','http://store.com/cert26.pdf'),(27,27,'firm_cur_03_hash_27','2026-06-18 10:00:47','VAL_QR_027','http://store.com/cert27.pdf'),(28,28,'firm_cur_02_hash_28','2026-06-18 10:00:47','VAL_QR_028','http://store.com/cert28.pdf'),(29,29,'firm_cur_01_hash_29','2026-06-18 10:00:47','VAL_QR_029','http://store.com/cert29.pdf'),(30,30,'firm_cur_03_hash_30','2026-06-18 10:00:47','VAL_QR_030','http://store.com/cert30.pdf'),(31,31,'firm_cur_01_hash_31','2026-06-18 10:00:47','VAL_QR_031','http://store.com/cert31.pdf'),(32,32,'firm_cur_02_hash_32','2026-06-18 10:00:47','VAL_QR_032','http://store.com/cert32.pdf'),(33,33,'firm_cur_03_hash_33','2026-06-18 10:00:47','VAL_QR_033','http://store.com/cert33.pdf'),(34,34,'firm_cur_02_hash_34','2026-06-18 10:00:47','VAL_QR_034','http://store.com/cert34.pdf'),(35,35,'firm_cur_01_hash_35','2026-06-18 10:00:47','VAL_QR_035','http://store.com/cert35.pdf'),(36,36,'firm_cur_03_hash_36','2026-06-18 10:00:47','VAL_QR_036','http://store.com/cert36.pdf'),(37,37,'firm_cur_02_hash_37','2026-06-18 10:00:47','VAL_QR_037','http://store.com/cert37.pdf'),(38,38,'firm_cur_01_hash_38','2026-06-18 10:00:47','VAL_QR_038','http://store.com/cert38.pdf'),(39,39,'firm_cur_03_hash_39','2026-06-18 10:00:47','VAL_QR_039','http://store.com/cert39.pdf'),(40,40,'firm_cur_02_hash_40','2026-06-18 10:00:47','VAL_QR_040','http://store.com/cert40.pdf'),(41,41,'firm_cur_01_hash_41','2026-06-18 10:00:47','VAL_QR_041','http://store.com/cert41.pdf'),(42,42,'firm_cur_03_hash_42','2026-06-18 10:00:47','VAL_QR_042','http://store.com/cert42.pdf'),(43,43,'firm_cur_02_hash_43','2026-06-18 10:00:47','VAL_QR_043','http://store.com/cert43.pdf'),(44,44,'firm_cur_01_hash_44','2026-06-18 10:00:47','VAL_QR_044','http://store.com/cert44.pdf'),(45,45,'firm_cur_03_hash_45','2026-06-18 10:00:47','VAL_QR_045','http://store.com/cert45.pdf'),(46,46,'firm_cur_02_hash_46','2026-06-18 10:00:47','VAL_QR_046','http://store.com/cert46.pdf'),(47,47,'firm_cur_01_hash_47','2026-06-18 10:00:47','VAL_QR_047','http://store.com/cert47.pdf'),(48,48,'firm_cur_03_hash_48','2026-06-18 10:00:47','VAL_QR_048','http://store.com/cert48.pdf'),(49,49,'firm_cur_02_hash_49','2026-06-18 10:00:47','VAL_QR_049','http://store.com/cert49.pdf'),(50,50,'firm_cur_01_hash_50','2026-06-18 10:00:47','VAL_QR_050','http://store.com/cert50.pdf');
/*!40000 ALTER TABLE `certificado_autenticidad` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-06 12:14:47
