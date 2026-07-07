# Pixel y Lienzo — Backend API

API REST construida con **FastAPI** para la Galería Digital del Palacio Nacional. Implementa los 5 módulos definidos en la documentación del proyecto (`/Doc`):

1. **Identidad y Seguridad** — RBAC, autenticación JWT, MFA, auditoría.
2. **Curaduría y Catálogo** — Onboarding de artistas, ingesta y validación de obras.
3. **Motor de Pago** — Transacciones y liquidación (Split Payment).
4. **Logística Integrada** — Envíos y reclamaciones.
5. **Trust Engine** — Certificados de autenticidad y trazabilidad (Provenance).

## Estructura de carpetas

```
backend/
├── app/
│   ├── main.py                 # Instancia de FastAPI + CORS
│   ├── core/
│   │   ├── config.py           # Settings (variables de entorno)
│   │   ├── database.py         # Engine/Session de SQLAlchemy
│   │   └── security.py         # Hashing de contraseñas y JWT
│   ├── models/                 # Modelos ORM (reflejan bd_pixel_lienzo.txt)
│   ├── schemas/                # Esquemas Pydantic (request/response)
│   ├── api/
│   │   ├── deps.py             # get_current_user, require_roles (RBAC)
│   │   └── v1/
│   │       ├── router.py       # Agregador de todos los sub-routers
│   │       └── endpoints/      # Un archivo por módulo funcional
│   ├── services/                # Lógica de negocio: correo, cifrado, OTP, auditoría, Trust Engine
│   │   ├── email_service.py     # Envío de correo (fallback a consola en dev)
│   │   ├── crypto_service.py    # Cifrado Fernet de datos bancarios
│   │   ├── audit_service.py     # Registro real en Log_Auditoria
│   │   ├── otp_service.py       # Códigos de un solo uso (MFA / verificación de email)
│   │   └── trust_engine.py      # Sello SHA-256 + generación de QR (PNG)
│   └── utils/
├── requirements.txt
├── .env.example
└── README.md
```

## Puesta en marcha

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows PowerShell
pip install -r requirements.txt

copy .env.example .env          # y ajustar credenciales de la BD
```

La base de datos real se llama **`pixel_lienzo_db`** (ver los dumps por tabla en `Doc/pixel_lienzo_db/`, que reflejan el esquema vigente; `Doc/bd_pixel_lienzo.txt` es el script de referencia original con la misma estructura). Si prefieres migrar el esquema con Alembic en vez de restaurar los dumps, basta con crear la base de datos vacía (ver sección "Migraciones de base de datos" más abajo).

Levantar el servidor de desarrollo:

```bash
uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000
- Documentación interactiva (Swagger): http://127.0.0.1:8000/api/v1/docs
- Documentación (ReDoc): http://127.0.0.1:8000/api/v1/redoc

## Migraciones de base de datos (Alembic)

El esquema se gestiona con Alembic. `alembic/env.py` construye la URL de
conexión dinámicamente desde `app.core.config.settings.DATABASE_URL` (nunca
hardcodeada en `alembic.ini`) y usa `Base.metadata` (con todos los modelos
de `app/models`) como `target_metadata` para el autogenerate.

Además, **cada vez que corres `alembic upgrade` o `downgrade`**, `env.py`
ejecuta automáticamente `app/db/seed.py::seed_roles()`, que inserta de forma
idempotente los 4 roles obligatorios (Administrador, Curador, Artista,
Comprador) si aún no existen. Como segunda red de seguridad, `app/main.py`
también llama a `seed_roles()` en el evento de arranque de FastAPI.

### Caso A: base de datos ya existente con datos (nuestro caso actual)

Si `pixel_lienzo_db` ya tiene las 12 tablas y datos (restaurada desde los dumps
de `Doc/pixel_lienzo_db/`), **no uses `alembic upgrade`** para la migración
inicial: los modelos ya están alineados 1:1 con el esquema real (mismos
nombres de tabla en minúscula, mismas columnas nullable), así que el
autogenerate produce una migración vacía (`pass`). En ese caso, solo hay que
decirle a Alembic "ya estás al día" sin ejecutar DDL:

```bash
cd backend
.venv\Scripts\activate

alembic revision --autogenerate -m "Initial migration"
# Verifica que upgrade()/downgrade() queden vacíos (pass) antes de continuar

alembic stamp head   # registra la revisión sin tocar tablas/datos existentes
```

### Caso B: base de datos vacía / nueva

