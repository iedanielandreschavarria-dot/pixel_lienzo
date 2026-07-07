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
-- Table structure for table `reclamacion`
--

DROP TABLE IF EXISTS `reclamacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reclamacion` (
  `id_reclamacion` int NOT NULL AUTO_INCREMENT,
  `id_envio` int NOT NULL,
  `descripcion_daño` text NOT NULL,
  `evidencias_fotos_url` varchar(500) NOT NULL,
  `estado_resolucion` varchar(30) DEFAULT 'Evaluación',
  PRIMARY KEY (`id_reclamacion`),
  UNIQUE KEY `id_envio` (`id_envio`),
  CONSTRAINT `fk_reclamacion_envio` FOREIGN KEY (`id_envio`) REFERENCES `envio_logistica` (`id_envio`) ON DELETE RESTRICT,
  CONSTRAINT `chk_estado_resolucion` CHECK ((`estado_resolucion` in (_utf8mb4'Evaluación',_utf8mb4'Aprobado Seguro',_utf8mb4'Devolución Dinero',_utf8mb4'Rechazado')))
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reclamacion`
--

LOCK TABLES `reclamacion` WRITE;
/*!40000 ALTER TABLE `reclamacion` DISABLE KEYS */;
INSERT INTO `reclamacion` VALUES (1,1,'Marco quebrado durante el transporte express.','http://seguro.com/claim1.jpg','Aprobado Seguro'),(2,2,'Rasguño leve detectado en la base trasera.','http://seguro.com/claim2.jpg','Evaluación'),(3,3,'Humedad menor detectada en empaque externo.','http://seguro.com/claim3.jpg','Rechazado'),(4,4,'Notificación preventiva por retraso prolongado.','http://seguro.com/claim4.jpg','Evaluación'),(5,5,'Caja golpeada en la esquina superior izquierda.','http://seguro.com/claim5.jpg','Evaluación'),(6,6,'Disputa de empaque: solicita doble plástico de burbuja.','http://seguro.com/claim6.jpg','Evaluación'),(7,7,'Vidrio protector fracturado durante tránsito.','http://seguro.com/claim7.jpg','Evaluación'),(8,8,'Inspección de aduana dañó sello exterior.','http://seguro.com/claim8.jpg','Evaluación'),(9,9,'Fisura en empaque térmico de conservación.','http://seguro.com/claim9.jpg','Evaluación'),(10,10,'Inconformidad con el transportista asignado.','http://seguro.com/claim10.jpg','Rechazado'),(11,11,'Retraso logístico por condiciones climáticas.','http://seguro.com/claim11.jpg','Evaluación'),(12,12,'El seguro solicita re-verificación de dimensiones.','http://seguro.com/claim12.jpg','Evaluación'),(13,13,'Desprendimiento menor de pintura en el borde.','http://seguro.com/claim13.jpg','Devolución Dinero'),(14,14,'El transportista reportó caja mojada por lluvia.','http://seguro.com/claim14.jpg','Aprobado Seguro'),(15,15,'Cliente reporta caja abierta al salir de bodega.','http://seguro.com/claim15.jpg','Evaluación'),(16,16,'Rasgadura menor en el lienzo posterior.','http://seguro.com/claim16.jpg','Devolución Dinero'),(17,17,'Grieta en la base de madera de soporte.','http://seguro.com/claim17.jpg','Evaluación'),(18,18,'Mancha externa de grasa en embalaje.','http://seguro.com/claim18.jpg','Rechazado'),(19,19,'Alerta de extravío temporal en el hub logístico.','http://seguro.com/claim19.jpg','Evaluación'),(20,20,'Falta firma física del despachador institucional.','http://seguro.com/claim20.jpg','Evaluación'),(21,21,'Rasgadura menor en esquina superior del empaque.','http://seguro.com/claim21.jpg','Evaluación'),(22,22,'Caja húmeda superficialmente, pintura intacta.','http://seguro.com/claim22.jpg','Rechazado'),(23,23,'Soporte de madera flojo durante la entrega.','http://seguro.com/claim23.jpg','Evaluación'),(24,24,'Notificación preventiva por empaque abollado.','http://seguro.com/claim24.jpg','Evaluación'),(25,25,'Vidrio protector agrietado durante el transporte.','http://seguro.com/claim25.jpg','Aprobado Seguro'),(26,26,'Marco rayado levemente en el borde inferior.','http://seguro.com/claim26.jpg','Evaluación'),(27,27,'Retraso logístico severo reportado en hub.','http://seguro.com/claim27.jpg','Evaluación'),(28,28,'Empaque con golpes estructurales por montacargas.','http://seguro.com/claim28.jpg','Evaluación'),(29,29,'Humedad severa interna en envoltura térmica.','http://seguro.com/claim29.jpg','Devolución Dinero'),(30,30,'Inconformidad con empaque de protección básico.','http://seguro.com/claim30.jpg','Rechazado'),(31,31,'Desprendimiento menor de fijaciones traseras.','http://seguro.com/claim31.jpg','Evaluación'),(32,32,'Fisura en la base de mármol de la escultura.','http://seguro.com/claim32.jpg','Aprobado Seguro'),(33,33,'El transportista reportó caja exterior perforada.','http://seguro.com/claim33.jpg','Evaluación'),(34,34,'Desgaste en bordes por fricción del viaje largo.','http://seguro.com/claim34.jpg','Evaluación'),(35,35,'Humedad en caja de cartón secundaria de acopio.','http://seguro.com/claim35.jpg','Rechazado'),(36,36,'Rasgadura pequeña en el papel acuarela francés.','http://seguro.com/claim36.jpg','Devolución Dinero'),(37,37,'Daño menor en la pátina exterior de protección.','http://seguro.com/claim37.jpg','Evaluación'),(38,38,'Mancha de grasa industrial en embalaje primario.','http://seguro.com/claim38.jpg','Evaluación'),(39,39,'Retraso crítico de entrega de 5 días hábiles.','http://seguro.com/claim39.jpg','Evaluación'),(40,40,'Piedra con astillamiento en una esquina inferior.','http://seguro.com/claim40.jpg','Aprobado Seguro'),(41,41,'Desprendimiento de collage por calor en ruta.','http://seguro.com/claim41.jpg','Evaluación'),(42,42,'Humedad menor en borde lateral de la fotografía.','http://seguro.com/claim42.jpg','Evaluación'),(43,43,'Empaque aplastado por estiba de carga pesada.','http://seguro.com/claim43.jpg','Evaluación'),(44,44,'Objeto interactivo desensamblado parcialmente.','http://seguro.com/claim44.jpg','Evaluación'),(45,45,'Error en la descarga del archivo digital (corrupto).','http://seguro.com/claim45.jpg','Devolución Dinero'),(46,46,'Fallo en clave criptográfica de visualización.','http://seguro.com/claim46.jpg','Rechazado'),(47,47,'Panel de muro removible astillado en mudanza.','http://seguro.com/claim47.jpg','Aprobado Seguro'),(48,48,'Lienzo con arrugas por tensión deficiente en ruta.','http://seguro.com/claim48.jpg','Evaluación'),(49,49,'Pintura fresca afectada por contacto directo.','http://seguro.com/claim49.jpg','Evaluación'),(50,50,'Impresión Giclée con pérdida de color por luz.','http://seguro.com/claim50.jpg','Evaluación');
/*!40000 ALTER TABLE `reclamacion` ENABLE KEYS */;
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
