# 🎨 Pixel y Lienzo — Galería Digital del Palacio Nacional

**Pixel y Lienzo** es una plataforma web integral para la exhibición, curaduría, comercialización, logística y certificación de autenticidad de obras de arte de la **Galería Digital del Palacio Nacional**. Conecta a artistas, curadores, compradores y administradores en un ecosistema seguro con trazabilidad verificable (*Provenance*) y pagos integrados.

---

## 👥 Equipo de Desarrollo

| Integrante | Rol Principal | Responsabilidades |
| :--- | :--- | :--- |
| **Daniel Andrés Chavarría** | **Product Owner & Backend Developer** | Arquitectura de API REST (FastAPI), base de datos MySQL/Alembic, seguridad/criptografía, integración con pasarela de pagos (Wompi), administración de GitHub y gestión de backlog en Taiga. |
| **Ronald** | **UX/UI Designer & Frontend Developer** | Diseño de experiencia e interfaz de usuario, maquetación interactiva en React + TypeScript, animaciones (Framer Motion), vistas de catálogo, paneles por rol e integración con la API. |

---

## 🧩 Los 5 Módulos del Sistema

El sistema está diseñado de forma modular, abarcando el ciclo de vida completo de una obra de arte desde su postulación hasta su entrega certificada:

1. **🔐 Módulo 1 — Identidad y Seguridad (`mod1-identidad`)**
   - Control de acceso basado en roles (**RBAC**: *Administrador*, *Curador*, *Artista*, *Comprador*).
   - Autenticación **JWT** con rotación de *Refresh Tokens* y revocación inmediata (*denylist*).
   - **Autenticación Multifactor (MFA)** por código OTP vía correo electrónico y verificación de cuenta.
   - Cifrado simétrico (**Fernet**) para proteger la información bancaria de los artistas.
   - Registro inmutable en **Log de Auditoría** (`log_auditoria`) para acciones críticas.

2. **🖼️ Módulo 2 — Curaduría y Catálogo (`mod2-catalogo`)**
   - *Onboarding* y validación documental de artistas por parte del equipo de curaduría.
   - Ingesta de obras con subida segura de fotografías en alta definición y documentos de identidad.
   - Generación dinámica de **marcas de agua** (*Pillow*) en tiempo real (`/obras/{id}/preview`) para proteger las obras expuestas en el catálogo público.

3. **💳 Módulo 3 — Motor de Pago (`mod3-pagos`)**
   - Reserva con control de concurrencia (`SELECT ... FOR UPDATE`) para evitar doble venta de piezas únicas.
   - Liquidación automática de comisiones (*Split Payment*) entre la galería y el artista mediante configuración persistente en base de datos (`configuracion_sistema`).
   - Integración con **Wompi Web Checkout** y validación criptográfica (HMAC SHA-256) de webhooks para confirmar o liberar obras automáticamente.

4. **📦 Módulo 4 — Logística Integrada (`mod4-logistica`)**
   - Generación automática de guías de despacho (`PYL-XXXXXXXXXX`) y cálculo de seguro sobre obras con pago confirmado.
   - Seguimiento de estados de envío y exigencia de prueba de entrega (fotografía de recepción o firma digital).
   - Gestión de reclamaciones con flujo de **reembolso automático** y reincorporación de la obra al catálogo cuando aplica devolución.

5. **🛡️ Módulo 5 — Trust Engine (`mod5-trust-engine`)**
   - Generación de **Certificados de Autenticidad** con sello criptográfico **SHA-256** (ficha técnica + firma del curador).
   - Generación dinámica de **códigos QR** en formato PNG tanto para la obra física como para la verificación pública del certificado.
   - Historial de **Trazabilidad (*Provenance*)** público que registra cada evento relevante de propiedad de la obra.

---

## 🛠️ Stack Tecnológico

### Backend (`/backend`)
- **Lenguaje y Framework:** Python 3.13 + **FastAPI**
- **ORM y Migraciones:** **SQLAlchemy 2.0** + **Alembic**
- **Base de Datos:** **MySQL 8.0+** (`pixel_lienzo_db`)
- **Seguridad y Criptografía:** `PyJWT`, `bcrypt`, `cryptography` (Fernet), `hmac` (SHA-256)
- **Procesamiento Multimedia:** `Pillow` (marcas de agua), `qrcode` (generación de QR)
- **Pagos:** Integración con **Wompi** (Checkout & Webhooks)

### Frontend (`/frontend`)
- **Framework:** **React 19** + **TypeScript** + **Vite 8**
- **Estilos y UI:** **Tailwind CSS v4**, `lucide-react`, `clsx`
- **Animaciones y Experiencia Visual:** **Framer Motion** (carrusel cilíndrico 3D, grillas en perspectiva, tarjetas expandibles)
- **Estado y Red:** `@tanstack/react-query`, `axios`, `react-hook-form`, `react-router-dom v7`

