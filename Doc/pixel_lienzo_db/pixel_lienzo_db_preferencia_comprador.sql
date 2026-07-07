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
-- Table structure for table `preferencia_comprador`
--

DROP TABLE IF EXISTS `preferencia_comprador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preferencia_comprador` (
  `id_comprador` int NOT NULL,
  `id_categoria` int NOT NULL,
  PRIMARY KEY (`id_comprador`,`id_categoria`),
  KEY `fk_preferencia_categoria` (`id_categoria`),
  CONSTRAINT `fk_preferencia_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria_arte` (`id_categoria`) ON DELETE CASCADE,
  CONSTRAINT `fk_preferencia_comprador` FOREIGN KEY (`id_comprador`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preferencia_comprador`
--

LOCK TABLES `preferencia_comprador` WRITE;
/*!40000 ALTER TABLE `preferencia_comprador` DISABLE KEYS */;
INSERT INTO `preferencia_comprador` VALUES (26,1),(26,2),(27,3),(27,5),(28,6),(29,7),(30,8),(31,9),(32,10),(33,11),(34,12),(35,13),(36,14),(37,15),(38,16),(39,17),(40,18),(41,19),(42,20),(43,21),(26,22),(27,23),(28,24),(29,25),(30,26),(31,27),(32,28),(33,29),(34,30),(35,31),(36,32),(37,33),(38,34),(39,35),(40,36),(41,37),(42,38),(43,39),(44,40),(45,41),(26,42),(27,43),(28,44),(29,45),(30,46),(31,47),(32,48),(33,49),(34,50),(35,51);
/*!40000 ALTER TABLE `preferencia_comprador` ENABLE KEYS */;
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
