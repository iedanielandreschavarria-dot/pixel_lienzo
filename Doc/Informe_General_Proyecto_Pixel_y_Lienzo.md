# Informe General del Proyecto: Pixel y Lienzo — Galería Digital del Palacio Nacional

**Versión del documento:** 2.1  
**Equipo de desarrollo:** Daniel Andrés Chavarría (*Product Owner, Backend Developer & Gestión GitHub/QA*) y Ronald (*UX/UI Designer & Frontend Developer*)  
**Repositorio:** `https://github.com/iedanielandreschavarria-dot/pixel_lienzo.git`

---

## 1. ¿En qué consiste el proyecto y cuál es su propósito?

**Pixel y Lienzo** es una plataforma web integral diseñada para la **Galería Digital del Palacio Nacional**. Su propósito es conectar la exhibición física de obras de arte con un ecosistema digital seguro que abarca todo el ciclo de vida de una pieza artística:

1. **Vinculación y curaduría institucional** de artistas y obras de arte.
2. **Exhibición pública digital** protegida contra copia no autorizada y conectada con las salas físicas mediante códigos QR.
3. **Comercialización en línea** de piezas únicas con liquidación financiera automatizada entre la galería y el artista.
4. **Gestión logística asegurada** con confirmación verificable de entrega física y atención de reclamaciones.
5. **Certificación criptográfica de autenticidad** y registro inalterable del historial de propietarios (*Provenance*).

---

## 2. ¿Para qué sirve y qué problema o necesidad busca resolver?

El proyecto resuelve cinco problemáticas críticas en la gestión y comercialización de arte del Palacio Nacional:

| Problema o Necesidad Identificada | Solución Implementada en Pixel y Lienzo |
| :--- | :--- |
| **1. Falsificación y alteración de certificados de autenticidad** | Un motor criptográfico (**Trust Engine**) genera un sello único **SHA-256** que une los datos técnicos de la obra con la firma digital del curador. Si alguien altera un dato después, el sistema detecta la manipulación automáticamente al escanear el código QR. |
| **2. Robo o uso no autorizado de fotografías de obras en alta resolución** | La fotografía original nunca se expone en el catálogo público. El servidor genera en tiempo real una vista previa con una marca de agua diagonal repetida (`PIXEL Y LIENZO — VISTA PREVIA`). |
| **3. Riesgo de vender dos veces la misma obra única o vender piezas patrimoniales** | El motor de pagos aplica un bloqueo de base de datos en tiempo real cuando un comprador inicia el pago, impidiendo compras simultáneas, y bloquea por completo la venta de obras declaradas como **Patrimonio Histórico**. |
| **4. Falta de transparencia o errores manuales en el reparto de dinero y envíos** | El sistema calcula automáticamente la comisión de la galería y el monto neto del artista (*Split Payment*), genera guías únicas aseguradas (`PYL-XXXXXXXXXX`) y solo permite liberar fondos o descargar el certificado definitivo cuando el comprador confirma que recibió la obra con foto o firma. |
| **5. Desconexión entre el visitante en la sala física y el catálogo digital** | Cada obra publicada recibe un identificador único (`UID`) y un código QR oficial en formato PNG que permite al visitante escanear la etiqueta en sala y abrir la ficha técnica en su teléfono móvil. |

---

## 3. ¿Cómo funciona el sistema? (Componentes, Roles y Etapas Principales)

### 3.1. Arquitectura Técnica (Modelo-Vista-Controlador Desacoplado en Capas)
El sistema separa sus responsabilidades en tres grandes bloques que se comunican mediante el protocolo **HTTP / JSON**:

- **La Vista (Frontend — React 19 + TypeScript + Vite 8 + Tailwind CSS 4):** Aplicación web interactiva (*Single Page Application*) que presenta el catálogo (incluyendo visualización 3D y animaciones con *Framer Motion*), los formularios de acceso y los paneles de cada rol.
- **El Controlador y Servicios (Backend — Python 3.13 + FastAPI):** API RESTful organizada en capas (`endpoints/` para rutas HTTP y control de permisos, y `services/` para la lógica de pagos con Wompi, marcas de agua, cifrado, códigos OTP, códigos QR y auditoría).
- **El Modelo y Persistencia (SQLAlchemy 2.0 + Alembic + MySQL 8.0):** Base de datos relacional (`pixel_lienzo_db`) normalizada con 13 tablas y esquemas de validación/filtrado **Pydantic** (`schemas/`).

