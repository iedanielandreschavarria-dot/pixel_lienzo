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
│   ├── models/                 # Modelos ORM (reflejan bd_pixel_lienzo.txt + configuracion_sistema)
│   ├── schemas/                # Esquemas Pydantic (request/response)
│   ├── api/
│   │   ├── deps.py             # get_current_user, require_roles (RBAC)
│   │   └── v1/
│   │       ├── router.py       # Agregador de todos los sub-routers
│   │       └── endpoints/      # Un archivo por módulo funcional
│   ├── services/                # Lógica de negocio: correo, cifrado, OTP, auditoría, Trust Engine, archivos
│   │   ├── email_service.py     # Envío de correo (fallback a consola en dev)
│   │   ├── crypto_service.py    # Cifrado Fernet de datos bancarios
│   │   ├── audit_service.py     # Registro real en Log_Auditoria
│   │   ├── otp_service.py       # Códigos de un solo uso (MFA / verificación de email)
│   │   ├── trust_engine.py      # Sello SHA-256 + generación de QR (PNG)
│   │   ├── storage_service.py   # Subida/validación de archivos a disco local
│   │   ├── watermark_service.py # Marca de agua real sobre la previsualización
│   │   ├── pagos_service.py     # Reembolso compartido (transacciones ↔ reclamaciones)
│   │   └── wompi_service.py     # Checkout de Wompi + validación de firma del webhook
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
ejecuta automáticamente `app/db/seed.py::seed_roles()` (los 4 roles
obligatorios) y `seed_configuracion_sistema()` (la fila única de
`configuracion_sistema`, con la comisión de galería por defecto). Ambas
funciones son idempotentes. Como segunda red de seguridad, `app/main.py`
también las llama en el evento de arranque de FastAPI.

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
- **Comisión de galería configurable y persistente** (RF 1.3.2) vía `GET/PATCH /transacciones/config/comision` (Administrador). Se guarda en la tabla `configuracion_sistema` (fila única), no en memoria — sobrevive reinicios y se comparte entre workers. Ver la sección "Configuración del sistema" más abajo.
- **Pasarela de pago real (Wompi)**: `POST /transacciones` ya no solo reserva la obra — también genera y devuelve `checkout_url`, la URL de pago hospedada por Wompi a la que el frontend debe redirigir al comprador. Ver la sección "Pasarela de pago (Wompi)" más abajo.

El **Módulo 4 (Logística)** está implementado con lógica de negocio real:

- **Despacho real**: `POST /envios` valida que la transacción exista y esté en `estado_pago = 'Confirmado'` (no se puede despachar algo no pagado), evita duplicar el envío de una misma transacción, genera automáticamente el número de guía (`PYL-XXXXXXXXXX`), autocalcula `valor_seguro` como el valor total de la obra si no se especifica, y notifica al comprador por correo.
- **Ownership real**: `GET /envios/{id}` y `GET /envios` respetan quién consulta — el Comprador solo ve sus propios envíos; Administrador/Curador ven todos (cola de logística).
- **Prueba de entrega**: marcar un envío como `Entregado` exige `foto_recepcion_url` y/o `firma_digital_comprador`; cada cambio de estado notifica al comprador (tracking).
- **Reclamaciones con ownership real**: `POST /reclamaciones` valida que el comprador autenticado sea dueño de la compra asociada al envío; evita reclamaciones duplicadas sobre el mismo envío.
- **Reembolso automático real**: resolver una reclamación como `Devolución Dinero` dispara el mismo reembolso (`app/services/pagos_service.py`) que usaría un Administrador manualmente desde `PATCH /transacciones/{id}/estado` — libera la obra de vuelta al catálogo y notifica al comprador. Queda registrado en `Log_Auditoria`.

El **Módulo 2 (Catálogo / Archivos)** ya soporta subida real de archivos:

- **Subida de archivos** (`app/services/storage_service.py`): `POST /archivos/obra` (solo Artista, fotografía HD) y `POST /archivos/documento-identidad` (público, se usa antes de tener cuenta) guardan el archivo en disco bajo `UPLOAD_DIR` con validación de tipo (`image/jpeg`, `image/png`, `image/webp`, y además `application/pdf` para documentos) y tamaño (`MAX_UPLOAD_SIZE_MB`), y devuelven una URL pública servida vía `/static` (montado con `StaticFiles` en `app/main.py`). Esa URL es la que se usa en `fotografia_hd_url` / `documento_identidad_url`.
- **Marca de agua real** (RF 2.1.1, `app/services/watermark_service.py`): la fotografía en alta resolución nunca se expone directamente al público. `GET /obras/{id}/preview` genera al vuelo (con Pillow) una versión JPEG con una marca de agua diagonal repetida "PIXEL Y LIENZO — VISTA PREVIA" — funciona tanto con imágenes subidas a `/static` como con URLs externas. El catálogo del frontend debe usar este endpoint como `src` de la imagen, no `fotografia_hd_url` directamente.