---

## 📂 Estructura del Proyecto

```text
pixel_lienzo/
├── backend/                        # API REST en FastAPI
│   ├── alembic/                    # Migraciones de esquema de base de datos
│   ├── app/
│   │   ├── api/v1/endpoints/       # Endpoints divididos en los 5 módulos
│   │   ├── core/                   # Configuración (.env), conexión BD y seguridad JWT
│   │   ├── db/                     # Seeds automáticos (roles y configuración inicial)
│   │   ├── models/                 # Modelos ORM SQLAlchemy (12+ tablas)
│   │   ├── schemas/                # Esquemas de validación Pydantic
│   │   ├── services/               # Lógica de negocio (Wompi, Trust Engine, OTP, Auditoría, etc.)
│   │   └── main.py                 # Punto de entrada de la API + CORS + archivos estáticos
│   ├── scripts/                    # Scripts de pruebas automatizadas y simulador de webhooks
│   ├── requirements.txt            # Dependencias de Python
│   └── README.md                   # Documentación técnica detallada del Backend
│
├── frontend/                       # Aplicación SPA en React + TypeScript
│   ├── src/
│   │   ├── components/             # Componentes reutilizables, layout y animaciones motion
│   │   ├── pages/                  # Vistas públicas, catálogo, artistas y paneles por rol
│   │   ├── lib/                    # Cliente Axios, utilidades y estado de compra
│   │   └── App.tsx                 # Configuración de rutas y proveedores
│   └── package.json                # Dependencias y scripts de Node.js
│
├── Doc/                            # Documentación del proyecto y artefactos de ingeniería
│   ├── pixel_lienzo_db/            # Dumps SQL del esquema y datos de la base de datos
│   ├── Diagramas_Arquitectura...   # Documentos de arquitectura y mantenibilidad
│   └── Plan_de_Pruebas...          # Políticas, planes y matrices de casos de prueba (QA)
│
└── README.md                       # Este archivo (Guía general del proyecto)
```

---

## 🚀 Guía de Instalación y Ejecución Local

### 1. Base de Datos (MySQL)
1. Asegúrate de tener **MySQL** en ejecución.
2. Crea la base de datos:
   ```sql
   CREATE DATABASE IF NOT EXISTS pixel_lienzo_db CHARACTER SET utf8mb4;
   ```
3. Puedes importar los scripts SQL ubicados en `Doc/pixel_lienzo_db/` o aplicar las migraciones directamente desde el backend con Alembic (`alembic upgrade head`).

### 2. Levantar el Backend (FastAPI)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Copiar variables de entorno y ajustar credenciales de MySQL en .env
copy .env.example .env

# Iniciar el servidor de desarrollo
uvicorn app.main:app --reload
```
- **API Base:** `http://127.0.0.1:8000`
- **Documentación Swagger UI:** `http://127.0.0.1:8000/api/v1/docs`
- **Documentación ReDoc:** `http://127.0.0.1:8000/api/v1/redoc`

### 3. Levantar el Frontend (React + Vite)
En una nueva terminal:
```powershell
cd frontend
npm install
npm run dev
```
- **Aplicación Web:** `http://localhost:5173`

---

## 🌿 Organización de Ramas en GitHub y Flujo con Taiga

Utilizamos **Git Flow Simplificado** alineado con nuestro tablero en **Taiga**:

### Ramas Principales
- **`main`**: Código estable de producción / entregas oficiales.
- **`develop`**: Rama de integración donde confluyen los avances de **Backend (Daniel)** y **Frontend (Ronald)**.
- **`backend`**: Rama transversal para ajustes generales de servidor, configuración o migraciones.

### Ramas por Módulo (Backend)
- `feat/back-mod1-identidad` — Módulo 1: Identidad, Seguridad y Auditoría
- `feat/back-mod2-catalogo` — Módulo 2: Curaduría, Catálogo y Archivos
- `feat/back-mod3-pagos` — Módulo 3: Motor de Pago y Wompi
- `feat/back-mod4-logistica` — Módulo 4: Logística, Envíos y Reclamaciones
- `feat/back-mod5-trust-engine` — Módulo 5: Certificados QR y Trazabilidad

### Flujo de Trabajo Diario
1. Actualizar `develop`: `git checkout develop && git pull origin develop`
2. Cambiar a la rama del módulo o tarea correspondiente: `git checkout feat/back-mod1-identidad`
3. Realizar cambios, hacer commit referenciando la tarea de Taiga (ej. `git commit -m "feat(mod1): validacion OTP TG-12"`) y subir con `git push`.
4. Abrir **Pull Request** hacia `develop` para integrar y probar en conjunto (estado **Ready for Test** en Taiga).
5. Al finalizar el Sprint y validar todas las pruebas, fusionar `develop` → `main` (estado **Done** en Taiga).
