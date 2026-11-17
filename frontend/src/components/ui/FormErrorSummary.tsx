export interface ErrorCampoItem {
  idCampo: string;
  etiqueta: string;
  mensaje: string;
}

/**
 * 4.4 y 7.2: Al enviar con errores, el foco va al primer campo inválido y arriba
 * aparece un resumen con enlaces a cada campo.
 */
export function FormErrorSummary({ errores }: { errores: ErrorCampoItem[] }) {
  if (errores.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="border-l-2 border-[color:var(--aviso)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-16)]"
    >
      <div className="flex items-center gap-[var(--espacio-8)] text-[color:var(--aviso)]">
        <span
          aria-hidden="true"
          className="inline-grid h-[var(--espacio-24)] w-[var(--espacio-24)] shrink-0 place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--aviso)] font-[var(--fuente-poster)] text-[length:var(--text-minimo)] leading-none"
        >
          !
        </span>
        <p className="voz-h4 text-[color:var(--tinta)]">Revisa los campos marcados antes de continuar</p>
      </div>
      <ul className="mt-[var(--espacio-8)] flex flex-col gap-[var(--espacio-4)] pl-[var(--espacio-32)]">
        {errores.map((item) => (
          <li key={item.idCampo} className="voz-cuerpo-pequeno text-[color:var(--aviso)]">
            <a
              href={`#${item.idCampo}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(item.idCampo);
                el?.focus();
              }}
              className="underline underline-offset-4 hover:text-[color:var(--tinta)]"
            >
              {item.etiqueta}: {item.mensaje}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

