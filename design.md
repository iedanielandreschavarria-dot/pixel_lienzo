# Sistema de Diseño Visual — Pixel & Lienzo (`design.md`)

Síntesis técnica y estética del diseño visual vigente de **Pixel & Lienzo — Galería Digital del Palacio Nacional**. Este documento consolida la evolución del *Kit de Identidad Visual* y la *Guía de Interfaces* hacia la implementación real en `frontend/src/`.

---

## 1. Dirección Estética y Concepto Museográfico

El diseño parte de una premisa curatorial clara: **la interfaz es la arquitectura de la sala; la obra de arte es la única protagonista cromática**.

- **Atmósfera *"Piedra Basalto Cálida & Oro Champán Luminoso"* (Oscuro no sombrío):** En lugar de un negro puro abismal o acentos rojos saturados que compitan con las pinturas, la superficie emplea piedra basalto cálida (`#1b1a18` y `#24221f`), textos en marfil luminoso (`#f6f3ec`) y acentos estructurales en bronce antiguo (`#8f6b3e`) y oro champán (`#d8b888`), inspirados en la piedra y herrería del edificio neorrománico del **Palacio Nacional de Medellín** (Agustín Goovaerts, 1933).
- **Principios rectores:**
  1. **Sobriedad deliberada:** transiciones suaves de opacidad, sombra y transformación sin rebotes ni distracciones.
  2. **Jerarquía por luz y borde:** las superficies elevadas se separan con bordes finos de `1px` en oro champán translúcido (`--borde-reposo`), reservando los resplandores cálidos para elementos focales (el disco, el sello de autenticidad y la acción primaria).
  3. **Fidelidad pictórica:** ninguna obra lleva texto superpuesto, filtros de color ni recortes forzados en su vista de contemplación o detalle.

---

## 2. Los Tres Niveles de Intensidad Visual

Cada vista declara su volumen escénico mediante `<Ambiente nivel={1 | 2 | 3} />` (`src/components/escena/Ambiente.tsx`), garantizando que la teatralidad acompañe el descubrimiento y desaparezca al pagar o administrar:

| Nivel | Nombre | Capas ambientales y geométricas | Vistas donde aplica |
| :---: | :--- | :--- | :--- |
| **3** | **Escena completa** | Arco o columna monumental (`.arco` / `.columna`), disco arquitectónico (`.disco`) o cápsula (`.vacio-capsula`), luz cálida inferior animada (`.luz--animada`), foco seguidor del cursor (`.foco`), viñeta suave y grano al `5 %`. | Inicio (`/`), Acceso (`/login`, `/mfa`, `/registro/*`, `/recuperar-password`, `/restablecer-password`, `/verificar-email`) y errores `404` / `403`. |
| **2** | **Escena museográfica ligera** | Fondo `#1b1a18` con luz cálida estática desde abajo (`.luz--estatica`), viñeta suave, grano al `5 %` y tipografía editorial expresiva, sin arco de fondo. | Sala Palacio Nacional (`/sala-palacio-nacional/*`), Artistas (`/artistas`, `/artistas/:id`), Exposiciones (`/exposiciones`), Colecciones (`/colecciones`), Más (`/mas`), Detalle de obra (`/obras/:idObra`), Estudio Motion (`/estudio`) y Verificar certificado (`/verificar/:sello`). |
| **1** | **Funcional de alta legibilidad** | Fondo `#1b1a18` limpio, grano mínimo al `3 %` (`.grano--nivel-1`), superficies `#26231f` y cero lenguaje o animaciones teatrales. | Catálogo completo (`/arte`, `/#coleccion`), Carrito / Checkout (`/carrito`, `/compras/:idTransaccion/resultado`), Mis compras (`/mis-compras`), Cuenta (`/cuenta`), Legales (`/legal/*`) y Paneles por rol (`/artista/*`, `/curaduria`, `/institucional`). |

---

## 3. Fundamentos y Tokens de Diseño (`src/index.css`)

