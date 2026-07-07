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
-- Table structure for table `log_auditoria`
--

DROP TABLE IF EXISTS `log_auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_auditoria` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int DEFAULT NULL,
  `accion_realizada` varchar(100) NOT NULL,
  `detalles` text,
  `tabla_afectada` varchar(100) DEFAULT NULL,
  `fecha_hora` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_log`),
  KEY `fk_log_usuario` (`id_usuario`),
  CONSTRAINT `fk_log_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_auditoria`
--

LOCK TABLES `log_auditoria` WRITE;
/*!40000 ALTER TABLE `log_auditoria` DISABLE KEYS */;
INSERT INTO `log_auditoria` VALUES (1,1,'CONFIGURACION_COMISION_GLOBAL','Se ajustó la comisión base al 15%','Global','2026-06-17 19:54:51'),(2,3,'VALIDACION_PERFIL','Aprobación del perfil del artista ID 6','Perfil_Artista','2026-06-17 19:54:51'),(3,4,'VALIDACION_PERFIL','Aprobación del perfil del artista ID 7','Perfil_Artista','2026-06-17 19:54:51'),(4,1,'INHABILITACION_CUENTA','Se suspendió cuenta fraudulenta temporalmente','Usuario','2026-06-17 19:54:51'),(5,3,'EMISION_CERTIFICADO','Certificación de la obra ID 1 exitosa','Certificado_Autenticidad','2026-06-17 19:54:51'),(6,3,'EMISION_CERTIFICADO','Certificación de la obra ID 2 exitosa','Certificado_Autenticidad','2026-06-17 19:54:51'),(7,5,'EMISION_CERTIFICADO','Certificación de la obra ID 3 exitosa','Certificado_Autenticidad','2026-06-17 19:54:51'),(8,2,'MODIFICACION_PRECIO','Admin corrigió fe de erratas en precio base de obra 5','Obra_Arte','2026-06-17 19:54:51'),(9,1,'DISPERSION_PAGO','Dispersión completada para transacción ID 1','Transaccion','2026-06-17 19:54:51'),(10,1,'DISPERSION_PAGO','Dispersión completada para transacción ID 2','Transaccion','2026-06-17 19:54:51'),(11,4,'AUDITORIA_LOGS','Exportación de logs mensuales de acceso','Log_Auditoria','2026-06-17 19:54:51'),(12,3,'EMISION_CERTIFICADO','Certificación de la obra ID 4 exitosa','Certificado_Autenticidad','2026-06-17 19:54:51'),(13,3,'EMISION_CERTIFICADO','Certificación de la obra ID 5 exitosa','Certificado_Autenticidad','2026-06-17 19:54:51'),(14,5,'EMISION_CERTIFICADO','Certificación de la obra ID 6 exitosa','Certificado_Autenticidad','2026-06-17 19:54:51'),(15,5,'EMISION_CERTIFICADO','Certificación de la obra ID 7 exitosa','Certificado_Autenticidad','2026-06-17 19:54:51'),(16,1,'RESOLUCION_RECLAMACION','Aprobación de seguro para envío ID 1','Reclamacion','2026-06-17 19:54:51'),(17,2,'DISPERSION_PAGO','Dispersión completada para transacción ID 3','Transaccion','2026-06-17 19:54:51'),(18,3,'EMISION_CERTIFICADO','Certificación de la obra ID 8 exitosa','Certificado_Autenticidad','2026-06-17 19:54:51'),(19,4,'VALIDACION_PERFIL','Aprobación del perfil del artista ID 8','Perfil_Artista','2026-06-17 19:54:51'),(20,1,'CONFIGURACION_MFA','Forzado de MFA para cuentas administrativas','Usuario','2026-06-17 19:54:51'),(21,1,'EMISION_CERTIFICADO','Certificación automática de la obra ID 21','Certificado_Autenticidad','2026-06-18 10:00:47'),(22,2,'EMISION_CERTIFICADO','Certificación automática de la obra ID 22','Certificado_Autenticidad','2026-06-18 10:00:47'),(23,3,'EMISION_CERTIFICADO','Certificación automática de la obra ID 23','Certificado_Autenticidad','2026-06-18 10:00:47'),(24,4,'EMISION_CERTIFICADO','Certificación automática de la obra ID 24','Certificado_Autenticidad','2026-06-18 10:00:47'),(25,5,'EMISION_CERTIFICADO','Certificación automática de la obra ID 25','Certificado_Autenticidad','2026-06-18 10:00:47'),(26,1,'EMISION_CERTIFICADO','Certificación automática de la obra ID 26','Certificado_Autenticidad','2026-06-18 10:00:47'),(27,2,'EMISION_CERTIFICADO','Certificación automática de la obra ID 27','Certificado_Autenticidad','2026-06-18 10:00:47'),(28,3,'EMISION_CERTIFICADO','Certificación automática de la obra ID 28','Certificado_Autenticidad','2026-06-18 10:00:47'),(29,4,'EMISION_CERTIFICADO','Certificación automática de la obra ID 29','Certificado_Autenticidad','2026-06-18 10:00:47'),(30,5,'EMISION_CERTIFICADO','Certificación automática de la obra ID 30','Certificado_Autenticidad','2026-06-18 10:00:47'),(31,1,'EMISION_CERTIFICADO','Certificación automática de la obra ID 31','Certificado_Autenticidad','2026-06-18 10:00:47'),(32,2,'EMISION_CERTIFICADO','Certificación automática de la obra ID 32','Certificado_Autenticidad','2026-06-18 10:00:47'),(33,3,'EMISION_CERTIFICADO','Certificación automática de la obra ID 33','Certificado_Autenticidad','2026-06-18 10:00:47'),(34,4,'EMISION_CERTIFICADO','Certificación automática de la obra ID 34','Certificado_Autenticidad','2026-06-18 10:00:47'),(35,5,'EMISION_CERTIFICADO','Certificación automática de la obra ID 35','Certificado_Autenticidad','2026-06-18 10:00:47'),(36,1,'EMISION_CERTIFICADO','Certificación automática de la obra ID 36','Certificado_Autenticidad','2026-06-18 10:00:47'),(37,2,'EMISION_CERTIFICADO','Certificación automática de la obra ID 37','Certificado_Autenticidad','2026-06-18 10:00:47'),(38,3,'EMISION_CERTIFICADO','Certificación automática de la obra ID 38','Certificado_Autenticidad','2026-06-18 10:00:47'),(39,4,'EMISION_CERTIFICADO','Certificación automática de la obra ID 39','Certificado_Autenticidad','2026-06-18 10:00:47'),(40,5,'EMISION_CERTIFICADO','Certificación automática de la obra ID 40','Certificado_Autenticidad','2026-06-18 10:00:47'),(41,1,'EMISION_CERTIFICADO','Certificación automática de la obra ID 41','Certificado_Autenticidad','2026-06-18 10:00:47'),(42,2,'EMISION_CERTIFICADO','Certificación automática de la obra ID 42','Certificado_Autenticidad','2026-06-18 10:00:47'),(43,3,'EMISION_CERTIFICADO','Certificación automática de la obra ID 43','Certificado_Autenticidad','2026-06-18 10:00:47'),(44,4,'EMISION_CERTIFICADO','Certificación automática de la obra ID 44','Certificado_Autenticidad','2026-06-18 10:00:47'),(45,5,'EMISION_CERTIFICADO','Certificación automática de la obra ID 45','Certificado_Autenticidad','2026-06-18 10:00:47'),(46,1,'EMISION_CERTIFICADO','Certificación automática de la obra ID 46','Certificado_Autenticidad','2026-06-18 10:00:47'),(47,2,'EMISION_CERTIFICADO','Certificación automática de la obra ID 47','Certificado_Autenticidad','2026-06-18 10:00:47'),(48,3,'EMISION_CERTIFICADO','Certificación automática de la obra ID 48','Certificado_Autenticidad','2026-06-18 10:00:47'),(49,4,'EMISION_CERTIFICADO','Certificación automática de la obra ID 49','Certificado_Autenticidad','2026-06-18 10:00:47'),(50,5,'EMISION_CERTIFICADO','Certificación automática de la obra ID 50','Certificado_Autenticidad','2026-06-18 10:00:47');
/*!40000 ALTER TABLE `log_auditoria` ENABLE KEYS */;
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