```bash
cd backend
.venv\Scripts\activate

# 1. Crear la base de datos vacía en MySQL (una sola vez)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pixel_lienzo_db CHARACTER SET utf8mb4;"

# 2. Generar la migración inicial a partir de los modelos ORM
alembic revision --autogenerate -m "Initial migration"

# 3. Revisar el archivo generado en alembic/versions/ (recomendado)

# 4. Aplicar la migración -> crea las tablas y siembra los 4 roles automáticamente
alembic upgrade head
```

> ⚠️ Los nombres de tabla en los modelos (`app/models/`) están en minúscula
> (`usuario`, `obra_arte`, etc.) para calzar exactamente con el esquema real
> de `pixel_lienzo_db`. Si alguna vez `alembic revision --autogenerate`
> detecta "Detected added/removed table", detente y revisa antes de aplicar
> nada — probablemente indica un desajuste de nombres, no un cambio real.

Otros comandos útiles:

```bash
alembic current          # revisión actualmente aplicada
alembic history           # historial de migraciones
alembic downgrade -1      # revertir la última migración
python -m app.db.seed     # ejecutar el seed de roles manualmente (idempotente)
```

## CORS y el frontend en React

El CORS ya está configurado en `app/main.py` mediante `CORSMiddleware`, permitiendo por defecto los orígenes típicos de desarrollo de React:

- Create React App: `http://localhost:3000`
- Vite: `http://localhost:5173`

Para producción, actualiza `BACKEND_CORS_ORIGINS` en el archivo `.env` con el dominio real del frontend.

## Estado actual

El **Módulo 1 (Identidad y Seguridad)** está implementado con lógica de negocio real:

- **Registro diferenciado**: Comprador (con `Preferencia_Comprador`) y Artista (con `Perfil_Artista`, `informacion_bancaria` cifrada con Fernet).
- **Verificación de correo** (RF 1.1.7): código de un solo uso enviado por `email_service`, validado en `POST /auth/verificar-email`.
- **Login + MFA real** (RF 1.4.2): obligatorio para Administrador/Curador o si el usuario activó `mfa_activado`; código de un solo uso por correo, completado en `POST /auth/mfa/verificar`.
- **Refresh con rotación** y **logout con denylist de `jti`** (revocación inmediata de tokens, en memoria).
- **Recuperación de contraseña** (RF 1.4.3) con token JWT firmado de un solo propósito, sin estado adicional en BD.
- **RBAC + auditoría real**: cambios de rol, inhabilitación de cuentas, validación de artistas/obras y dispersión de pagos quedan en `Log_Auditoria` (mismos nombres de `accion_realizada` que espera la vista `auditoria_critica_view`).
- **Trust Engine real**: sello SHA-256 de la ficha técnica + firma del curador, código QR físico de la obra y QR de validación del certificado (renderizados como PNG bajo demanda en `/obras/{id}/qr` y `/certificados/{id_obra}/qr`).
- **Checkout con concurrencia real**: `SELECT ... FOR UPDATE` sobre la obra al crear la transacción, para evitar doble venta de una pieza única.
- **Comisión de galería configurable en caliente** (RF 1.3.2) vía `GET/PATCH /transacciones/config/comision` (Administrador).

### Correo en desarrollo

`SMTP_HOST` está vacío por defecto: todos los correos (verificación, MFA, recuperación de contraseña, notificaciones de curaduría y de ventas) se imprimen en la consola del servidor con el prefijo `📧 EMAIL (modo consola / dev)`. Configura `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` en `.env` para enviarlos de verdad.

### Limitaciones conocidas (documentadas en el código)

- Los códigos OTP (MFA/verificación de email) y la denylist de tokens viven en memoria de un solo proceso — se pierden al reiniciar y no se comparten entre workers. Para producción con múltiples workers, migrar a Redis.
- La comisión de galería configurable también vive en memoria (no hay una tabla `configuracion_sistema` en el esquema actual).
- No hay integración con una pasarela de pago real (ePayco/MercadoPago/Stripe): la confirmación de pago se modela como una acción administrativa manual (`PATCH /transacciones/{id}/estado`).
- La marca de agua sobre la fotografía de previsualización (RF 2.1.1) no está implementada: requiere manejo de subida de archivos (hoy `fotografia_hd_url` es solo una URL externa).

### Pendiente

Los módulos 2 (Catálogo — subida de archivos/watermark), 4 (Logística) y algunos detalles de pagos/pasarela quedan como siguientes iteraciones.
