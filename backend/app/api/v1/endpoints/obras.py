"""
Módulo 2: Curaduría y Catálogo — Ingesta, catálogo público y flujo de
evaluación curatorial de obras de arte.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import ROL_ARTISTA, ROL_CURADOR, get_current_user, require_roles
from app.core.database import get_db
from app.models.obra_arte import ObraArte
from app.models.perfil_artista import PerfilArtista
from app.models.usuario import Usuario
from app.schemas.obra import ObraCreate, ObraEstadoUpdate, ObraOut, ObraUpdate
from app.services.audit_service import ACCION_VALIDACION_OBRA, log_action
from app.services.email_service import enviar_resultado_validacion_obra
from app.services.trust_engine import generar_imagen_qr_png, url_publica_obra
from app.services.watermark_service import generar_preview_con_marca_agua

router = APIRouter()


@router.get("", response_model=list[ObraOut])
def listar_catalogo(
    id_categoria: int | None = Query(None, description="Filtrar por categoría"),
    id_artista: int | None = Query(None, description="Filtrar por artista"),
    precio_min: float | None = Query(None),
    precio_max: float | None = Query(None),
    db: Session = Depends(get_db),
):
    """Catálogo público del comprador con filtros por técnica/artista/precio."""
    query = db.query(ObraArte).filter(ObraArte.estado_obra == "Publicado")
    if id_categoria is not None:
        query = query.filter(ObraArte.id_categoria == id_categoria)
    if id_artista is not None:
        query = query.filter(ObraArte.id_artista == id_artista)
    if precio_min is not None:
        query = query.filter(ObraArte.precio_venta >= precio_min)
    if precio_max is not None:
        query = query.filter(ObraArte.precio_venta <= precio_max)
    return query.all()


@router.get(
    "/pendientes",
    response_model=list[ObraOut],
    dependencies=[Depends(require_roles(ROL_CURADOR))],
)
def listar_obras_pendientes(db: Session = Depends(get_db)):
    """RF 2.2.1 — Cola de obras postuladas en espera de revisión curatorial."""
    return db.query(ObraArte).filter(ObraArte.estado_obra == "Pendiente").all()


@router.get(
    "/mis-obras",
    response_model=list[ObraOut],
    dependencies=[Depends(require_roles(ROL_ARTISTA))],
)
def listar_mis_obras(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Portafolio del artista autenticado, en cualquier estado.

    `GET /obras` solo expone obras 'Publicado' (es el catálogo del comprador),
    así que el artista necesita esta vista aparte para hacer seguimiento de las
    piezas que aún están en revisión curatorial.
    """
    return (
        db.query(ObraArte)
        .filter(ObraArte.id_artista == usuario.id_usuario)
        .order_by(ObraArte.id_obra.desc())
        .all()
    )


@router.get("/uid/{uid}", response_model=ObraOut)
def obtener_obra_por_uid(uid: str, db: Session = Depends(get_db)):
    """Resuelve una obra por su UID público.

    Es el complemento necesario del QR Engine: `codigo_qr_obra` apunta a
    `{FRONTEND_URL}/obras/{uid}` (ver `trust_engine.url_publica_obra`), es decir
    identifica la pieza por su UID y no por su clave primaria, para no exponer
    IDs secuenciales en los códigos impresos junto a la obra.
    """
    obra = db.query(ObraArte).filter(ObraArte.uid == uid).first()
    if obra is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra no encontrada")
    return obra


@router.get("/{id_obra}", response_model=ObraOut)
def obtener_obra(id_obra: int, db: Session = Depends(get_db)):
    """Ficha técnica de la obra (destino tras escaneo de QR físico)."""
    obra = db.get(ObraArte, id_obra)
    if obra is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra no encontrada")
    return obra