## Configuración del sistema

La tabla `configuracion_sistema` (agregada en la migración
`817ed02299d7_agrega_configuracion_sistema_y_`) es una tabla de **una sola
fila** (`id_configuracion = 1`) que reemplaza la antigua variable en
memoria de Python para la comisión de galería:

```sql
CREATE TABLE configuracion_sistema (
  id_configuracion INT AUTO_INCREMENT PRIMARY KEY,
  porcentaje_comision_galeria DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  actualizado_por INT NULL,              -- FK -> usuario (SET NULL)
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Se siembra automáticamente (misma estrategia que los 4 roles obligatorios,
ver `app/db/seed.py::seed_configuracion_sistema`) tanto en `alembic
upgrade`/`downgrade` como en el arranque de FastAPI. `GET/PATCH
/transacciones/config/comision` leen y escriben directamente esta fila; el
endpoint PATCH además registra quién hizo el último cambio
(`actualizado_por`) y deja auditoría en `Log_Auditoria`.

Si en el futuro se necesita persistir más parámetros globales (p. ej. un
monto mínimo de envío gratis), se agregan como nuevas columnas de esta
misma tabla vía una migración de Alembic — se eligió esta forma (columnas
tipadas) en vez de un esquema clave-valor genérico para mantener la
consistencia con el resto del esquema (`log_auditoria`, etc.).

## Pasarela de pago (Wompi)

Se integró **Wompi** (pasarela líder en Colombia, COP) mediante su **Web
Checkout**: una página de pago hospedada por Wompi a la que redirigimos al
comprador. El backend **nunca recibe ni almacena datos de tarjeta** (mejor
postura de seguridad/PCI posible sin certificarse como comercio que
tokeniza tarjetas).

Flujo completo:

1. El comprador hace `POST /transacciones` (como hoy). La respuesta ahora
   incluye `checkout_url`, además de los datos de la transacción.
2. El frontend redirige el navegador del comprador a `checkout_url`. Wompi
   muestra su propio formulario de pago (tarjeta, PSE, Nequi, etc.).
3. Cuando el pago se resuelve, Wompi hace `POST` a
   `/api/v1/transacciones/webhook/wompi` con el resultado (`APPROVED`,
   `DECLINED`, `VOIDED`, ...). **Este es el único evento que confirma un
   pago** — nunca confíes en la redirección de vuelta al sitio como señal
   de éxito, porque algunos medios (PSE) tardan minutos en aprobarse.
4. Si el evento viene con firma válida y `status = APPROVED`, la
   transacción pasa a `Confirmado`, la obra a `Vendido`, y se notifica al
   artista — exactamente el mismo efecto que tenía el `PATCH
   /transacciones/{id}/estado` manual, que se conserva como respaldo
   administrativo.
5. Si el pago es `DECLINED`/`VOIDED`/`ERROR`, la transacción pasa a
   `Rechazado` (estado agregado al `CHECK` de `estado_pago` en la misma
   migración que crea `configuracion_sistema`) y la obra se libera (vuelve
   a `Publicado`) para que el comprador reintente con un nuevo `POST
   /transacciones` (nueva referencia, mismo flujo).

Detalles de implementación (`app/services/wompi_service.py`):

- La `reference` que se envía a Wompi codifica nuestro propio
  `id_transaccion` (formato `pyl-{id}-{sufijo aleatorio}`), así el webhook
  puede resolver a qué transacción corresponde sin necesitar una tabla de
  mapeo adicional. Cada nuevo intento de pago (`GET
  /transacciones/{id}/checkout-wompi`) genera una `reference` nueva, que se
  guarda en `transaccion.referencia_pasarela` (fines de soporte y
  reconciliación; la correlación real del webhook sigue siendo por parseo
  del `id_transaccion` codificado en la reference, no por esta columna).
- `signature:integrity` (firma del checkout) y la firma del webhook usan
  secretos **distintos** (`WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET`
  respectivamente) — así lo exige Wompi, no los confundas.
- El webhook valida la firma con el algoritmo documentado por Wompi
  (concatenar los valores de `signature.properties` + `timestamp` + secreto
  de eventos, y comparar el SHA-256 contra `signature.checksum`) usando
  `hmac.compare_digest` (comparación en tiempo constante). Si la firma no
  es válida, o si `WOMPI_EVENTS_SECRET` no está configurado, se responde
  `400` y el evento no se procesa.
- El webhook también valida que `amount_in_cents` coincida con el monto
  esperado de la transacción antes de confirmar el pago (defensa adicional
  contra manipulación).
- Es **idempotente**: si Wompi reenvía el mismo evento (reintentos), o si
  la transacción ya no está en `Procesando`, se responde `200 OK` sin
  reprocesar nada.

### Cómo activar la pasarela

1. Crea una cuenta en el dashboard de comercios (https://comercios.wompi.co)
   y activa el **modo sandbox** (Desarrollo → Programadores).
2. Copia las cuatro credenciales a `.env`: `WOMPI_PUBLIC_KEY`,
   `WOMPI_PRIVATE_KEY` (reservada para uso futuro, el flujo actual no la
   usa), `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET`. Los prefijos de
   sandbox son `pub_test_`, `prv_test_`, `test_integrity_` y `test_events_`;
   no mezcles credenciales de ambientes distintos. La URL del Web Checkout
   es la misma en sandbox y producción: lo que decide el ambiente es el
   prefijo de la llave pública.
3. Reinicia el backend (`.env` se lee al arrancar).
4. Para que Wompi pueda alcanzar el webhook necesitas una URL pública:
   levanta un túnel (`ngrok http 8000`) y registra
   `https://TU-TUNEL/api/v1/transacciones/webhook/wompi` como URL de eventos
   en el dashboard.

