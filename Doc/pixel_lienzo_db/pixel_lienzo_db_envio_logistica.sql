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
-- Table structure for table `envio_logistica`
--

DROP TABLE IF EXISTS `envio_logistica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `envio_logistica` (
  `id_envio` int NOT NULL AUTO_INCREMENT,
  `id_transaccion` int NOT NULL,
  `tipo_envio` varchar(20) NOT NULL,
  `costo_envio` decimal(10,2) NOT NULL,
  `valor_seguro` decimal(10,2) NOT NULL,
  `guia_transporte` varchar(100) DEFAULT NULL,
  `estado_envio` varchar(30) DEFAULT 'Empacado',
  `foto_recepcion_url` varchar(500) DEFAULT NULL,
  `firma_digital_comprador` text,
  PRIMARY KEY (`id_envio`),
  UNIQUE KEY `id_transaccion` (`id_transaccion`),
  CONSTRAINT `fk_envio_transaccion` FOREIGN KEY (`id_transaccion`) REFERENCES `transaccion` (`id_transaccion`) ON DELETE RESTRICT,
  CONSTRAINT `chk_estado_envio` CHECK ((`estado_envio` in (_utf8mb4'Empacado',_utf8mb4'En Camino',_utf8mb4'En Centro de Distribución',_utf8mb4'Entregado',_utf8mb4'En Reclamación'))),
  CONSTRAINT `chk_tipo_envio` CHECK ((`tipo_envio` in (_utf8mb4'Estándar',_utf8mb4'Express')))
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `envio_logistica`
--

LOCK TABLES `envio_logistica` WRITE;
/*!40000 ALTER TABLE `envio_logistica` DISABLE KEYS */;
INSERT INTO `envio_logistica` VALUES (1,1,'Express',80.00,2500.00,'TRK-001','En Reclamación',NULL,NULL),(2,2,'Express',150.00,4800.00,'TRK-002','Entregado','http://img.com/rec2.jpg','firma_buyer_27'),(3,3,'Estándar',45.00,1200.00,'TRK-003','Entregado','http://img.com/rec3.jpg','firma_buyer_28'),(4,4,'Estándar',35.00,750.00,'TRK-004','En Camino',NULL,NULL),(5,5,'Express',90.00,3100.00,'TRK-005','En Centro de Distribución',NULL,NULL),(6,6,'Estándar',40.00,950.00,'TRK-006','Empacado',NULL,NULL),(7,7,'Estándar',55.00,1800.00,'TRK-007','En Camino',NULL,NULL),(8,8,'Express',250.00,6200.00,'TRK-008','En Centro de Distribución',NULL,NULL),(9,9,'Express',300.00,8500.00,'TRK-009','En Camino',NULL,NULL),(10,10,'Estándar',50.00,1100.00,'TRK-010','Empacado',NULL,NULL),(11,11,'Estándar',50.00,1300.00,'TRK-011','En Camino',NULL,NULL),(12,12,'Express',180.00,5400.00,'TRK-012','En Centro de Distribución',NULL,NULL),(13,13,'Estándar',45.00,1600.00,'TRK-013','Empacado',NULL,NULL),(14,14,'Express',140.00,4200.00,'TRK-014','En Camino',NULL,NULL),(15,15,'Estándar',35.00,900.00,'TRK-015','Empacado',NULL,NULL),(16,16,'Estándar',40.00,1050.00,'TRK-016','En Camino',NULL,NULL),(17,17,'Express',110.00,3700.00,'TRK-017','En Centro de Distribución',NULL,NULL),(18,18,'Estándar',60.00,1400.00,'TRK-018','Empacado',NULL,NULL),(19,19,'Estándar',45.00,1250.00,'TRK-019','En Camino',NULL,NULL),(20,20,'Express',95.00,2900.00,'TRK-020','Empacado',NULL,NULL),(21,21,'Express',85.00,1950.00,'TRK-021','Entregado','http://img.com/rec21.jpg','firma_buyer_26'),(22,22,'Express',140.00,3400.00,'TRK-022','Entregado','http://img.com/rec22.jpg','firma_buyer_27'),(23,23,'Estándar',50.00,2800.00,'TRK-023','Entregado','http://img.com/rec23.jpg','firma_buyer_28'),(24,24,'Estándar',40.00,1150.00,'TRK-024','En Camino',NULL,NULL),(25,25,'Express',95.00,4500.00,'TRK-025','En Centro de Distribución',NULL,NULL),(26,26,'Estándar',45.00,1600.00,'TRK-026','Empacado',NULL,NULL),(27,27,'Estándar',60.00,2100.00,'TRK-027','En Camino',NULL,NULL),(28,28,'Express',220.00,5200.00,'TRK-028','En Centro de Distribución',NULL,NULL),(29,29,'Express',110.00,2300.00,'TRK-029','En Camino',NULL,NULL),(30,30,'Estándar',70.00,6700.00,'TRK-030','Empacado',NULL,NULL),(31,31,'Estándar',45.00,1400.00,'TRK-031','En Camino',NULL,NULL),(32,32,'Express',190.00,4900.00,'TRK-032','En Centro de Distribución',NULL,NULL),(33,33,'Estándar',55.00,3100.00,'TRK-033','Empacado',NULL,NULL),(34,34,'Express',130.00,3800.00,'TRK-034','En Camino',NULL,NULL),(35,35,'Estándar',42.00,1750.00,'TRK-035','Empacado',NULL,NULL),(36,36,'Estándar',38.00,850.00,'TRK-036','En Camino',NULL,NULL),(37,37,'Express',115.00,2900.00,'TRK-037','En Centro de Distribución',NULL,NULL),(38,38,'Estándar',65.00,3300.00,'TRK-038','Empacado',NULL,NULL),(39,39,'Estándar',48.00,4100.00,'TRK-039','En Camino',NULL,NULL),(40,40,'Express',200.00,5500.00,'TRK-040','Empacado',NULL,NULL),(41,41,'Estándar',52.00,2200.00,'TRK-041','En Camino',NULL,NULL),(42,42,'Estándar',40.00,1100.00,'TRK-042','Empacado',NULL,NULL),(43,43,'Estándar',38.00,950.00,'TRK-043','En Camino',NULL,NULL),(44,44,'Estándar',45.00,1300.00,'TRK-044','Empacado',NULL,NULL),(45,45,'Express',110.00,3200.00,'TRK-045','En Centro de Distribución',NULL,NULL),(46,46,'Express',280.00,7500.00,'TRK-046','En Camino',NULL,NULL),(47,47,'Express',310.00,8900.00,'TRK-047','Empacado',NULL,NULL),(48,48,'Estándar',58.00,2400.00,'TRK-048','En Camino',NULL,NULL),(49,49,'Estándar',62.00,2700.00,'TRK-049','Empacado',NULL,NULL),(50,50,'Estándar',46.00,1850.00,'TRK-050','En Reclamación',NULL,NULL);
/*!40000 ALTER TABLE `envio_logistica` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-06 12:14:48
