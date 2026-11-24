"""
Módulo 1.2: Verificación y Validación — Onboarding curatorial de artistas.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import ROL_CURADOR, get_current_user, require_roles
from app.core.database import get_db
from app.models.perfil_artista import PerfilArtista
from app.models.usuario import Usuario
from app.schemas.artista import (
    PerfilArtistaOut,
    PerfilArtistaUpdate,
    PostulacionResumenIAOut,
    PostulacionResumenIARequest,
    ValidacionArtistaRequest,
)
from app.core.config import settings
import json
import urllib.request
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


def _generar_resumen_curatorial_heuristico(
    req: PostulacionResumenIARequest,
) -> PostulacionResumenIAOut:
    """Motor experto curatorial determinista que evalúa las 10 respuestas del artista."""
    puntaje = 50
    fortalezas: list[str] = []
    verificar: list[str] = []

    # 1. Dedicación
    if req.p1_dedicacion == "Actividad principal":
        puntaje += 15
        fortalezas.append("Dedicación profesional a tiempo completo")
    elif req.p1_dedicacion == "Combinada con otras labores":
        puntaje += 10
        fortalezas.append("Práctica artística activa combinada")
    else:
        puntaje += 6
        verificar.append("Acompañar proyección y regularidad de producción")

    # 2. Obra disponible
    if req.p2_obra_disponible == "Lista para exhibir y vender":
        puntaje += 18
        fortalezas.append("Obra producida y lista para exhibición y venta inmediata")
    elif req.p2_obra_disponible == "Requiere montaje":
        puntaje += 11
        verificar.append("Coordinar requerimientos técnicos de montaje en sala")
    elif req.p2_obra_disponible == "En producción":
        puntaje += 6
        verificar.append("Confirmar cronograma de entrega de obra en producción")
    else:
        verificar.append("Actualmente sin obra disponible para sala")

    # 3. Trayectoria
    if req.p3_trayectoria == "Galerías o museos":
        puntaje += 12
        fortalezas.append("Trayectoria validada en galerías o museos")
    elif req.p3_trayectoria == "Espacios independientes o ferias":
        puntaje += 9
        fortalezas.append("Experiencia expositiva en circuito independiente y ferias")
    else:
        puntaje += 3
        verificar.append("Primera exhibición formal: revisar calidad de acabados en el PDF")

    # 4. Vínculo con el Palacio Nacional
    if req.p4_vinculo_palacio == "Tengo taller o galería aquí":
        puntaje += 10
        fortalezas.append("Artista residente con taller/galería en el Palacio Nacional")
    elif req.p4_vinculo_palacio == "He expuesto aquí antes":
        puntaje += 8
        fortalezas.append("Antecedente expositivo positivo en el Palacio Nacional")

    # 9. Statement
    longitud_st = len(req.p9_statement.strip())
    if longitud_st >= 140:
        puntaje += 7
        fortalezas.append("Declaración de obra (Artist Statement) sólida y articulada")
    else:
        verificar.append("Solicitar ampliación del discurso conceptual si pasa a sala")

    puntaje = max(35, min(99, puntaje))
    if puntaje >= 82:
        nivel = "Alta prioridad para sala"
        recomendacion = (
            f"Perfil altamente compatible con la Sala Palacio Nacional en la línea de {req.p5_especialidad}. "
            "Se recomienda aprobar vinculación y agendar revisión física de las piezas de su portafolio PDF."
        )
    elif puntaje >= 65:
        nivel = "Afinidad media-alta · Revisar portafolio"
        recomendacion = (
            f"Propuesta de {req.p5_especialidad} con potencial curatorial. "
            "Se sugiere verificar fichas técnicas y precios en el portafolio PDF antes de confirmar cupo en sala."
        )
    else:
        nivel = "En desarrollo · Seguimiento curatorial"
        recomendacion = (
            "Se recomienda entrevista exploratoria o solicitar disponibilidad de obra terminada antes de programar exhibición."
        )

    perfil_sintesis = (
        f"{req.p6_nombre} ({req.p8_ciudad}) es especialista en {req.p5_especialidad} "
        f"con dedicación «{req.p1_dedicacion.lower()}» y trayectoria en «{req.p3_trayectoria.lower()}». "
        f"Su vínculo actual con el Palacio Nacional es «{req.p4_vinculo_palacio.lower()}» y reporta obra «{req.p2_obra_disponible.lower()}»."
    )

    extracto = req.p9_statement.strip()
    if len(extracto) > 220:
        extracto = extracto[:217].rstrip() + "..."
    analisis_statement = (
        f"Su discurso artístico se centra en {req.p5_especialidad.lower()}, destacando: “{extracto}”. "
        f"Adjunta el expediente «{req.p10_portafolio_nombre}» para validación visual y de avalúo."
    )

    if not verificar:
        verificar.append("Verificar correspondencia entre el PDF adjunto y estándares SHA-256 de sala")

    mensaje_wa = (
        f"Hola {req.p6_nombre}, te saludamos del Comité Curatorial del Palacio Nacional de Medellín. "
        f"Hemos revisado tu postulación en la línea de {req.p5_especialidad} y tu portafolio ({req.p10_portafolio_nombre}). "
        "Nos gustaría coordinar el siguiente paso del proceso curatorial contigo."
    )

    return PostulacionResumenIAOut(
        puntaje_afinidad=puntaje,
        nivel_prioridad=nivel,
        perfil_sintesis=perfil_sintesis,
        analisis_statement=analisis_statement,
        fortalezas=fortalezas,
        aspectos_verificar=verificar,
        recomendacion_curatorial=recomendacion,
        mensaje_sugerido_whatsapp=mensaje_wa,
        motor_utilizado="Motor Curatorial IA · Palacio Nacional",
    )


@router.post("/resumen-ia", response_model=PostulacionResumenIAOut)
def generar_resumen_ia_postulacion(payload: PostulacionResumenIARequest):
    """
    Analiza las 10 respuestas del formulario «Quiero formar parte» mediante IA
    (Google Gemini 2.5 Flash si GEMINI_API_KEY está configurada, con fallback
    inmediato al motor heurístico curatorial).
    """
    if settings.GEMINI_API_KEY:
        try:
            prompt = (
                "Eres el Director de Curaduría del Palacio Nacional de Medellín. "
                "Analiza esta postulación de artista de 10 preguntas y devuelve ÚNICAMENTE un JSON válido "
                "con las claves: puntaje_afinidad (int 0-100), nivel_prioridad (str), perfil_sintesis (str), "
                "analisis_statement (str), fortalezas (list[str]), aspectos_verificar (list[str]), "
                "recomendacion_curatorial (str), mensaje_sugerido_whatsapp (str).\n\n"
                f"Datos del artista:\n{payload.model_dump_json()}"
            )
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
            )
            body = json.dumps(
                {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"},
                }
            ).encode("utf-8")
            req_http = urllib.request.Request(
                url, data=body, headers={"Content-Type": "application/json"}, method="POST"
            )
            with urllib.request.urlopen(req_http, timeout=10) as resp:
                raw = json.loads(resp.read().decode("utf-8"))
                texto_json = raw["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(texto_json)
                return PostulacionResumenIAOut(
                    **parsed,
                    motor_utilizado=f"Google Gemini ({settings.GEMINI_MODEL})",
                )
        except Exception:
            pass

    return _generar_resumen_curatorial_heuristico(payload)
