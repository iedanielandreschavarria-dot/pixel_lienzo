export function formatearMoneda(valor: string | number): string {
  const numero = typeof valor === "string" ? Number(valor) : valor;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(numero);
}

export function formatearFecha(fechaIso: string): string {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(fechaIso));
}
