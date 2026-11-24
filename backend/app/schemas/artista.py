from pydantic import BaseModel, ConfigDict


class PerfilArtistaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_artista: int
    biografia_profesional: str | None = None
    documento_identidad_url: str
    estado_validacion: str
    motivos_rechazo: str | None = None


class PerfilArtistaUpdate(BaseModel):
    biografia_profesional: str | None = None
    informacion_bancaria: str | None = None


class ValidacionArtistaRequest(BaseModel):
    aprobar: bool
    motivos_rechazo: str | None = None


class PostulacionResumenIARequest(BaseModel):
    p1_dedicacion: str
    p2_obra_disponible: str
    p3_trayectoria: str
    p4_vinculo_palacio: str
    p5_especialidad: str
    p6_nombre: str
    p7_correo: str
    p7_whatsapp: str
    p8_ciudad: str
    p8_instagram: str
    p9_statement: str
    p10_portafolio_nombre: str


class PostulacionResumenIAOut(BaseModel):
    puntaje_afinidad: int
    nivel_prioridad: str
    perfil_sintesis: str
    analisis_statement: str
    fortalezas: list[str]
    aspectos_verificar: list[str]
    recomendacion_curatorial: str
    mensaje_sugerido_whatsapp: str
    motor_utilizado: str
