"""
Módulo 1.2: Verificación y Validación — Onboarding curatorial de artistas.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import ROL_CURADOR, get_current_user, require_roles
from app.core.database import get_db
from app.models.perfil_artista import PerfilArtista
from app.models.usuario import Usuario
from app.schemas.artista import PerfilArtistaOut, PerfilArtistaUpdate, ValidacionArtistaRequest
from app.services.audit_service import ACCION_VALIDACION_ARTISTA, log_action
from app.services.crypto_service import encrypt_text
from app.services.email_service import enviar_resultado_validacion_artista

router = APIRouter()


@router.get("", response_model=list[PerfilArtistaOut])
def listar_artistas_verificados(db: Session = Depends(get_db)):
    """Directorio público de artistas con perfil 'Verificado'."""
    return (
        db.query(PerfilArtista)
        .filter(PerfilArtista.estado_validacion == "Verificado")
        .order_by(PerfilArtista.id_artista.asc())
        .all()
    )


@router.get(
    "/pendientes",
    response_model=list[PerfilArtistaOut],
    dependencies=[Depends(require_roles(ROL_CURADOR))],
)
def listar_artistas_pendientes(db: Session = Depends(get_db)):
    """RF 1.2.1 — Bandeja de perfiles de artistas en estado 'Pendiente'."""
    return db.query(PerfilArtista).filter(PerfilArtista.estado_validacion == "Pendiente").all()


@router.get("/{id_artista}", response_model=PerfilArtistaOut)
def obtener_perfil_artista(id_artista: int, db: Session = Depends(get_db)):
    perfil = db.get(PerfilArtista, id_artista)
    if perfil is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de artista no encontrado")
    return perfil


@router.patch("/{id_artista}", response_model=PerfilArtistaOut)
def actualizar_perfil_artista(
    id_artista: int,
    payload: PerfilArtistaUpdate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """El Artista edita únicamente su propio perfil (RF 1.3.4)."""
    if usuario.id_usuario != id_artista:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo puede editar su propio perfil")
    perfil = db.get(PerfilArtista, id_artista)
    if perfil is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de artista no encontrado")

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        if campo == "informacion_bancaria" and valor:
            valor = encrypt_text(valor)
        setattr(perfil, campo, valor)
    db.commit()
    db.refresh(perfil)
    return perfil


@router.patch(
    "/{id_artista}/validar",
    response_model=PerfilArtistaOut,
    dependencies=[Depends(require_roles(ROL_CURADOR))],
)
def validar_artista(
    id_artista: int,
    payload: ValidacionArtistaRequest,
    curador: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """RF 1.2.2 / 1.2.3 — Aprobación o rechazo (con motivos) de la vinculación."""
    perfil = db.get(PerfilArtista, id_artista)
    if perfil is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de artista no encontrado")

    perfil.estado_validacion = "Verificado" if payload.aprobar else "Rechazado"
    perfil.motivos_rechazo = payload.motivos_rechazo if not payload.aprobar else None
    db.commit()
    db.refresh(perfil)

    log_action(
        db,
        id_usuario=curador.id_usuario,
        accion=ACCION_VALIDACION_ARTISTA,
        detalles=f"Artista {id_artista}: {'aprobado' if payload.aprobar else 'rechazado'}",
        tabla="perfil_artista",
    )
    artista = db.get(Usuario, id_artista)
    if artista is not None:
        enviar_resultado_validacion_artista(
            artista.correo_electronico, aprobado=payload.aprobar, motivos_rechazo=perfil.motivos_rechazo
        )
    return perfil
