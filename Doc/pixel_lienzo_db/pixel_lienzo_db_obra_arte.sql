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
-- Table structure for table `obra_arte`
--

DROP TABLE IF EXISTS `obra_arte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `obra_arte` (
  `id_obra` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(100) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `tecnica` varchar(100) NOT NULL,
  `dimensiones` varchar(50) NOT NULL,
  `peso` decimal(10,2) NOT NULL,
  `anio_creacion` int DEFAULT NULL,
  `precio_venta` decimal(12,2) NOT NULL,
  `fotografia_hd_url` varchar(500) NOT NULL,
  `codigo_qr_obra` varchar(500) DEFAULT NULL,
  `estado_obra` varchar(30) DEFAULT 'Pendiente',
  `es_patrimonio_historico` tinyint(1) DEFAULT '0',
  `id_artista` int NOT NULL,
  `id_categoria` int NOT NULL,
  PRIMARY KEY (`id_obra`),
  UNIQUE KEY `uid` (`uid`),
  KEY `fk_obra_artista` (`id_artista`),
  KEY `fk_obra_categoria` (`id_categoria`),
  CONSTRAINT `fk_obra_artista` FOREIGN KEY (`id_artista`) REFERENCES `perfil_artista` (`id_artista`) ON DELETE RESTRICT,
  CONSTRAINT `fk_obra_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria_arte` (`id_categoria`) ON DELETE RESTRICT,
  CONSTRAINT `chk_estado_obra` CHECK ((`estado_obra` in (_utf8mb4'Pendiente',_utf8mb4'Publicado',_utf8mb4'Reservado',_utf8mb4'Vendido',_utf8mb4'En Préstamo',_utf8mb4'Mantenimiento')))
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `obra_arte`
--

LOCK TABLES `obra_arte` WRITE;
/*!40000 ALTER TABLE `obra_arte` DISABLE KEYS */;
INSERT INTO `obra_arte` VALUES (1,'OBJ-2026-001','Atardecer en los Andes','Óleo sobre lienzo','100x80 cm',4.50,2025,2500.00,'http://cdn.com/art1.jpg','QR_001','Vendido',0,6,1),(2,'OBJ-2026-002','Estructura Dinámica','Hierro Forjado','50x50x120 cm',25.00,2024,4800.00,'http://cdn.com/art2.jpg','QR_002','Vendido',0,7,2),(3,'OBJ-2026-003','Mirada Urbana','Fotografía Digital','60x40 cm',1.20,2026,1200.00,'http://cdn.com/art3.jpg','QR_003','Vendido',0,8,3),(4,'OBJ-2026-004','Líneas del Tiempo','Grabado en Linóleo','30x40 cm',0.80,2023,750.00,'http://cdn.com/art4.jpg','QR_004','Vendido',0,9,5),(5,'OBJ-2026-005','Grito de Color','Acrílico','120x120 cm',6.00,2025,3100.00,'http://cdn.com/art5.jpg','QR_005','Vendido',0,10,7),(6,'OBJ-2026-006','El Silencio','Acuarela sobre papel','70x50 cm',0.90,2026,950.00,'http://cdn.com/art6.jpg','QR_006','Vendido',0,25,6),(7,'OBJ-2026-007','Reflejos de la Memoria','Técnica Mixta','90x90 cm',3.40,2024,1800.00,'http://cdn.com/art7.jpg','QR_007','Vendido',0,21,21),(8,'OBJ-2026-008','Esencia de Mármol','Escultura','40x40x80 cm',45.00,2022,6200.00,'http://cdn.com/art8.jpg','QR_008','Vendido',1,22,2),(9,'OBJ-2026-009','Luz Estructural','Instalación Lumínica','200x200 cm',15.00,2025,8500.00,'http://cdn.com/art9.jpg','QR_009','Vendido',0,18,18),(10,'OBJ-2026-010','Fragmentos Urbanos','Collage','50x70 cm',1.50,2025,1100.00,'http://cdn.com/art10.jpg','QR_010','Vendido',0,19,19),(11,'OBJ-2026-011','Soledad en Carboncillo','Carboncillo','100x70 cm',1.10,2026,1300.00,'http://cdn.com/art11.jpg','QR_011','Vendido',0,14,14),(12,'OBJ-2026-012','Torso Ancestral','Bronce Fundido','30x30x60 cm',18.00,2021,5400.00,'http://cdn.com/art12.jpg','QR_012','Vendido',1,13,13),(13,'OBJ-2026-013','Horizonte de Tinta','Tinta China','80x40 cm',0.70,2025,1600.00,'http://cdn.com/art13.jpg','QR_013','Vendido',0,16,16),(14,'OBJ-2026-014','Texturas de la Tierra','Arte Textil','150x200 cm',8.50,2024,4200.00,'http://cdn.com/art14.jpg','QR_014','Vendido',0,17,17),(15,'OBJ-2026-015','Naturaleza al Pastel','Pastel','60x50 cm',0.60,2025,900.00,'http://cdn.com/art15.jpg','QR_015','Vendido',0,15,15),(16,'OBJ-2026-016','Sombras del Pasado','Aguafuerte','40x30 cm',0.50,2023,1050.00,'http://cdn.com/art16.jpg','QR_016','Vendido',0,20,20),(17,'OBJ-2026-017','Geometría Sagrada','Mosaico en Vidrio','80x80 cm',12.00,2026,3700.00,'http://cdn.com/art17.jpg','QR_017','Vendido',0,12,11),(18,'OBJ-2026-018','Vasija Cósmica','Cerámica Esmaltada','40x40x50 cm',5.20,2024,1400.00,'http://cdn.com/art18.jpg','QR_018','Vendido',0,12,12),(19,'OBJ-2026-019','Rostros de la Calle','Fotografía Documental','45x60 cm',1.00,2025,1250.00,'http://cdn.com/art19.jpg','QR_019','Vendido',0,23,3),(20,'OBJ-2026-020','Abstracción Líquida','Acrílico','140x100 cm',5.80,2026,2900.00,'http://cdn.com/art20.jpg','QR_020','Vendido',0,24,7),(21,'OBJ-2026-021','Amanecer Cubista','Óleo sobre lienzo','80x80 cm',3.20,2024,1950.00,'http://cdn.com/art21.jpg','QR_021','Vendido',0,46,22),(22,'OBJ-2026-022','Formas en el Espacio','Escultura en Madera','60x60x100 cm',12.50,2025,3400.00,'http://cdn.com/art22.jpg','QR_022','Vendido',0,47,23),(23,'OBJ-2026-023','Sueño Atemporal','Acrílico sobre panel','100x100 cm',4.10,2026,2800.00,'http://cdn.com/art23.jpg','QR_023','Vendido',0,48,24),(24,'OBJ-2026-024','Fuego Interno','Gouache','50x70 cm',1.10,2023,1150.00,'http://cdn.com/art24.jpg','QR_024','Vendido',0,49,25),(25,'OBJ-2026-025','Grito Urbano','Tinta y Aerosol','150x150 cm',7.20,2025,4500.00,'http://cdn.com/art25.jpg','QR_025','Vendido',0,50,26),(26,'OBJ-2026-026','Cultura Pop','Serigrafía','90x60 cm',1.80,2026,1600.00,'http://cdn.com/art26.jpg','QR_026','Vendido',0,51,27),(27,'OBJ-2026-027','Estructura Blanca','Técnica Mixta','80x80 cm',2.90,2024,2100.00,'http://cdn.com/art27.jpg','QR_027','Vendido',0,52,28),(28,'OBJ-2026-028','Idea Pura','Instalación Objetual','100x100 cm',5.00,2022,5200.00,'http://cdn.com/art28.jpg','QR_028','Vendido',1,53,29),(29,'OBJ-2026-029','Retrato Fiel','Óleo clásico','70x50 cm',2.10,2025,2300.00,'http://cdn.com/art29.jpg','QR_029','Vendido',0,54,30),(30,'OBJ-2026-030','Espejo Humano','Óleo sobre tabla','110x80 cm',4.80,2025,6700.00,'http://cdn.com/art30.jpg','QR_030','Vendido',0,55,31),(31,'OBJ-2026-031','Caos Organizado','Collage','60x60 cm',1.30,2026,1400.00,'http://cdn.com/art31.jpg','QR_031','Vendido',0,56,32),(32,'OBJ-2026-032','Velocidad Pura','Escultura de Bronce','40x40x50 cm',14.20,2021,4900.00,'http://cdn.com/art32.jpg','QR_032','Vendido',1,57,33),(33,'OBJ-2026-033','Torre Industrial','Ensamblaje metálico','80x40 cm',9.50,2025,3100.00,'http://cdn.com/art33.jpg','QR_033','Vendido',0,58,34),(34,'OBJ-2026-034','Cuadrante Negro','Acrílico minimal','120x120 cm',5.50,2024,3800.00,'http://cdn.com/art34.jpg','QR_034','Vendido',0,59,35),(35,'OBJ-2026-035','Líneas Rojas','Óleo abstracto','60x60 cm',2.00,2025,1750.00,'http://cdn.com/art35.jpg','QR_035','Vendido',0,60,36),(36,'OBJ-2026-036','Poesía Visual','Acuarela ligera','40x30 cm',0.60,2023,850.00,'http://cdn.com/art36.jpg','QR_036','Vendido',0,61,37),(37,'OBJ-2026-037','Materia Viva','Técnica Mixta orgánica','90x90 cm',6.40,2026,2900.00,'http://cdn.com/art37.jpg','QR_037','Vendido',0,62,38),(38,'OBJ-2026-038','Ilusión Óptica','Acrílico geométrico','100x100 cm',4.20,2024,3300.00,'http://cdn.com/art38.jpg','QR_038','Vendido',0,63,39),(39,'OBJ-2026-039','Viaje Mental','Óleo sobre tela','130x130 cm',5.90,2025,4100.00,'http://cdn.com/art39.jpg','QR_039','Vendido',0,64,40),(40,'OBJ-2026-040','Eco de la Tierra','Piedra esculpida','70x50 cm',35.00,2025,5500.00,'http://cdn.com/art40.jpg','QR_040','Vendido',0,65,41),(41,'OBJ-2026-041','Pobreza Noble','Materiales Reciclados','100x80 cm',8.10,2026,2200.00,'http://cdn.com/art41.jpg','QR_041','Vendido',0,66,42),(42,'OBJ-2026-042','Cuerpo Sombra','Fotografía de Registro','60x40 cm',1.00,2024,1100.00,'http://cdn.com/art42.jpg','QR_042','Vendido',0,67,43),(43,'OBJ-2026-043','Instante Efímero','Documentación impresa','50x40 cm',0.90,2025,950.00,'http://cdn.com/art43.jpg','QR_043','Vendido',0,68,44),(44,'OBJ-2026-044','Anti-Arte','Objeto de desecho','30x30x30 cm',2.50,2023,1300.00,'http://cdn.com/art44.jpg','QR_044','Vendido',0,69,45),(45,'OBJ-2026-045','Pantalla Azul','Video Loop HD','Archivo Digital',0.10,2025,3200.00,'http://cdn.com/art45.jpg','QR_045','Vendido',0,70,46),(46,'OBJ-2026-046','Inmersión Total','Software Interactivo','Instalación Virtual',5.00,2026,7500.00,'http://cdn.com/art46.jpg','QR_046','Vendido',0,71,47),(47,'OBJ-2026-047','Muro de la Paz','Acrílico sobre muro','Paneles removibles',18.00,2024,8900.00,'http://cdn.com/art47.jpg','QR_047','Vendido',0,72,48),(48,'OBJ-2026-048','Tags Urbanos','Aerosol sobre lienzo','120x90 cm',3.80,2025,2400.00,'http://cdn.com/art48.jpg','QR_048','Vendido',0,73,49),(49,'OBJ-2026-049','Asfalto y Color','Técnica Mixta callejera','100x100 cm',4.50,2025,2700.00,'http://cdn.com/art49.jpg','QR_049','Vendido',0,74,50),(50,'OBJ-2026-050','Lienzo Humano','Impresión Giclée HD','70x100 cm',1.20,2026,1850.00,'http://cdn.com/art50.jpg','QR_050','Vendido',0,75,51);
/*!40000 ALTER TABLE `obra_arte` ENABLE KEYS */;
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
