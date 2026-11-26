# Isotipo Oficial — Pixel & Lienzo (`4x`)

Archivos maestros y exportaciones PNG en alta resolución (`681×681 px`, fondo transparente) del isotipo de **Pixel & Lienzo** (el arco arquitectónico con su vacío circular en la cúspide y sus dos rieles verticales), exportados a partir de las 8 variantes cromáticas base del *Kit de Identidad Visual*.

> Para consultar la paleta vigente de interfaz (*Piedra Basalto Cálida & Oro Champán Luminoso*) y las reglas globales del sistema visual, revisa [`design.md`](../../design.md) en la raíz del proyecto.

| Archivo organizado | Mesa de trabajo original | Variante (`VarianteLogo`) | Color Hex del PNG | Uso en el sistema |
| :--- | :--- | :--- | :--- | :--- |
| `isotipo-vacio.png` | `Mesa de trabajo 1.png` | `vacio` | `#000000` | Vacío oscuro (sobre superficies claras o impresión) |
| `isotipo-fondo.png` | `Mesa de trabajo 2.png` | `fondo` | `#0a0808` | Tono carbón profundo |
| `isotipo-tinta.png` | `Mesa de trabajo 3.png` | `tinta` | `#f2ece3` | Blanco cálido / Marfil sobre fondos oscuros |
| `isotipo-tinta-suave.png` | `Mesa de trabajo 4.png` | `tinta-suave` | `#9a958f` | Marca sutil para pies secundarios o marcas de agua |
| `isotipo-profundidad.png` | `Mesa de trabajo 5.png` | `profundidad` | `#4d0d0a` | Terracota profundo |
| `isotipo-carmesi.png` | `Mesa de trabajo 6.png` | `carmesi` | `#932512` | Carmesí de archivo |
| `isotipo-incandescente.png` | `Mesa de trabajo 7.png` | `incandescente` | `#d4421f` | Brasa cálida |
| `isotipo-riel.png` | `Mesa de trabajo 8.png` | `riel` | `#e0472b` | Variante principal de marca en cabecera (`Header`), `Footer`, `AuthCard`, paneles y favicon |
| `isotipo-pixel-lienzo.ai` | `ronald.ai` | — | Vectorial | Archivo maestro editable en Adobe Illustrator |

## Integración en el frontend

- **Carpetas de activos `4x`:** `frontend/4x/` y `frontend/src/assets/4x/`
- **Mapa tipado (Vite):** `frontend/src/assets/logos/index.ts`
- **Componente reutilizable:** `frontend/src/components/ui/LogoMarca.tsx` (combina el isotipo con el logotipo `PIXEL & LIENZO` en tipografía *Anton* con color `var(--riel)`)
- **Archivos públicos estáticos / Favicon:** `frontend/public/4x/` y `frontend/public/logos/`
- **Catálogo interactivo en desarrollo:** ruta `/kit` (`frontend/src/pages/KitPage.tsx`)
