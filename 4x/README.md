# Isotipo Oficial — Pixel & Lienzo (`4x`)

Archivos maestros y exportaciones PNG en alta resolución (`681×681 px`, fondo transparente) del isotipo de **Pixel & Lienzo** (el arco con su vacío circular en la cúspide y sus dos rieles verticales), alineados con los 8 tokens oficiales de la paleta del *Kit de Identidad Visual*.

| Archivo organizado | Mesa de trabajo original | Token CSS | Color Hex | Rol en el sistema |
| :--- | :--- | :--- | :--- | :--- |
| `isotipo-vacio.png` | `Mesa de trabajo 1.png` | `--vacio` | `#000000` | Vacío absoluto (sobre superficies claras o en reserva) |
| `isotipo-fondo.png` | `Mesa de trabajo 2.png` | `--fondo` | `#0a0808` | Negro escena |
| `isotipo-tinta.png` | `Mesa de trabajo 3.png` | `--tinta` | `#f2ece3` | Blanco cálido / Tinta principal sobre `--vacio` o `--carmesi` |
| `isotipo-tinta-suave.png` | `Mesa de trabajo 4.png` | `--tinta-suave` | `#9a958f` | Tinta secundaria / Marca sutil en pies o sellos |
| `isotipo-profundidad.png` | `Mesa de trabajo 5.png` | `--profundidad` | `#4d0d0a` | Rojo profundo |
| `isotipo-carmesi.png` | `Mesa de trabajo 6.png` | `--carmesi` | `#932512` | Carmesí estructural |
| `isotipo-incandescente.png` | `Mesa de trabajo 7.png` | `--incandescente` | `#d4421f` | Rojo incandescente |
| `isotipo-riel.png` | `Mesa de trabajo 8.png` | `--riel` | `#e0472b` | Brasa / Riel (isotipo principal en cabecera, favicon y paneles) |
| `isotipo-pixel-lienzo.ai` | `ronald.ai` | — | Vectorial | Archivo maestro editable en Adobe Illustrator |

## Ubicación en el frontend

- **Módulo de assets tipado (Vite)**: `frontend/src/assets/logos/` (`index.ts`)
- **Componente reutilizable**: `frontend/src/components/ui/LogoMarca.tsx`
- **Archivos públicos estáticos / Favicon**: `frontend/public/logos/`

