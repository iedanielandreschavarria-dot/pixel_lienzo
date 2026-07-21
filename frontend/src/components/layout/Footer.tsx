export function Footer() {
  return (
    <footer className="border-t border-antracita-suave/60 bg-carbon-suave">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div>
            <p className="font-[var(--font-display)] text-2xl text-marfil">
              Pixel <span className="italic text-ocre">&amp; Lienzo</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-marfil-suave">
              Galería digital del Palacio Nacional — obras originales, autenticadas y trazables de principio a fin.
            </p>
          </div>
          <div className="text-sm text-marfil-suave">
            <p className="max-w-xs leading-relaxed">
              Cada obra incluye <span className="text-ocre">certificado de autenticidad</span> con sello digital y
              código QR de trazabilidad.
            </p>
          </div>
        </div>
        <p className="mt-12 text-xs uppercase tracking-[0.2em] text-marfil-suave/50">
          © {new Date().getFullYear()} Pixel y Lienzo — Proyecto académico
        </p>
      </div>
    </footer>
  );
}