### 3.1. Paleta Cromática Activa

| Token CSS | Valor | Rol semántico y estructural |
| :--- | :--- | :--- |
| `--fondo` | `#1b1a18` | Base general de página y lienzo de lectura. |
| `--vacio` | `#24221f` | Pozos de contraste, pie de página y fondo de visor. |
| `--superficie-elevada` | `#26231f` | Tarjetas funcionales, cabeceras de sección y bloques de panel. |
| `--campo-caja-fondo` | `#23201c` | Relleno de campos de formulario en formato caja (Nivel 1). |
| `--tinta` | `#f6f3ec` | Texto principal, títulos y precios (contraste alto cálido). |
| `--tinta-suave` | `#bdb6ab` | Metadatos, subtítulos, migas de pan y textos secundarios. |
| `--profundidad` | `#2b251f` | Parte superior profunda de gradientes arquitectónicos. |
| `--carmesi` | `#8f6b3e` | Bronce cálido estructural: relleno de botones primarios y acentos sólidos. |
| `--incandescente` | `#ab8350` | Oro ámbar medio: hover de botones primarios y transición lumínica. |
| `--riel` | `#d8b888` | Oro champán luminoso: rieles del arco, bordes activos, enlaces, subrayados e isotipo principal. |
| `--aviso` | `#e6b050` | Ámbar semántico para advertencias y errores de validación que bloquean. |
| `--exito` | `#7ec291` | Verde salvia para confirmaciones, obras publicadas y certificados válidos. |
| `--peligro` | `#d96b6b` | Coral atenuado para alertas destructivas puntuales. |

**Derivados de borde y atmósfera:**
- `--borde-reposo`: `rgba(216, 184, 136, 0.38)` · `--borde-hover`: `rgba(216, 184, 136, 0.85)`
- `--divisor`: `rgba(246, 243, 236, 0.13)` · `--fila-hover`: `rgba(216, 184, 136, 0.12)`
- `--cabecera-fondo`: `rgba(19, 18, 16, 0.96)` · `--modal-velo`: `rgba(15, 14, 12, 0.72)`

### 3.2. Las Tres Voces Tipográficas

| Voz | Familia (`font-family`) | Escala y Pesos | Reglas de aplicación |
| :--- | :--- | :--- | :--- |
| **Títulos y Display** | `"Playfair Display"`, `"TimesNewRomanMTStd"` (local `.woff2`), Georgia, serif | Peso `900`. Display `4.4rem` (`2.6rem` móvil), H1 `3rem` (`2.2rem`), H2 `2.2rem` (`1.7rem`), H3 `1.5rem`, H4 `1.15rem`. | Títulos de escena, encabezados de página y nombres propios de obras/artistas. |
| **Cuerpo, Cursiva y Datos** | `"Cormorant Garamond"`, `"Gramon Mini Edition"` (local `.woff2`), Garamond, serif | Pesos `500` y `600`. Cuerpo `1.25rem`, pequeño `1.1rem`, dato `1.15rem`, campo `1.3rem`. | Texto corrido (`max-width: 70ch`), subtítulos breves en cursiva (`.voz-cursiva`) y cifras/precios (`.voz-dato`). |
| **Póster y Etiquetas** | `"Anton"`, Impact, sans-serif | Peso `400`, `1rem`, `uppercase`, `letter-spacing: 0.12em`. | Etiquetas curatoriales (`.voz-etiqueta`), migas de pan, insignias de estado y encabezados de tabla. Única voz en mayúsculas sostenidas. |

> **Regla numérica transversal:** `html`, `body`, tablas, precios, inputs y códigos aplican `font-variant-numeric: lining-nums tabular-nums` para evitar cifras elzevirianas desalineadas. Tamaño mínimo absoluto: `1rem` (`16px`).

### 3.3. Espaciado, Contenedores y Geometría

