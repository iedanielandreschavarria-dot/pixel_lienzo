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
-- Table structure for table `categoria_arte`
--

DROP TABLE IF EXISTS `categoria_arte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria_arte` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(100) NOT NULL,
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `nombre_categoria` (`nombre_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoria_arte`
--

LOCK TABLES `categoria_arte` WRITE;
/*!40000 ALTER TABLE `categoria_arte` DISABLE KEYS */;
INSERT INTO `categoria_arte` VALUES (37,'Abstracción Lírica'),(7,'Acrílico'),(6,'Acuarela'),(20,'Aguafuerte'),(10,'Arte Cinético'),(29,'Arte Conceptual'),(38,'Arte Informal'),(27,'Arte Pop Contemporáneo'),(42,'Arte Povera'),(40,'Arte Psicodélico'),(17,'Arte Textil'),(50,'Arte Urbano Phygital'),(14,'Carboncillo'),(12,'Cerámica'),(19,'Collage'),(34,'Constructivismo'),(23,'Cubismo'),(32,'Dadaísmo Provocador'),(2,'Escultura'),(13,'Escultura en Bronce'),(26,'Expresionismo Moderno'),(25,'Fauvismo'),(45,'Fluxus Experimental'),(3,'Fotografía'),(33,'Futurismo Dinámico'),(5,'Grabado'),(49,'Grafiti de Galería'),(44,'Happening Histórico'),(31,'Hiperrealismo Avanzado'),(22,'Impresionismo'),(18,'Instalación'),(47,'Instalación Interactiva'),(41,'Land Art (Arte de la Tierra)'),(8,'Litografía'),(28,'Minimalismo Puro'),(11,'Mosaico'),(48,'Muralismo Moderno'),(36,'Neo-Plasticismo (De Stijl)'),(1,'Óleo'),(39,'Op Art (Arte Óptico)'),(15,'Pastel'),(43,'Performance Documentado'),(51,'Pintura Corporal Impresa'),(30,'Realismo Clásico'),(35,'Suprematismo'),(24,'Surrealismo'),(21,'Técnica Mixta'),(16,'Tinta China'),(46,'Videoarte Loop'),(9,'Xilografía');
/*!40000 ALTER TABLE `categoria_arte` ENABLE KEYS */;
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
