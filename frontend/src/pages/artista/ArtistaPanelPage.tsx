import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, Pencil, Plus, ShieldCheck, UserCog } from "lucide-react";
import { listarMisObras, urlPreviewObra } from "../../api/obras";
import { obtenerPerfilArtista } from "../../api/artistas";
import { useAuth } from "../../context/AuthContext";
import { PanelShell } from "../../components/layout/PanelShell";
import { Button } from "../../components/ui/Button";
import { BadgeEstadoObra, BadgeEstadoValidacion } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";
import { formatearMoneda } from "../../lib/formato";
import type { Obra, PerfilArtista } from "../../types";

function AvisoValidacion({ perfil }: { perfil: PerfilArtista }) {
  if (perfil.estado_validacion === "Verificado") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-ocre/30 bg-ocre/5 p-5">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-ocre" />
        <div>
          <p className="font-medium text-marfil">Perfil verificado</p>
          <p className="mt-1 text-sm text-marfil-suave">
            Ya puedes postular obras. Cada pieza pasa por revisión curatorial antes de publicarse en el catálogo.
          </p>
        </div>
      </div>
    );
  }

  if (perfil.estado_validacion === "Rechazado") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-terracota/40 bg-terracota/5 p-5">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-terracota" />
        <div>
          <p className="font-medium text-marfil">Vinculación rechazada</p>
          <p className="mt-1 text-sm text-marfil-suave">
            {perfil.motivos_rechazo ??
              "El equipo curatorial no aprobó tu vinculación. Revisa tu correo para conocer los detalles."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-antracita-suave bg-antracita p-5">
      <Clock size={20} className="mt-0.5 shrink-0 text-marfil-suave" />
      <div>
        <p className="font-medium text-marfil">Validación en curso</p>
        <p className="mt-1 text-sm text-marfil-suave">
          El equipo curatorial está revisando tu documento de identidad. Podrás postular obras cuando tu perfil
          quede verificado.
        </p>
      </div>
    </div>
  );
}

function FilaObra({ obra }: { obra: Obra }) {
  const editable = obra.estado_obra === "Pendiente";
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-antracita-suave bg-antracita p-4 sm:flex-row sm:items-center">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-carbon">
        <img
          src={urlPreviewObra(obra.id_obra)}
          alt={obra.titulo}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1">
        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-ocre">{obra.tecnica}</p>
        <p className="mt-1 font-[var(--font-display)] text-lg text-marfil">{obra.titulo}</p>
        <p className="mt-0.5 text-xs text-marfil-suave">
          {obra.dimensiones}
          {obra.anio_creacion ? ` · ${obra.anio_creacion}` : ""}
        </p>
        <p className="mt-1.5 text-sm font-semibold text-ocre">{formatearMoneda(obra.precio_venta)}</p>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <BadgeEstadoObra estado={obra.estado_obra} />
        {editable ? (
          <Link to={`/artista/obras/${obra.id_obra}/editar`}>
            <Button variante="contorno" className="!px-4 !py-1.5 text-xs">
              <Pencil size={13} /> Editar
            </Button>
          </Link>
        ) : (
          <Link
            to={`/obras/${obra.id_obra}`}
            className="text-xs uppercase tracking-wider text-marfil-suave hover:text-ocre"
          >
            Ver ficha
          </Link>
        )}
      </div>
    </div>
  );
}

export function ArtistaPanelPage() {
  const { user } = useAuth();
  const idArtista = user!.id_usuario;

  const { data: perfil, isLoading: cargandoPerfil } = useQuery({
    queryKey: ["artista", idArtista],
    queryFn: () => obtenerPerfilArtista(idArtista),
  });

  const { data: obras, isLoading: cargandoObras, isError } = useQuery({
    queryKey: ["mis-obras"],
    queryFn: listarMisObras,
  });

  const verificado = perfil?.estado_validacion === "Verificado";
  const publicadas = obras?.filter((o) => o.estado_obra === "Publicado").length ?? 0;
  const enRevision = obras?.filter((o) => o.estado_obra === "Pendiente").length ?? 0;

  return (
    <PanelShell
      eyebrow="Panel del artista"
      titulo="Mi portafolio"
      descripcion="Postula nuevas piezas, revisa en qué punto de la curaduría se encuentran y mantén tu perfil al día."
      acciones={
        <>
          {perfil && <BadgeEstadoValidacion estado={perfil.estado_validacion} />}
          <Link to="/artista/perfil">
            <Button variante="contorno">
              <UserCog size={16} /> Mi perfil
            </Button>
          </Link>
          {verificado && (
            <Link to="/artista/obras/nueva">
              <Button>
                <Plus size={16} /> Postular obra
              </Button>
            </Link>
          )}
        </>
      }
    >
      {cargandoPerfil ? <Spinner etiqueta="Cargando tu perfil…" /> : perfil && <AvisoValidacion perfil={perfil} />}

      {obras && obras.length > 0 && (
        <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { etiqueta: "Obras registradas", valor: obras.length },
            { etiqueta: "En revisión", valor: enRevision },
            { etiqueta: "Publicadas", valor: publicadas },
          ].map((dato) => (
            <div key={dato.etiqueta} className="rounded-lg border border-antracita-suave bg-antracita p-5">
              <dt className="text-xs uppercase tracking-[0.14em] text-marfil-suave">{dato.etiqueta}</dt>
              <dd className="mt-2 font-[var(--font-display)] text-3xl text-ocre">{dato.valor}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-10">
        <h2 className="font-[var(--font-display)] text-2xl font-medium text-marfil">Mis obras</h2>

        {cargandoObras && <Spinner etiqueta="Cargando tus obras…" />}
        {isError && <p className="mt-6 text-terracota">No fue posible cargar tu portafolio.</p>}
        {obras && obras.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-antracita-suave p-10 text-center">
            <p className="text-marfil-suave">Todavía no has postulado ninguna obra.</p>
            {verificado && (
              <Link to="/artista/obras/nueva" className="mt-3 inline-block text-sm text-ocre underline">
                Postular mi primera obra
              </Link>
            )}
          </div>
        )}

        {obras && obras.length > 0 && (
          <div className="mt-6 flex flex-col gap-4">
            {obras.map((obra) => (
              <FilaObra key={obra.id_obra} obra={obra} />
            ))}
          </div>
        )}
      </div>
    </PanelShell>
  );
}