- **Escala única de espaciado:** `4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px` (`--espacio-4` a `--espacio-128`).
- **Contenedores:**
  - `.contenedor-pyl`: máximo `1280px` con márgenes laterales responsivos de `16px` (`<600px`), `24px` (`600–1023px`) y `48px` (`≥1024px`).
  - Específicos: Paneles `1200px`, Lectura/Legal `720px`, Resultado checkout `640px`, Verificación `560px`, Formularios y Modales `520px`, Sidebar de panel `240px`, Filtros laterales `280px`.
- **Geometría de bordes:**
  - `--radio-recto` (`0px`): modales, tablas, paneles, insignias de estado y campos de caja.
  - `--catalog-radius` (`10px`): tarjetas y marcos del catálogo Masonry (`.obra__figure`, `.obra__completa`).
  - `--radio-pildora` (`999px`): botones de acción, chips de filtro y cúpulas superiores de acceso.
  - `--radio-circulo` (`50%`): disco de escena, avatares y sello de certificado (`160px`).

### 3.4. Movimiento, Accesibilidad e Impresión

- **Tiempos y curvas:** ruta `300ms`, hover/foco `400ms` (`ease`), cambio de texto `500ms`, aparición de página `600ms`, momentos escénicos `800ms–1400ms` (`cubic-bezier(0.65, 0, 0.25, 1)`), pulso de esqueletos `2.4s`.
- **Accesibilidad (WCAG 2.2 AA):** enlace *"Saltar al contenido"*, áreas táctiles mínimas de `44px`, foco visible por teclado (`2px` con `outline-offset: 3px`), diálogos con `role="dialog"`, `aria-modal="true"` y trampa de foco, estados comunicados siempre con **color + icono + texto**, y anulación automática de animaciones bajo `@media (prefers-reduced-motion: reduce)`.
- **Impresión:** `@media print` conmuta a fondo `#ffffff` y tinta `#000000` para certificados, comprobantes y textos legales.

---

## 4. Arquitectura Escénica e Interacciones Distintivas

### 4.1. Portada Escénica con Scroll Natural (`InicioPage.tsx` + `escena.css`)
- **Entrada (`<Entrada />`):** velo inicial con punto de luz pulsante que se expande una sola vez por sesión.
- **Arco y Rieles (`<Arco />`):** estructura monumental centrada (`--W: min(92vw, 96vh, 980px)`) en gradiente cálido (`#2a241e` → `#46382b` → `#634d39`) con textura orgánica `feTurbulence`, hueco circular superior (`.arco__hueco`) y dos rieles verticales con filo dorado luminoso (`.riel--izq`, `.riel--der`) que acompañan todo el recorrido vertical.
- **Disco Superior (`<Disco />`):** círculo oscuro (`--D: calc(var(--W) * 0.56)`) alojado en la cúspide del arco con el título *"Pixel & Lienzo"*, subtítulo *"Arte con certificado verificable"* y CTA directo *"Explorar obras"* hacia `/arte`.
- **Cuerpo Museográfico:** al descender por el arco con scroll natural emerge el bloque **Galería Palacio Nacional · Encuentra tu obra ideal**, que presenta la reseña arquitectónica del Palacio, 4 piezas destacadas interactivas y el botón *"Ver todo"*.

### 4.2. Catálogo Masonry, Puesta en Escena en Sala y Visor 3D (`ObraCard.tsx`, `ObraLightbox.tsx`, `ObraVisor3DModal.tsx`)
- **Cuadrícula Masonry (`.catalogo__masonry`):** distribución fluida de `1` columna (`<640px`), `2` (`≥640px`), `3` (`≥960px`) y `4` (`≥1280px`), acompañada de barra de búsqueda, ordenamiento, chips activos y panel de filtros lateral (`280px`) o modal móvil.
- **Tarjeta de Obra en Doble Estado (`ObraCard`):**
  1. **Estado de reposo (`.obra__ambiente`):** la pintura se exhibe enmarcada dentro de una escena arquitectónica generada en CSS puro para dimensionar su presencia espacial:
     - *Variante A — Sala de Galería (`.obra__ambiente--galeria`):* techo museográfico con riel de 4 focos cenitales cálidos, muros laterales y piso de madera.
     - *Variante B — Estudio Contemporáneo (`.obra__ambiente--estudio`):* lámpara colgante, ventanal lateral, marco negro con paspartú marfil y mobiliario a escala.
  2. **Estado hover / focus (`.obra__completa`):** la obra completa se despliega suavemente al `100 %` del encuadre sin distracciones y subraya el título inferior.