@router.post(
    "",
    response_model=ObraOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(ROL_ARTISTA))],
)
def registrar_obra(
    payload: ObraCreate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """RF 2.1.1-2.1.4 — Ingesta de ficha técnica. Requiere artista 'Verificado'."""
    perfil = db.get(PerfilArtista, usuario.id_usuario)
    if perfil is None or perfil.estado_validacion != "Verificado":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo artistas verificados pueden publicar obras (RF 1.2.4)",
        )

    obra = ObraArte(
        uid=str(uuid.uuid4()),
        id_artista=usuario.id_usuario,
        estado_obra="Pendiente",
        **payload.model_dump(),
    )
    db.add(obra)
    db.commit()
    db.refresh(obra)
    # La marca de agua (RF 2.1.1) no se pre-calcula ni se guarda: se genera al
    # vuelo a partir de `fotografia_hd_url` cada vez que se pide
    # `GET /obras/{id}/preview`, igual que los códigos QR.
    return obra


@router.patch("/{id_obra}", response_model=ObraOut)
def actualizar_obra(
    id_obra: int,
    payload: ObraUpdate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """El Artista solo puede editar sus propias obras en borrador u observadas."""
    obra = db.get(ObraArte, id_obra)
    if obra is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra no encontrada")
    if obra.id_artista != usuario.id_usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No es propietario de esta obra")
    if obra.estado_obra not in ("Pendiente",):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Solo se puede editar una obra en estado 'Pendiente'",
        )

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(obra, campo, valor)
    db.commit()
    db.refresh(obra)
    return obra


@router.patch(
    "/{id_obra}/estado",
    response_model=ObraOut,
    dependencies=[Depends(require_roles(ROL_CURADOR))],
)
def actualizar_estado_obra(
    id_obra: int,
    payload: ObraEstadoUpdate,
    curador: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """RF 2.2.2 — Aprobación/rechazo/publicación curatorial de la obra.

    Al pasar a 'Publicado' se dispara el QR Engine: se genera el código QR
    físico que se ubicará junto a la pieza y que remite a su ficha técnica
    pública. La emisión del certificado de autenticidad (Trust Engine) se
    hace aparte, vía `POST /certificados/{id_obra}`, porque requiere que el
    curador aporte su firma digital.
    """
    obra = db.get(ObraArte, id_obra)
    if obra is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra no encontrada")

    obra.estado_obra = payload.estado_obra
    if payload.estado_obra == "Publicado" and not obra.codigo_qr_obra:
        obra.codigo_qr_obra = url_publica_obra(obra.uid)
    db.commit()
    db.refresh(obra)

    log_action(
        db,
        id_usuario=curador.id_usuario,
        accion=ACCION_VALIDACION_OBRA,
        detalles=f"Obra {id_obra} -> {payload.estado_obra}" + (f" ({payload.motivo})" if payload.motivo else ""),
        tabla="obra_arte",
    )

    artista_perfil = db.get(PerfilArtista, obra.id_artista)
    if artista_perfil is not None:
        artista_usuario = db.get(Usuario, artista_perfil.id_artista)
        if artista_usuario is not None:
            enviar_resultado_validacion_obra(
                artista_usuario.correo_electronico,
                titulo_obra=obra.titulo,
                aprobada=payload.estado_obra == "Publicado",
                motivo=payload.motivo,
            )
    return obra


@router.get("/{id_obra}/qr", response_class=Response, responses={200: {"content": {"image/png": {}}}})
def obtener_qr_obra(id_obra: int, db: Session = Depends(get_db)):
    """Renderiza como imagen PNG el código QR físico de la obra (QR Engine)."""
    obra = db.get(ObraArte, id_obra)
    if obra is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra no encontrada")
    if not obra.codigo_qr_obra:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La obra aún no tiene código QR (debe estar publicada)",
        )
    return Response(content=generar_imagen_qr_png(obra.codigo_qr_obra), media_type="image/png")


@router.get("/{id_obra}/preview", response_class=Response, responses={200: {"content": {"image/jpeg": {}}}})
def obtener_preview_obra(id_obra: int, db: Session = Depends(get_db)):
    """RF 2.1.1 — Previsualización pública con marca de agua, generada al
    vuelo a partir de `fotografia_hd_url`. Este es el endpoint que debe
    usarse en el catálogo público en vez de exponer la fotografía en alta
    resolución sin protección."""
    obra = db.get(ObraArte, id_obra)
    if obra is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra no encontrada")
    imagen_jpeg = generar_preview_con_marca_agua(obra.fotografia_hd_url)
    return Response(content=imagen_jpeg, media_type="image/jpeg")