### 3.2. Los 4 Roles del Sistema
1. **Comprador (Coleccionista / Visitante):** Explora el catálogo, escanea códigos QR en sala, compra obras a través de Wompi, confirma la recepción física de sus pedidos, reporta reclamaciones por daño y descarga/verifica certificados de autenticidad.
2. **Artista (Creador):** Se postula adjuntando su documento de identidad, registra su información bancaria cifrada dentro de su panel, sube obras en alta resolución y consulta sus ventas y liquidaciones.
3. **Curador:** Audita y aprueba o rechaza perfiles de artistas, evalúa y edita técnicamente obras pendientes, publica piezas activando su código QR de sala, emite certificados con su firma digital y gestiona despachos logísticos.
4. **Administrador:** Crea cuentas internas de personal (`Curador`/`Administrador`), gestiona roles e inhabilitaciones, protege obras de Patrimonio Histórico, configura el porcentaje de comisión de la galería, dispersa fondos a los artistas, resuelve reclamaciones y audita los registros de seguridad y trazabilidad.

### 3.3. Los 5 Módulos Funcionales (Etapas del Flujo)
1. **Módulo 1 — Identidad y Seguridad:** Registro diferenciado o con **Google OAuth2**, verificación de correo por código OTP, inicio de sesión con doble factor obligatorio (**MFA**) para Curador y Administrador, cifrado bancario **Fernet** y registro inmutable en `log_auditoria`.
2. **Módulo 2 — Curaduría y Catálogo:** Subida validada de archivos (`JPEG`, `PNG`, `WEBP`, `PDF` hasta 10 MB), generación de marca de agua al vuelo (`/obras/{id}/preview`), flujo de aprobación curatorial, estados de sala (`Publicado`, `En Préstamo`, `Mantenimiento`) y generación de QR físico (`/obras/{id}/qr`).
3. **Módulo 3 — Motor de Pago y Liquidación:** Reserva concurrente de obra, generación de enlace firmado hacia **Wompi Web Checkout** con tiempo de expiración (`30 minutos`), recepción de confirmación asíncrona mediante **Webhook HMAC SHA-256**, cálculo de comisión desde `configuracion_sistema` y liberación automática de reservas vencidas.
4. **Módulo 4 — Logística Integrada y Reclamaciones:** Generación de guía `PYL-XXXXXXXXXX` con seguro de transporte sobre ventas confirmadas, seguimiento de estados (`Empacado` → `En Camino` → `En Centro de Distribución` → `Entregado`), confirmación de recepción con fotografía o firma digital, y resolución de reclamaciones con reembolso automático cuando aplica devolución de dinero.
5. **Módulo 5 — Trust Engine (Autenticidad y Trazabilidad):** Emisión de certificados con sello **SHA-256** de 64 caracteres hexadecimales, verificación pública por QR (`/verificar/{sello}`), descarga condicionada a entrega confirmada y línea de tiempo inmutable de propietarios (`historial_trazabilidad`).

---

## 4. ¿Cómo se ha desarrollado y qué trabajo se ha realizado hasta el momento?

### 4.1. Metodología, Organización de GitHub y Gestión en Taiga
- **Flujo de ramas en GitHub (Git Flow por Módulos):**
  - `main`: Rama estable de producción.
  - `develop`: Rama central de integración.
  - Ramas transversales: `backend` y `frontend`.
  - Ramas específicas por módulo en Backend (`feat/back-mod1-identidad` a `feat/back-mod5-trust-engine`) y su espejo en Frontend (`feat/front-mod1-identidad` a `feat/front-mod5-trust-engine`, más `feat/front-ux-ui`).
- **Gestión Ágil en Taiga (Scrum):**
  - El proyecto está estructurado en **6 Épicas** (`#2` a `#7`), **8 Historias de Usuario principales (`HU-01` a `HU-08`)** y sub-tareas técnicas asignadas según la especialidad de cada integrante (**Daniel** en Backend/BD/QA/Product Owner y **Ronald** en UX/UI/Frontend).

### 4.2. Trabajo Técnico Completado
- **Base de Datos y Backend (100 % completado):**
  - 13 modelos ORM en SQLAlchemy sincronizados con MySQL (`pixel_lienzo_db`) y migraciones con Alembic + *seeds* automáticos de roles y configuración.
  - **71 rutas cargadas en FastAPI** cubriendo los 5 módulos, incluyendo autenticación con Google (`/auth/google/*`), creación interna de usuarios (`POST /usuarios`), directorio público de artistas (`GET /artistas`), edición curatorial y patrimonial, expiración de reservas de Wompi (`/liberar-vencidas`), confirmación de entrega por comprador (`/confirmar-recepcion`), descarga de certificado validando entrega (`/descargar`) y trazabilidad global (`GET /trazabilidad`).
