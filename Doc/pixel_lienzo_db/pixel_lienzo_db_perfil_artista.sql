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
-- Table structure for table `perfil_artista`
--

DROP TABLE IF EXISTS `perfil_artista`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfil_artista` (
  `id_artista` int NOT NULL,
  `biografia_profesional` text,
  `documento_identidad_url` varchar(500) NOT NULL,
  `informacion_bancaria` text,
  `estado_validacion` varchar(20) DEFAULT 'Pendiente',
  `motivos_rechazo` text,
  PRIMARY KEY (`id_artista`),
  CONSTRAINT `fk_perfil_usuario` FOREIGN KEY (`id_artista`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `chk_estado_validacion` CHECK ((`estado_validacion` in (_utf8mb4'Pendiente',_utf8mb4'Verificado',_utf8mb4'Rechazado')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perfil_artista`
--

LOCK TABLES `perfil_artista` WRITE;
/*!40000 ALTER TABLE `perfil_artista` DISABLE KEYS */;
INSERT INTO `perfil_artista` VALUES (6,'Especialista en óleo barroco.','http://docs.com/id6.pdf','cipher_bank_data_6','Verificado',NULL),(7,'Escultor de metal reciclado.','http://docs.com/id7.pdf','cipher_bank_data_7','Verificado',NULL),(8,'Fotógrafa paisajista andina.','http://docs.com/id8.pdf','cipher_bank_data_8','Verificado',NULL),(9,'Grabador tradicional urbano.','http://docs.com/id9.pdf','cipher_bank_data_9','Verificado',NULL),(10,'Expresionista abstracto.','http://docs.com/id10.pdf','cipher_bank_data_10','Verificado',NULL),(11,'Retratista hiperrealista.','http://docs.com/id11.pdf','cipher_bank_data_11','Verificado',NULL),(12,'Muralista y ceramista.','http://docs.com/id12.pdf','cipher_bank_data_12','Verificado',NULL),(13,'Escultor clásico en bronce.','http://docs.com/id13.pdf','cipher_bank_data_13','Verificado',NULL),(14,'Dibujante experto en carboncillo.','http://docs.com/id14.pdf','cipher_bank_data_14','Verificado',NULL),(15,'Pintor paisajista al pastel.','http://docs.com/id15.pdf','cipher_bank_data_15','Verificado',NULL),(16,'Calígrafo y artista de tinta.','http://docs.com/id16.pdf','cipher_bank_data_16','Verificado',NULL),(17,'Tejedora de arte textil.','http://docs.com/id17.pdf','cipher_bank_data_17','Verificado',NULL),(18,'Creador de instalaciones de luz.','http://docs.com/id18.pdf','cipher_bank_data_18','Verificado',NULL),(19,'Artista del collage moderno.','http://docs.com/id19.pdf','cipher_bank_data_19','Verificado',NULL),(20,'Maestro del aguafuerte.','http://docs.com/id20.pdf','cipher_bank_data_20','Verificado',NULL),(21,'Artista experimental mixto.','http://docs.com/id21.pdf','cipher_bank_data_21','Verificado',NULL),(22,'Escultor abstracto de mármol.','http://docs.com/id22.pdf','cipher_bank_data_22','Verificado',NULL),(23,'Fotógrafo documental social.','http://docs.com/id23.pdf','cipher_bank_data_23','Verificado',NULL),(24,'Neo-expresionista urbano.','http://docs.com/id24.pdf','cipher_bank_data_24','Verificado',NULL),(25,'Pintor acuarelista minimalista.','http://docs.com/id25.pdf','cipher_bank_data_25','Verificado',NULL),(46,'Artista impresionista moderno.','http://docs.com/id46.pdf','cipher_bank_data_46','Verificado',NULL),(47,'Escultor cubista geométrico.','http://docs.com/id47.pdf','cipher_bank_data_47','Verificado',NULL),(48,'Fotógrafo surrealista onírico.','http://docs.com/id48.pdf','cipher_bank_data_48','Verificado',NULL),(49,'Pintor fauvista del color.','http://docs.com/id49.pdf','cipher_bank_data_49','Verificado',NULL),(50,'Expresionista emocional.','http://docs.com/id50.pdf','cipher_bank_data_50','Verificado',NULL),(51,'Artista pop contemporáneo.','http://docs.com/id51.pdf','cipher_bank_data_51','Verificado',NULL),(52,'Escultor minimalista puro.','http://docs.com/id52.pdf','cipher_bank_data_52','Verificado',NULL),(53,'Conceptualista abstracto.','http://docs.com/id53.pdf','cipher_bank_data_53','Verificado',NULL),(54,'Pintor realista tradicional.','http://docs.com/id54.pdf','cipher_bank_data_54','Verificado',NULL),(55,'Hiperrealista de retratos.','http://docs.com/id55.pdf','cipher_bank_data_55','Verificado',NULL),(56,'Dadaísta provocador urbano.','http://docs.com/id56.pdf','cipher_bank_data_56','Verificado',NULL),(57,'Futurista del movimiento.','http://docs.com/id57.pdf','cipher_bank_data_57','Verificado',NULL),(58,'Constructivista industrial.','http://docs.com/id58.pdf','cipher_bank_data_58','Verificado',NULL),(59,'Suprematista geométrico.','http://docs.com/id59.pdf','cipher_bank_data_59','Verificado',NULL),(60,'Diseñador estilo De Stijl.','http://docs.com/id60.pdf','cipher_bank_data_60','Verificado',NULL),(61,'Abstracción lírica poética.','http://docs.com/id61.pdf','cipher_bank_data_61','Verificado',NULL),(62,'Artista informal de texturas.','http://docs.com/id62.pdf','cipher_bank_data_62','Verificado',NULL),(63,'Creador de efectos Op Art.','http://docs.com/id63.pdf','cipher_bank_data_63','Verificado',NULL),(64,'Pintor psicodélico alternativo.','http://docs.com/id64.pdf','cipher_bank_data_64','Verificado',NULL),(65,'Escultor Land Art natural.','http://docs.com/id65.pdf','cipher_bank_data_65','Verificado',NULL),(66,'Representante de Arte Povera.','http://docs.com/id66.pdf','cipher_bank_data_66','Verificado',NULL),(67,'Performer de artes vivas.','http://docs.com/id67.pdf','cipher_bank_data_67','Verificado',NULL),(68,'Creador de happenings.','http://docs.com/id68.pdf','cipher_bank_data_68','Verificado',NULL),(69,'Miembro del movimiento Fluxus.','http://docs.com/id69.pdf','cipher_bank_data_69','Verificado',NULL),(70,'Videoartista conceptual.','http://docs.com/id70.pdf','cipher_bank_data_70','Verificado',NULL),(71,'Instalador interactivo digital.','http://docs.com/id71.pdf','cipher_bank_data_71','Verificado',NULL),(72,'Muralista urbano moderno.','http://docs.com/id72.pdf','cipher_bank_data_72','Verificado',NULL),(73,'Grafitero de gran formato.','http://docs.com/id73.pdf','cipher_bank_data_73','Verificado',NULL),(74,'Diseñador de arte urbano.','http://docs.com/id74.pdf','cipher_bank_data_74','Verificado',NULL),(75,'Especialista en body paint.','http://docs.com/id75.pdf','cipher_bank_data_75','Verificado',NULL);
/*!40000 ALTER TABLE `perfil_artista` ENABLE KEYS */;
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