Mientras `WOMPI_PUBLIC_KEY` o `WOMPI_INTEGRITY_SECRET` estén vacíos,
`POST /transacciones` responde **503** con un mensaje explícito en vez de
reservar la obra y mandar al comprador a un checkout que Wompi rechazaría.

### Probar el webhook sin túnel

`scripts/simular_webhook_wompi.py` firma un evento `transaction.updated`
idéntico al de Wompi (usando `WOMPI_EVENTS_SECRET`) y lo entrega al webhook
local, así que se puede validar la confirmación del pago sin exponer el
backend a internet:

```bash
python scripts/simular_webhook_wompi.py 12                      # pago aprobado
python scripts/simular_webhook_wompi.py 12 --estado DECLINED    # pago rechazado
python scripts/simular_webhook_wompi.py 12 --firma-invalida     # debe responder 400
python scripts/simular_webhook_wompi.py 12 --monto-en-centavos 999
```

Valida nuestro lado de la integración (firma, idempotencia, defensa contra
monto alterado y efectos en base de datos), no que Wompi acepte el checkout
que construimos: eso solo se comprueba contra el sandbox real.

### Correo en desarrollo

`SMTP_HOST` está vacío por defecto: todos los correos (verificación, MFA, recuperación de contraseña, notificaciones de curaduría y de ventas) se imprimen en la consola del servidor con el prefijo `📧 EMAIL (modo consola / dev)`. Configura `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` en `.env` para enviarlos de verdad.

### Limitaciones conocidas (documentadas en el código)

- Los códigos OTP (MFA/verificación de email) y la denylist de tokens viven en memoria de un solo proceso — se pierden al reiniciar y no se comparten entre workers. Para producción con múltiples workers, migrar a Redis.
- Los archivos subidos se guardan en disco local (`UPLOAD_DIR`, ignorado por git). En un despliegue con múltiples instancias/contenedores efímeros, hay que migrar `storage_service.py` a almacenamiento compartido (S3/Azure Blob/GCS) sin cambiar la interfaz que usan los endpoints.
- `POST /archivos/documento-identidad` es intencionalmente público (se usa antes de que exista la cuenta del artista); no tiene límite de tasa (rate limiting) propio más allá del límite de tamaño por archivo.

### Pendiente

Los 5 módulos principales (Identidad, Catálogo, Pagos + pasarela Wompi, Logística) y el Trust Engine ya tienen lógica de negocio real implementada, incluyendo persistencia real de la configuración (`configuracion_sistema`) y un estado `Rechazado` para pagos fallidos de la pasarela. El webhook está verificado localmente con `scripts/simular_webhook_wompi.py` (firma válida e inválida, monto alterado e idempotencia); falta la prueba contra el sandbox real de Wompi, que requiere credenciales propias y un túnel público.

Dos comportamientos del flujo de pago que conviene resolver antes de ir a producción:

- **Checkout abandonado**: si el comprador cierra la pestaña sin pagar, Wompi no emite ningún evento, así que la obra queda en `Reservado` indefinidamente. Hay que enviar `expiration-time` en el checkout y liberar por tarea programada las reservas vencidas.
- **Trazabilidad prematura**: `POST /transacciones` inserta el registro en `historial_trazabilidad` al iniciar el checkout, no al confirmarse el pago, de modo que un pago fallido o abandonado deja igualmente una transferencia de propiedad en el historial público. Debería moverse a `_confirmar_pago`.