- **Frontend e Identidad Visual (Avance alto):**
  - Integración del Kit de Identidad Visual con la carpeta `frontend/4x/` (8 variantes cromáticas del isotipo oficial), sistema de 3 niveles de ambiente visual (`Ambiente.tsx`), `LogoMarca.tsx` y vista de verificación `/kit`.
  - Implementación de páginas de autenticación con **Botón de Google** (`BotonGoogle.tsx`), traslado del campo de información bancaria desde el registro hacia el **Panel de Artista** (`ArtistaPerfilPage.tsx`), catálogo con esfera 3D (`EsferaCatalogo3D.tsx`), ficha de obra, verificación de certificados, panel de artista, panel de curaduría, `InicioPage.tsx`, `ArtistasPage.tsx` y páginas institucionales/legales.
- **Documentación e Ingeniería de Software (`Doc/`):**
  - Modelo Entidad-Relación en alta resolución (`Modelo_Entidad_Relacion_Pixel_y_Lienzo.svg`).
  - **22 Casos de Uso documentados** para los 4 roles con **5 Diagramas UML vectoriales (`.svg`)** y diagramas de secuencia en `Doc/Casos_de_Uso/`.
  - Matriz de Requisitos Funcionales (82 RF), Requisitos No Funcionales (ISO/IEC 25010), análisis de complejidad (240 h de construcción base / 350 h con holgura) e informe de mantenibilidad.

---

## 5. Avances, Resultados de Pruebas (QA), Dificultades y Próximos Pasos

### 5.1. Resultados Cuantitativos de Aseguramiento de Calidad (`TP-2026-001`)
Se ejecutó una suite automatizada contra la aplicación FastAPI y la base de datos MySQL real (`Matriz_Casos_Prueba_TP-2026-001_40xModulo.xlsx`), superando el mínimo de **40 casos de prueba por cada módulo**:

| Módulo Evaluado | Total de Casos | Casos `OK` (API + BD) | Casos `BLOQUEADO` (Solo UI manual en navegador) | Casos `FALLA` | Cumplimiento Meta P1 (≥ 95 %) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Módulo 1: Identidad y Seguridad** | 45 | 43 | 2 | 0 | **100 % CUMPLE** |
| **Módulo 2: Curaduría y Catálogo** | 44 | 42 | 2 | 0 | **100 % CUMPLE** |
| **Módulo 3: Motor de Pago y Wompi** | 42 | 40 | 2 | 0 | **100 % CUMPLE** |
| **Módulo 4: Logística y Reclamaciones** | 48 | 44 | 4 | 0 | **100 % CUMPLE** |
| **Módulo 5: Trust Engine (SHA-256 / QR)** | 42 | 40 | 2 | 0 | **100 % CUMPLE** |
| **TOTAL CONSOLIDADO** | **221** | **209** | **12** | **0** | **100 % APROBADO** |

### 5.2. Dificultades Técnicas Encontradas y Limitaciones Documentadas
1. **Compatibilidad de librerías criptográficas:** `passlib 1.7.4` presenta incompatibilidad con `bcrypt >= 4.1`, por lo que se fijó `bcrypt == 4.0.1` en `requirements.txt` (documentado en la matriz de mantenibilidad).
2. **Almacenamiento en memoria del proceso local:** Los códigos OTP (verificación de correo y MFA) y la lista de tokens revocados (*denylist* de `jti`) residen en la memoria del proceso de Uvicorn. En un despliegue futuro con múltiples servidores/workers, deberán migrarse a **Redis**.
3. **Almacenamiento local de archivos:** Las fotografías de obras y documentos se guardan actualmente en la carpeta local `backend/uploads/`. Para entornos de nube con contenedores efímeros, el servicio `storage_service.py` está preparado para conectarse a almacenamiento de objetos (S3, Google Cloud Storage o Azure Blob).
4. **Correcciones de negocio resueltas durante el desarrollo:** Se corrigió la inserción prematura de trazabilidad para que solo ocurra al confirmarse el pago en Wompi, se añadió tiempo de expiración (`expiration-time`) para liberar reservas abandonadas y se unificó la ruta de activos gráficos `4x` dentro de `frontend/`.

