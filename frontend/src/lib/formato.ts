/**
 * 3.7 Voz y formatos:
 * Moneda: "$ 1.250.000 COP", con puntos para miles y sin decimales.
 * Fechas: largas en texto ("11 de noviembre de 2026") y 11/11/2026 en tablas.
 * Horas en formato 24 h ("14:30").
 */
export function formatearMoneda(valor: string | number): string {
  const numero = typeof valor === "string" ? Number(valor) : valor;
  if (Number.isNaN(numero)) return "$ 0 COP";
  const miles = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(numero));
  return `$ ${miles} COP`;
}

export function formatearFecha(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return fechaIso;
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fecha);
}

export function formatearFechaTabla(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return fechaIso;
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

export function formatearHora(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);
}

export function abreviarNombre(nombreOCorreo: string): string {
  const limpio = nombreOCorreo.trim();
  if (!limpio) return "";
  const base = limpio.includes("@") ? limpio.split("@")[0].replace(/[._-]+/g, " ") : limpio;
  const partes = base.split(/\s+/).filter(Boolean);
  if (partes.length === 1) {
    return partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
  }
  const nombre = partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
  const inicialApellido = partes[1].charAt(0).toUpperCase();
  return `${nombre} ${inicialApellido}.`;
}

