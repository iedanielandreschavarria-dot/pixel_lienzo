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
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `correo_electronico` varchar(255) NOT NULL,
  `contrasenia` varchar(255) NOT NULL,
  `id_rol` int NOT NULL,
  `mfa_activado` tinyint(1) DEFAULT '0',
  `estado_cuenta` varchar(20) DEFAULT 'Activo',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `correo_electronico` (`correo_electronico`),
  KEY `fk_usuario_rol` (`id_rol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`) ON DELETE RESTRICT,
  CONSTRAINT `chk_estado_cuenta` CHECK ((`estado_cuenta` in (_utf8mb4'Activo',_utf8mb4'Inhabilitado')))
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'admin1@pixelylienzo.com','hash_secure_password_1',1,1,'Activo','2026-06-17 19:54:51'),(2,'admin2@pixelylienzo.com','hash_secure_password_2',1,0,'Activo','2026-06-17 19:54:51'),(3,'curador1@pixelylienzo.com','hash_secure_password_3',2,1,'Activo','2026-06-17 19:54:51'),(4,'curador2@pixelylienzo.com','hash_secure_password_4',2,0,'Activo','2026-06-17 19:54:51'),(5,'curador3@pixelylienzo.com','hash_secure_password_5',2,1,'Activo','2026-06-17 19:54:51'),(6,'artista1@mail.com','pass_art_1',3,1,'Activo','2026-06-17 19:54:51'),(7,'artista2@mail.com','pass_art_2',3,0,'Activo','2026-06-17 19:54:51'),(8,'artista3@mail.com','pass_art_3',3,0,'Activo','2026-06-17 19:54:51'),(9,'artista4@mail.com','pass_art_4',3,1,'Activo','2026-06-17 19:54:51'),(10,'artista5@mail.com','pass_art_5',3,0,'Activo','2026-06-17 19:54:51'),(11,'artista6@mail.com','pass_art_6',3,0,'Activo','2026-06-17 19:54:51'),(12,'artista7@mail.com','pass_art_7',3,1,'Activo','2026-06-17 19:54:51'),(13,'artista8@mail.com','pass_art_8',3,0,'Activo','2026-06-17 19:54:51'),(14,'artista9@mail.com','pass_art_9',3,0,'Activo','2026-06-17 19:54:51'),(15,'artista10@mail.com','pass_art_10',3,1,'Activo','2026-06-17 19:54:51'),(16,'artista11@mail.com','pass_art_11',3,0,'Activo','2026-06-17 19:54:51'),(17,'artista12@mail.com','pass_art_12',3,0,'Activo','2026-06-17 19:54:51'),(18,'artista13@mail.com','pass_art_13',3,1,'Activo','2026-06-17 19:54:51'),(19,'artista14@mail.com','pass_art_14',3,0,'Activo','2026-06-17 19:54:51'),(20,'artista15@mail.com','pass_art_15',3,0,'Activo','2026-06-17 19:54:51'),(21,'artista16@mail.com','pass_art_16',3,1,'Activo','2026-06-17 19:54:51'),(22,'artista17@mail.com','pass_art_17',3,0,'Activo','2026-06-17 19:54:51'),(23,'artista18@mail.com','pass_art_18',3,0,'Activo','2026-06-17 19:54:51'),(24,'artista19@mail.com','pass_art_19',3,1,'Activo','2026-06-17 19:54:51'),(25,'artista20@mail.com','pass_art_20',3,0,'Activo','2026-06-17 19:54:51'),(26,'comprador1@mail.com','pass_buy_1',4,0,'Activo','2026-06-17 19:54:51'),(27,'comprador2@mail.com','pass_buy_2',4,0,'Activo','2026-06-17 19:54:51'),(28,'comprador3@mail.com','pass_buy_3',4,1,'Activo','2026-06-17 19:54:51'),(29,'comprador4@mail.com','pass_buy_4',4,0,'Activo','2026-06-17 19:54:51'),(30,'comprador5@mail.com','pass_buy_5',4,0,'Activo','2026-06-17 19:54:51'),(31,'comprador6@mail.com','pass_buy_6',4,0,'Activo','2026-06-17 19:54:51'),(32,'comprador7@mail.com','pass_buy_7',4,0,'Activo','2026-06-17 19:54:51'),(33,'comprador8@mail.com','pass_buy_8',4,1,'Activo','2026-06-17 19:54:51'),(34,'comprador9@mail.com','pass_buy_9',4,0,'Activo','2026-06-17 19:54:51'),(35,'comprador10@mail.com','pass_buy_10',4,0,'Activo','2026-06-17 19:54:51'),(36,'comprador11@mail.com','pass_buy_11',4,0,'Activo','2026-06-17 19:54:51'),(37,'comprador12@mail.com','pass_buy_12',4,0,'Activo','2026-06-17 19:54:51'),(38,'comprador13@mail.com','pass_buy_13',4,1,'Activo','2026-06-17 19:54:51'),(39,'comprador14@mail.com','pass_buy_14',4,0,'Activo','2026-06-17 19:54:51'),(40,'comprador15@mail.com','pass_buy_15',4,0,'Activo','2026-06-17 19:54:51'),(41,'comprador16@mail.com','pass_buy_16',4,0,'Activo','2026-06-17 19:54:51'),(42,'comprador17@mail.com','pass_buy_17',4,0,'Activo','2026-06-17 19:54:51'),(43,'comprador18@mail.com','pass_buy_18',4,1,'Activo','2026-06-17 19:54:51'),(44,'comprador19@mail.com','pass_buy_19',4,0,'Activo','2026-06-17 19:54:51'),(45,'comprador20@mail.com','pass_buy_20',4,0,'Activo','2026-06-17 19:54:51'),(46,'artista21@mail.com','pass_art_21',3,1,'Activo','2026-06-18 10:00:47'),(47,'artista22@mail.com','pass_art_22',3,0,'Activo','2026-06-18 10:00:47'),(48,'artista23@mail.com','pass_art_23',3,0,'Activo','2026-06-18 10:00:47'),(49,'artista24@mail.com','pass_art_24',3,1,'Activo','2026-06-18 10:00:47'),(50,'artista25@mail.com','pass_art_25',3,0,'Activo','2026-06-18 10:00:47'),(51,'artista26@mail.com','pass_art_26',3,0,'Activo','2026-06-18 10:00:47'),(52,'artista27@mail.com','pass_art_27',3,1,'Activo','2026-06-18 10:00:47'),(53,'artista28@mail.com','pass_art_28',3,0,'Activo','2026-06-18 10:00:47'),(54,'artista29@mail.com','pass_art_29',3,0,'Activo','2026-06-18 10:00:47'),(55,'artista30@mail.com','pass_art_30',3,1,'Activo','2026-06-18 10:00:47'),(56,'artista31@mail.com','pass_art_31',3,0,'Activo','2026-06-18 10:00:47'),(57,'artista32@mail.com','pass_art_32',3,0,'Activo','2026-06-18 10:00:47'),(58,'artista33@mail.com','pass_art_33',3,1,'Activo','2026-06-18 10:00:47'),(59,'artista34@mail.com','pass_art_34',3,0,'Activo','2026-06-18 10:00:47'),(60,'artista35@mail.com','pass_art_35',3,0,'Activo','2026-06-18 10:00:47'),(61,'artista36@mail.com','pass_art_36',3,1,'Activo','2026-06-18 10:00:47'),(62,'artista37@mail.com','pass_art_37',3,0,'Activo','2026-06-18 10:00:47'),(63,'artista38@mail.com','pass_art_38',3,0,'Activo','2026-06-18 10:00:47'),(64,'artista39@mail.com','pass_art_39',3,1,'Activo','2026-06-18 10:00:47'),(65,'artista40@mail.com','pass_art_40',3,0,'Activo','2026-06-18 10:00:47'),(66,'artista41@mail.com','pass_art_41',3,0,'Activo','2026-06-18 10:00:47'),(67,'artista42@mail.com','pass_art_42',3,1,'Activo','2026-06-18 10:00:47'),(68,'artista43@mail.com','pass_art_43',3,0,'Activo','2026-06-18 10:00:47'),(69,'artista44@mail.com','pass_art_44',3,0,'Activo','2026-06-18 10:00:47'),(70,'artista45@mail.com','pass_art_45',3,1,'Activo','2026-06-18 10:00:47'),(71,'artista46@mail.com','pass_art_46',3,0,'Activo','2026-06-18 10:00:47'),(72,'artista47@mail.com','pass_art_47',3,0,'Activo','2026-06-18 10:00:47'),(73,'artista48@mail.com','pass_art_48',3,1,'Activo','2026-06-18 10:00:47'),(74,'artista49@mail.com','pass_art_49',3,0,'Activo','2026-06-18 10:00:47'),(75,'artista50@mail.com','pass_art_50',3,0,'Activo','2026-06-18 10:00:47');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
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