### 5.3. Próximos Pasos para el Cierre Total
1. **Conectar vistas faltantes en el enrutador de React (`frontend/src/`):**
   - Crear los clientes `api/envios.ts`, `api/reclamaciones.ts`, `api/usuarios.ts` y `api/auditoria.ts`.
   - Conectar las acciones de seguimiento de guía y reclamación en `MisComprasPage.tsx` (`HU-06`).
   - Habilitar la ruta protegida `/admin` para el rol `Administrador` (`HU-08`) y exponer en `App.tsx` las rutas hacia `InicioPage`, `ArtistasPage` y páginas institucionales (`HU-05`).
   - Implementar la persistencia temporal en `frontend/src/lib/compraPendiente.ts` (`HU-07`).
2. **Ejecución manual en navegador de los 12 casos de usabilidad UI (`MODx-UI-xx`):** Validar visualmente en escritorio y vista móvil (`390 px`) los 12 casos de interfaz para pasarlos de `BLOQUEADO` a `OK`.
3. **Configuración de credenciales externas de producción/sandbox:** Configurar `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID`, llaves de Wompi con túnel público (`ngrok` o dominio real) y servidor SMTP real para envío de correos fuera de la consola de desarrollo.

---

## 6. Información Pendiente por Completar en la Documentación Oficial

Con el objetivo de no inventar datos que no figuran en los archivos del repositorio, se señalan los siguientes datos que el equipo debe completar antes de una entrega formal externa:
- **Nombre completo del segundo integrante:** En el repositorio figura **Ronald** como responsable de UX/UI y Frontend; falta especificar sus apellidos completos para la portada formal.
- **Dominio o URL pública de producción:** Actualmente los archivos de configuración apuntan al entorno local (`http://localhost:5173` y `http://127.0.0.1:8000`).
- **Credenciales activas de terceros:** El Client ID real de Google Cloud Console y las credenciales productivas/sandbox del comercio en Wompi y servidor SMTP institucional.

---

## 7. Glosario de Términos Técnicos

- **API REST (*Application Programming Interface*):** Conjunto de direcciones URL en el servidor Backend que permiten al Frontend en React consultar o guardar información enviando mensajes en formato JSON.
- **Bloqueo Pesimista (`SELECT ... FOR UPDATE`):** Mecanismo de la base de datos que bloquea temporalmente la fila de una obra mientras un comprador está creando su orden de pago, impidiendo que otra persona compre la misma pieza al mismo tiempo.
- **DTO / Schema (`Pydantic`):** Filtro y validador en Python (`app/schemas/`) que revisa que los datos enviados por el navegador sean válidos y oculta información sensible (como contraseñas o cuentas bancarias) antes de responder al Frontend.
- **Fernet (Cifrado Simétrico AES):** Algoritmo criptográfico que convierte la cuenta bancaria del artista en un código ilegible antes de guardarla en la base de datos, de modo que nadie pueda leerla sin la llave secreta del servidor.
- **JWT (*JSON Web Token*):** Credencial digital firmada que el servidor entrega al usuario al iniciar sesión para identificar su cuenta y su rol en cada petición sin pedirle la contraseña de nuevo.
- **MFA / OTP (*Multi-Factor Authentication / One-Time Password*):** Medida de seguridad que exige, además de la contraseña, un código numérico de 6 dígitos de un solo uso enviado al correo electrónico (obligatorio para Curadores y Administradores).
- **ORM (`SQLAlchemy`):** Herramienta que traduce las tablas de la base de datos MySQL a clases y objetos de Python (`app/models/`).
- **Provenance (Trazabilidad de Procedencia):** Historial cronológico e inalterable que registra quién creó una obra de arte y quiénes han sido sus propietarios legítimos tras cada venta confirmada.
- **RBAC (*Role-Based Access Control*):** Control de acceso basado en roles que asegura que cada usuario solo pueda ejecutar las acciones permitidas para su perfil (`Comprador`, `Artista`, `Curador` o `Administrador`).
- **SHA-256 y HMAC:** Funciones criptográficas que generan una "huella digital" única de 64 caracteres a partir de los datos de una obra o de un pago. Si un solo carácter cambia, la huella cambia por completo, permitiendo detectar fraudes o alteraciones.
- **SPA (*Single Page Application*):** Aplicación web moderna (construida con React) que carga una sola vez y cambia de pantalla de forma fluida sin recargar toda la página en el navegador.
- **Split Payment (Liquidación Dividida):** Cálculo automático que divide el valor total pagado por una obra entre el porcentaje de comisión de la galería y el pago neto que recibe el artista.
- **Webhook:** Notificación automática y segura de servidor a servidor que envía la pasarela **Wompi** a nuestro Backend para avisar si el pago de un comprador fue aprobado o rechazado.

