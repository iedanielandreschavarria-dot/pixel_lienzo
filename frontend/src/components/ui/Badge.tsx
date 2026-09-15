import clsx from "clsx";
import type { EstadoObra, EstadoPago, EstadoValidacion } from "../../types";

const estilosEstadoObra: Record<EstadoObra, string> = {
  Publicado: "border-ocre/40 text-ocre",
  Pendiente: "border-marfil-suave/40 text-marfil-suave",
  Reservado: "border-marfil-suave/40 text-marfil-suave",
  Vendido: "border-marfil-suave/30 text-marfil-suave/70",
  "En Préstamo": "border-marfil-suave/40 text-marfil-suave",
  Mantenimiento: "border-terracota/40 text-terracota",
};

const estilosEstadoPago: Record<EstadoPago, string> = {
  Procesando: "border-ocre/40 text-ocre",
  Confirmado: "border-emerald-400/40 text-emerald-300",
  Dispersado: "border-sky-400/40 text-sky-300",
  Reembolsado: "border-violet-400/40 text-violet-300",
  Rechazado: "border-terracota/40 text-terracota",
};

function Badge({ className, children }: { className?: string; children: string }) {
  return (
    <span
      className={clsx(
        "inline-block rounded-full border bg-black/30 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.12em] backdrop-blur-sm",
        className
      )}
    >
      {children}
    </span>
  );
}

export function BadgeEstadoObra({ estado }: { estado: EstadoObra }) {
  return <Badge className={estilosEstadoObra[estado]}>{estado}</Badge>;
}

export function BadgeEstadoPago({ estado }: { estado: EstadoPago }) {
  return <Badge className={estilosEstadoPago[estado]}>{estado}</Badge>;
}

const estilosEstadoValidacion: Record<EstadoValidacion, string> = {
  Verificado: "border-ocre/40 text-ocre",
  Pendiente: "border-marfil-suave/40 text-marfil-suave",
  Rechazado: "border-terracota/40 text-terracota",
};

export function BadgeEstadoValidacion({ estado }: { estado: EstadoValidacion }) {
  return <Badge className={estilosEstadoValidacion[estado]}>{estado}</Badge>;
}
