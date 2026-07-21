import type { ReactNode } from "react";

export function AuthCard({
  titulo,
  subtitulo,
  children,
  ancho = "max-w-md",
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  ancho?: string;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-carbon px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: "radial-gradient(ellipse 50% 40% at 50% 0%, rgba(201,162,75,0.12), transparent 70%)" }}
      />
      <div className={`relative w-full ${ancho} rounded-lg border border-antracita-suave bg-antracita p-8 shadow-2xl shadow-black/40`}>
        <h1 className="font-[var(--font-display)] text-2xl font-medium text-marfil">{titulo}</h1>
        {subtitulo && <p className="mt-2 text-sm leading-relaxed text-marfil-suave">{subtitulo}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
