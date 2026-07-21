import { Loader2 } from "lucide-react";

export function Spinner({ etiqueta = "Cargando…" }: { etiqueta?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-marfil-suave">
      <Loader2 size={26} className="animate-spin text-ocre" />
      {etiqueta && <p className="text-sm tracking-wide">{etiqueta}</p>}
    </div>
  );
}
