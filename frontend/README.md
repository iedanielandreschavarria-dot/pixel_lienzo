# Pixel & Lienzo — Frontend

Aplicación web SPA de **Pixel & Lienzo** (Galería Digital del Palacio Nacional), construida con **React 19**, **TypeScript**, **Vite 8** y **Tailwind CSS v4**.

> Consulta [**`../design.md`**](../design.md) en la raíz del repositorio para la síntesis completa del sistema de diseño visual vigente (*Piedra Basalto Cálida & Oro Champán Luminoso*), tokens, tipografías, niveles escénicos y componentes interactivos.

---

## Stack Tecnológico

- **Núcleo:** React 19 + TypeScript + Vite 8
- **Estilos y Sistema de Diseño:** Tailwind CSS v4 + tokens globales en `src/index.css` y arquitectura escénica en `src/styles/escena.css`
- **Enrutamiento y Formularios:** `react-router-dom v7`, `@tanstack/react-query`, `react-hook-form`
- **Red, Sesión y Carrito:** `axios`, `jwt-decode` (`AuthContext` con RBAC, MFA y Google Identity Services en `BotonGoogle.tsx`) y `CartContext`
- **Animación e Iconografía:** CSS transaccional/escénico + `framer-motion` + `lucide-react` + `clsx`
- **Calidad de Código:** `oxlint` + `tsc -b`

---

## Síntesis Visual e Interfaces

La interfaz aplica la paleta **Piedra Basalto Cálida (`#1b1a18` / `#24221f`) & Oro Champán (`#d8b888` / `#8f6b3e`)** con tres voces tipográficas (*Playfair Display*, *Cormorant Garamond* y *Anton*) y se divide en **3 niveles de intensidad** (`<Ambiente nivel={1|2|3} />`):

1. **Nivel 3 — Escena Completa:**
   - **Inicio (`/`):** Arco arquitectónico con rieles dorados, disco superior con acción directa a `/arte` y sección museográfica *Galería Palacio Nacional · Encuentra tu obra ideal* con scroll natural.
   - **Acceso (`/login`, `/mfa`, `/registro/*`, `/recuperar-password`, `/restablecer-password`, `/verificar-email`):** Columna y cápsula con transiciones cohesivas (`transicionEscena.ts`) y botón de Google.
   - **Errores `404` y `403` (`NotFoundPage` / `ForbiddenPage`).**
2. **Nivel 2 — Escena Museográfica Ligera:**
   - Secciones curatoriales (*Sala Palacio Nacional* `/sala-palacio-nacional/*`, *Artistas* `/artistas`, *Exposiciones* `/exposiciones`, *Colecciones* `/colecciones`, *Más* `/mas`), detalle de obra (`/obras/:idObra`), Estudio Motion (`/estudio`) y verificador público de certificados SHA-256 (`/verificar/:sello`).
3. **Nivel 1 — Funcional de Alta Legibilidad:**
   - **Catálogo (`/arte`):** Cuadrícula Masonry (`1` a `4` columnas) donde cada `ObraCard` exhibe la pintura enmarcada en sala/estudio en reposo y la obra completa en hover, con `ObraLightbox` sincronizado por URL (`?obra=<slug>`) y **Visor 3D a escala humana (`1.75 m`)** (`ObraVisor3DModal`).
   - **Operación y Transacciones:** Carrito/Checkout (`/carrito`, `/compras/:idTransaccion/resultado`), Mis compras (`/mis-compras`), Cuenta (`/cuenta`), páginas legales (`/legal/*`) y paneles protegidos por rol (`/artista/*`, `/curaduria`, `/institucional`).

---

## Estructura de `src/`

```text
src/
├── api/            # Clientes Axios por dominio (auth, obras, artistas, categorias, curaduria, transacciones, certificados)
├── assets/
│   ├── 4x/         # 8 variantes PNG oficiales del isotipo + maestro vectorial .ai
│   ├── fonts/      # Tipografías locales (.woff2: Gramon Mini Edition, TimesNewRomanMTStd)
│   └── logos/      # Mapa tipado de variantes del isotipo (index.ts)
├── components/
│   ├── auth/       # BotonGoogle (Google Identity Services)
│   ├── catalogo/   # ObraLightbox y ObraVisor3DModal (escala humana 1.75 m + marco 3D)
│   ├── escena/     # Ambiente, Arco, Columna, Disco, Entrada, Foco
│   ├── layout/     # Header (mega-menú + buscador + bolsa), Footer, Layout, PanelShell
│   ├── motion/     # Componentes interactivos para Estudio Motion
│   ├── ui/         # Primitivos del sistema de diseño (Button, Input, Modal, Table, Badge, LogoMarca, etc.)
│   ├── ObraCard.tsx
│   └── ProtectedRoute.tsx
├── context/        # AuthContext, CartContext y ToastContext
├── lib/            # formato.ts, navegacion.ts, obrasMuestraPalacio.ts, transicionEscena.ts
├── pages/          # Vistas públicas, SeccionesHeaderPages, auth/, artista/, curaduria/, institucional/ y KitPage (/kit en DEV)
├── styles/         # escena.css (atmósfera, arco, disco, columna y morphing entre escenas)
├── types/          # Contratos TypeScript sincronizados con el backend
├── index.css       # Tokens globales, tipografía, Masonry y escenas CSS de galería/estudio
├── App.tsx         # Enrutador principal y guardias por rol
└── main.tsx        # Punto de entrada
```

---

## Scripts Disponibles

```powershell
npm install      # Instalar dependencias
npm run dev      # Servidor de desarrollo en http://localhost:5173 (incluye /kit)
npm run lint     # Revisión estática con oxlint
npm run build    # Verificación de tipos (tsc -b) + build de producción
npm run preview  # Previsualizar build compilado
```