- **Lightbox Sincronizado (`?obra=<slug>`):** abre la pieza sin recortar (`object-fit: contain`) junto a su ficha curatorial, estado de autenticidad, acción de compra/bolsa y acceso directo al visor tridimensional.
- **Visor 3D a Escala Humana (`ObraVisor3DModal`):** escenario luminoso minimalista (`#f3f3f4`) que renderiza el cuadro con grosor volumétrico 3D y sombra proyectada junto a una **silueta humana de referencia (`1.75 m`)** calculada a partir de las dimensiones reales en centímetros de la obra (`obra.dimensiones`), con rotación de perspectiva, paneo por arrastre y zoom con rueda o botonera flotante.

### 4.3. Acceso Cohesivo (`AuthCard.tsx` + `transicionEscena.ts`)
- Las vistas `/login`, `/mfa`, `/registro`, `/registro/comprador`, `/registro/artista`, `/verificar-email`, `/recuperar-password` y `/restablecer-password` habitan dentro de `.columna` y `.vacio-capsula`.
- `transicionEscena.ts` detecta el origen de navegación para ejecutar morphing fluido **Inicio ↔ Acceso** (`morph-arco-a-columna`, `morph-disco-a-capsula`) y mantener la columna inmóvil al alternar entre subrutas de acceso (`escena-entre-acceso`).
- Incluye autenticación federada con Google Identity Services (`BotonGoogle.tsx`) separada por divisor de riel dorado (`.divisor-riel`) y campos en variante `subrayado`.

### 4.4. Navegación Cultural, Confianza y Paneles Operativos
- **Cabecera (`Header.tsx`):** tres variantes (`completa`, `minima`, `checkout`). En su modo completo articula mega-menús desplegables para los 6 ejes del portal (*Sala Palacio Nacional*, *Artistas*, *Exposiciones*, *Arte*, *Colecciones*, *Más*), buscador rápido, bolsa de adquisición (`CartContext`) y menú de sesión adaptado por rol (`Comprador`, `Artista`, `Curador`, `Administrador`).
- **Verificación Criptográfica (`VerificarCertificadoPage.tsx`):** centrada en el componente `<SelloCertificado />` (`160px`) que transiciona a resplandor salvia (`--resplandor-sello-valido`) al validar un sello `SHA-256`, protegiendo la privacidad del coleccionista.
- **Paneles por Rol (`PanelShell.tsx`):** arquitectura unificada en Nivel 1 con barra lateral fija de `240px`, migas de pan en Anton, tarjetas métricas (`MetricaCard`), tablas responsivas (`Table` que colapsa a tarjetas en móvil) e insignias `BadgeEstado`.

---

## 5. Recursos de Marca y Catálogo Vivo (`/kit`)

- **Isotipos (`frontend/4x/` y `frontend/src/assets/logos/`):** el símbolo de la marca (el arco con su vacío circular superior y sus dos rieles) cuenta con archivo vectorial maestro (`isotipo-pixel-lienzo.ai`) y 8 exportaciones PNG en `681×681 px`, encapsuladas en `<LogoMarca variante="..." tamano="sm|md|lg|xl" />`.
- **Ruta de auditoría visual (`/kit`):** disponible en entorno de desarrollo (`import.meta.env.DEV` → `KitPage.tsx`) para inspeccionar en vivo todos los primitivos UI, estados de la tabla `4.7`, niveles de escena, tipografías y variantes del isotipo.
