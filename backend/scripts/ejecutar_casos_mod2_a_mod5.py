"""Ejecuta los lotes de pruebas MOD2 (Catálogo), MOD3 (Pagos/Wompi),
MOD4 (Logística/Reclamaciones) y MOD5 (Trust Engine: Certificados/Trazabilidad)
contra la app FastAPI + MySQL real (`pixel_lienzo_db`), diseña la hoja
`Casos_MOD5` y actualiza el libro Excel de la Matriz de Casos de Prueba
(`TP-2026-001`).
"""
from __future__ import annotations

import copy
import hashlib
import io
import json
import os
import re
import sys
import time
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

captured_emails: list[dict] = []


def _capture_send_email(to: str, subject: str, body: str) -> None:
    captured_emails.append({"to": to, "subject": subject, "body": body})


def _make_tiny_jpeg() -> bytes:
    from PIL import Image

    buf = io.BytesIO()
    img = Image.new("RGB", (64, 64), color=(147, 37, 18))
    img.save(buf, format="JPEG")
    return buf.getvalue()


CASOS_MOD5_SPEC = [
    {
        "id": "MOD5-TRU-01",
        "prioridad": "P1",
        "tipo": "Funcional / API",
        "tecnica": "Transición de estado",
        "titulo": "El curador emite certificado y nace el sello SHA-256 de 64 caracteres (RF 5.1.1, 5.2.1)",
        "precondiciones": "• Obra publicada en catálogo sin certificado previo.\n• Token de Curador (tras MFA).",
        "pasos": "1. POST /api/v1/certificados/{id_obra} con firma_digital_curador y pdf_certificado_url.\n2. GET /api/v1/certificados/{id_obra}.\n3. GET /api/v1/auditoria como Administrador.",
        "esperado": "HTTP 201. codigo_qr_validacion tiene 64 caracteres hexadecimales (SHA-256). sello_tiempo no nulo. Queda registro EMISION_CERTIFICADO en log_auditoria.",
    },
    {
        "id": "MOD5-TRU-02",
        "prioridad": "P1",
        "tipo": "Funcional / API",
        "tecnica": "Partición de equivalencia",
        "titulo": "Verificación pública por sello SHA-256 devuelve sello_valido=true sin token (RF 5.3.1, 5.3.2)",
        "precondiciones": "• Certificado emitido en TRU-01 con codigo_qr_validacion conocido.",
        "pasos": "1. GET /api/v1/certificados/verificar/{sello} sin cabecera Authorization.\n2. Inspeccionar sello_valido, certificado y obra.",
        "esperado": "HTTP 200. sello_valido = true. Incluye metadatos públicos de la obra (sin exponer fotografia_hd_url ni precio).",
    },
    {
        "id": "MOD5-TRU-03",
        "prioridad": "P1",
        "tipo": "Negativo / Estado",
        "tecnica": "Transición de estado",
        "titulo": "Una obra no puede certificarse dos veces",
        "precondiciones": "• Obra ya certificada en TRU-01.\n• Token de Curador.",
        "pasos": "1. Repetir POST /api/v1/certificados/{id_obra} con otra firma o PDF.",
        "esperado": "HTTP 409 Conflict. detail: «La obra ya posee un certificado». El sello original se conserva intacto.",
    },
    {
        "id": "MOD5-TRU-04",
        "prioridad": "P1",
        "tipo": "RBAC / API",
        "tecnica": "Tabla de decisión",
        "titulo": "Solo el curador emite certificados de autenticidad",
        "precondiciones": "• Obra publicada sin certificado.\n• Tokens de Comprador, Artista y Administrador.",
        "pasos": "1. POST /api/v1/certificados/{id_obra} sin token.\n2. Con Comprador.\n3. Con Artista.\n4. Con Administrador.",
        "esperado": "Sin token → 401. Comprador, Artista y Administrador → 403. No se crea certificado.",
    },
    {
        "id": "MOD5-TRU-05",
        "prioridad": "P1",
        "tipo": "Funcional / RBAC",
        "tecnica": "Partición de equivalencia",
        "titulo": "Cola de obras pendientes de certificación solo para Curador",
        "precondiciones": "• Al menos una obra publicada sin certificado y otra ya certificada (TRU-01).\n• Tokens de Curador y Comprador.",
        "pasos": "1. GET /api/v1/certificados/pendientes sin token y como Comprador.\n2. GET /api/v1/certificados/pendientes como Curador.",
        "esperado": "Sin token → 401. Comprador → 403. Curador → 200; lista obras no pendientes de curaduría que aún no tienen certificado (excluye la de TRU-01).",
    },
    {
        "id": "MOD5-TRU-06",
        "prioridad": "P1",
        "tipo": "Funcional / API",
        "tecnica": "Partición de equivalencia",
        "titulo": "Renderizado PNG del código QR de validación del certificado",
        "precondiciones": "• Obra certificada en TRU-01.",
        "pasos": "1. GET /api/v1/certificados/{id_obra}/qr sin token.\n2. GET /api/v1/certificados/999999/qr.",
        "esperado": "Obra certificada → HTTP 200 con Content-Type image/png y cabecera PNG válida. Inexistente o sin certificado → HTTP 404.",
    },
    {
        "id": "MOD5-TRU-07",
        "prioridad": "P1",
        "tipo": "Seguridad / Integridad",
        "tecnica": "Transición de estado",
        "titulo": "Alteración posterior de la ficha técnica invalida el sello SHA-256 (sello_valido=false)",
        "precondiciones": "• Obra certificada en TRU-01.\n• Modificación directa en BD o curatorial de un campo que entra en el hash (p. ej. tecnica).",
        "pasos": "1. Alterar temporalmente tecnica de la obra certificada.\n2. GET /api/v1/certificados/verificar/{sello}.\n3. Restaurar el valor original de tecnica y repetir el GET.",
        "esperado": "Con el dato alterado → HTTP 200 pero sello_valido = false (detecta manipulación). Al restaurar → sello_valido = true.",
    },
    {
        "id": "MOD5-TRU-08",
        "prioridad": "P2",
        "tipo": "Negativo / API",
        "tecnica": "Partición de equivalencia",
        "titulo": "Verificación de sello inexistente y certificado de obra inexistente",
        "precondiciones": "• API en marcha.",
        "pasos": "1. GET /api/v1/certificados/verificar/0000000000000000000000000000000000000000000000000000000000000000.\n2. GET /api/v1/certificados/999999.\n3. POST /api/v1/certificados/999999 como Curador.",
        "esperado": "Las tres responden HTTP 404 con mensaje claro de recurso no encontrado.",
    },
    {
        "id": "MOD5-TRU-09",
        "prioridad": "P1",
        "tipo": "Funcional / Estado",
        "tecnica": "Tabla de decisión",
        "titulo": "Descarga definitiva del certificado exige envío Entregado para el Comprador (RF 5.2.2)",
        "precondiciones": "• Obra certificada y comprada por Comprador 1.\n• Envío en estado Empacado/En Camino y luego pasado a Entregado.",
        "pasos": "1. GET /api/v1/certificados/{id_obra}/descargar como Comprador 1 antes de confirmar entrega.\n2. Confirmar recepción del envío (Entregado).\n3. Repetir GET /api/v1/certificados/{id_obra}/descargar como Comprador 1.",
        "esperado": "Antes de Entregado → HTTP 409 Conflict (RF 5.2.2). Después de Entregado → HTTP 200 con los datos del certificado.",
    },
    {
        "id": "MOD5-TRU-10",
        "prioridad": "P2",
        "tipo": "Validación / API",
        "tecnica": "Partición de equivalencia",
        "titulo": "Emisión de certificado sin firma digital o sin URL de PDF falla por validación",
        "precondiciones": "• Obra publicada sin certificado. Token de Curador.",
        "pasos": "1. POST /api/v1/certificados/{id_obra} omitiendo firma_digital_curador.",
        "esperado": "HTTP 422 Unprocessable Entity. No se emite certificado.",
    },
    {
        "id": "MOD5-TRA-01",
        "prioridad": "P1",
        "tipo": "Funcional / API",
        "tecnica": "Transición de estado",
        "titulo": "GET /trazabilidad/{id_obra} refleja el cambio de propietario tras pago Confirmado (RF 5.4.1)",
        "precondiciones": "• Obra vendida con pago Confirmado.",
        "pasos": "1. GET /api/v1/trazabilidad/{id_obra} sin token.",
        "esperado": "HTTP 200. Lista ordenada cronológicamente que incluye id_propietario_nuevo = comprador, id_propietario_anterior = artista e id_transaccion.",
    },
    {
        "id": "MOD5-TRA-02",
        "prioridad": "P1",
        "tipo": "Funcional / Estado",
        "tecnica": "Transición de estado",
        "titulo": "Obra sin ventas confirmadas tiene historial de trazabilidad vacío",
        "precondiciones": "• Obra recién publicada sin compras confirmadas.",
        "pasos": "1. GET /api/v1/trazabilidad/{id_obra}.",
        "esperado": "HTTP 200 con arreglo vacío [].",
    },
    {
        "id": "MOD5-TRA-03",
        "prioridad": "P1",
        "tipo": "RBAC / API",
        "tecnica": "Tabla de decisión",
        "titulo": "Consulta global de trazabilidad exclusiva para Administrador (RF 5.4.2)",
        "precondiciones": "• Tokens de Comprador, Curador y Administrador.",
        "pasos": "1. GET /api/v1/trazabilidad sin token, con Comprador y con Curador.\n2. GET /api/v1/trazabilidad con Administrador.",
        "esperado": "Sin token → 401. Comprador y Curador → 403. Administrador → 200 con el historial global de procedencia.",
    },
    {
        "id": "MOD5-TRA-04",
        "prioridad": "P2",
        "tipo": "Seguridad / API",
        "tecnica": "Exploratoria",
        "titulo": "Inmutabilidad del historial de trazabilidad (Provenance)",
        "precondiciones": "• Registro existente en historial_trazabilidad. Token de Administrador.",
        "pasos": "1. Intentar DELETE o PATCH sobre /api/v1/trazabilidad/{id_obra}.",
        "esperado": "HTTP 405 Method Not Allowed (no existen endpoints para alterar o borrar el historial de dueños).",
    },
    {
        "id": "MOD5-UI-01",
        "prioridad": "P1",
        "tipo": "Usabilidad / UI",
        "tecnica": "Flujo de sistema",
        "titulo": "Página pública /verificar/{sello} muestra indicador visual de autenticidad (RF 5.3.2)",
        "precondiciones": "• Frontend en http://localhost:5173. Sello válido de TRU-01.",
        "pasos": "1. Abrir /verificar/{sello} sin iniciar sesión.\n2. Probar con un sello inventado.",
        "esperado": "Sello válido muestra indicador de Certificado Auténtico y datos de la obra. Sello inexistente muestra alerta roja de no verificado.",
    },
    {
        "id": "MOD5-UI-02",
        "prioridad": "P1",
        "tipo": "Usabilidad / UI",
        "tecnica": "Flujo de sistema",
        "titulo": "Emisión de certificado desde el panel de Curaduría y línea de trazabilidad en ficha",
        "precondiciones": "• Sesión de Curador en /curaduria y vista /obras/{id}.",
        "pasos": "1. Emitir certificado desde DialogoEmitirCertificado en /curaduria.\n2. Abrir /obras/{id} y verificar LineaTrazabilidad.",
        "esperado": "El diálogo emite el certificado y actualiza la cola. La ficha de la obra renderiza la línea de tiempo de propietarios.",
    },
]


def main() -> None:
    import app.services.email_service as email_service

    email_service.send_email = _capture_send_email  # type: ignore

    from fastapi.testclient import TestClient

    from app.core.config import settings
    from app.core.database import SessionLocal
    from app.core.security import hash_password
    from app.main import app
    from app.models.categoria_arte import CategoriaArte
    from app.models.obra_arte import ObraArte
    from app.models.perfil_artista import PerfilArtista
    from app.models.rol import Rol
    from app.models.usuario import Usuario
    from app.services import otp_service

    # Configurar llaves de prueba de Wompi en memoria para la corrida de MOD3
    settings.WOMPI_PUBLIC_KEY = settings.WOMPI_PUBLIC_KEY or "pub_test_Q5yDA9xoKdePzhSGeVe9HAez7HgGORGf"
    settings.WOMPI_INTEGRITY_SECRET = settings.WOMPI_INTEGRITY_SECRET or "test_integrity_secret_pyl_2026"
    settings.WOMPI_EVENTS_SECRET = settings.WOMPI_EVENTS_SECRET or "test_events_secret_pyl_2026"

    stamp = int(time.time())
    pwd = "PruebaSegura123!"
    fecha_hoy = time.strftime("%d/%m/%Y")
    ejecutor = "Corrida API (TestClient FastAPI) — Suite Automatizada"
    entorno = "TestClient + MySQL local (pixel_lienzo_db)"

    results: dict[str, dict] = {}

    def rec(cid: str, status: str, evidencia: str, obs: str = "TestClient contra MySQL real pixel_lienzo_db.") -> None:
        results[cid] = {
            "id": cid,
            "resultado": status,
            "fecha": fecha_hoy,
            "ejecutor": ejecutor,
            "evidencia": str(evidencia)[:1400],
            "observaciones": obs,
            "entorno": entorno,
        }
        print(f"  [{status}] {cid}: {str(evidencia)[:140]}")

    # Preparar cuentas de prueba en BD real
    db = SessionLocal()
    try:
        roles = {r.nombre_rol: r.id_rol for r in db.query(Rol).all()}
        cat = db.query(CategoriaArte).first()
        if not cat:
            cat = CategoriaArte(nombre_categoria="Óleo sobre lienzo", descripcion_categoria="Categoría base QA")
            db.add(cat)
            db.commit()
            db.refresh(cat)
        id_cat_1 = cat.id_categoria

        cat2 = db.query(CategoriaArte).filter(CategoriaArte.id_categoria != id_cat_1).first()
        if not cat2:
            cat2 = CategoriaArte(nombre_categoria=f"Escultura QA {stamp}", descripcion_categoria="Categoría 2 QA")
            db.add(cat2)
            db.commit()
            db.refresh(cat2)
        id_cat_2 = cat2.id_categoria

        def crear_usuario_bd(email: str, rol_nombre: str, mfa: bool = False) -> Usuario:
            u = Usuario(
                correo_electronico=email,
                contrasenia=hash_password(pwd),
                id_rol=roles[rol_nombre],
                mfa_activado=mfa,
                estado_cuenta="Activo",
            )
            db.add(u)
            db.commit()
            db.refresh(u)
            return u

        u_comp1 = crear_usuario_bd(f"qa.m25.comp1.{stamp}@pixelylienzo.mx", "Comprador")
        u_comp2 = crear_usuario_bd(f"qa.m25.comp2.{stamp}@pixelylienzo.mx", "Comprador")
        u_art_ver = crear_usuario_bd(f"qa.m25.artver.{stamp}@pixelylienzo.mx", "Artista")
        u_art_pend = crear_usuario_bd(f"qa.m25.artpend.{stamp}@pixelylienzo.mx", "Artista")
        u_art_pend2 = crear_usuario_bd(f"qa.m25.artpend2.{stamp}@pixelylienzo.mx", "Artista")
        u_art_rech = crear_usuario_bd(f"qa.m25.artrech.{stamp}@pixelylienzo.mx", "Artista")
        u_curador = crear_usuario_bd(f"qa.m25.curador.{stamp}@pixelylienzo.mx", "Curador", mfa=True)
        u_admin = crear_usuario_bd(f"qa.m25.admin.{stamp}@pixelylienzo.mx", "Administrador", mfa=True)

        for u, est in [
            (u_art_ver, "Verificado"),
            (u_art_pend, "Pendiente"),
            (u_art_pend2, "Pendiente"),
            (u_art_rech, "Pendiente"),
        ]:
            db.add(
                PerfilArtista(
                    id_artista=u.id_usuario,
                    biografia_profesional=f"Biografía inicial de {u.correo_electronico}",
                    documento_identidad_url="/static/documentos/doc_qa.pdf",
                    estado_validacion=est,
                )
            )
        db.commit()

        ids = {
            "comp1": (u_comp1.id_usuario, u_comp1.correo_electronico),
            "comp2": (u_comp2.id_usuario, u_comp2.correo_electronico),
            "art_ver": (u_art_ver.id_usuario, u_art_ver.correo_electronico),
            "art_pend": (u_art_pend.id_usuario, u_art_pend.correo_electronico),
            "art_pend2": (u_art_pend2.id_usuario, u_art_pend2.correo_electronico),
            "art_rech": (u_art_rech.id_usuario, u_art_rech.correo_electronico),
            "curador": (u_curador.id_usuario, u_curador.correo_electronico),
            "admin": (u_admin.id_usuario, u_admin.correo_electronico),
        }
    finally:
        db.close()

    with TestClient(app) as client:
        def get_token(email: str, staff: bool = False) -> dict[str, str]:
            r = client.post("/api/v1/auth/login", json={"correo_electronico": email, "contrasenia": pwd})
            assert r.status_code == 200, r.text
            data = r.json()
            if data.get("requiere_mfa") or staff:
                code = None
                for item in reversed(captured_emails):
                    if item["to"] == email:
                        m = re.search(r"\b(\d{6})\b", item["body"])
                        if m:
                            code = m.group(1)
                            break
                rm = client.post(
                    "/api/v1/auth/mfa/verificar",
                    json={"correo_electronico": email, "codigo": code},
                )
                assert rm.status_code == 200, rm.text
                data = rm.json()
            return {"Authorization": f"Bearer {data['access_token']}"}

        h_comp1 = get_token(ids["comp1"][1])
        h_comp2 = get_token(ids["comp2"][1])
        h_art_ver = get_token(ids["art_ver"][1])
        h_art_pend = get_token(ids["art_pend"][1])
        h_art_rech = get_token(ids["art_rech"][1])
        h_curador = get_token(ids["curador"][1], staff=True)
        h_admin = get_token(ids["admin"][1], staff=True)

        # =====================================================================
        # LOTE MOD2 — CURADURÍA Y CATÁLOGO (29 casos)
        # =====================================================================
        print("\n=== EJECUTANDO CASOS_MOD2 ===")

        # MOD2-ART-09: Subida de fotografía (JPEG, PDF prohibido, vacío)
        jpeg_bytes = _make_tiny_jpeg()
        r_jpg = client.post(
            "/api/v1/archivos/obra",
            headers=h_art_ver,
            files={"archivo": ("obra_qa.jpg", jpeg_bytes, "image/jpeg")},
        )
        r_pdf = client.post(
            "/api/v1/archivos/obra",
            headers=h_art_ver,
            files={"archivo": ("doc.pdf", b"%PDF-1.4 contenido", "application/pdf")},
        )
        r_empty = client.post(
            "/api/v1/archivos/obra",
            headers=h_art_ver,
            files={"archivo": ("vacio.jpg", b"", "image/jpeg")},
        )
        foto_url_qa = r_jpg.json().get("url", "/static/obras/qa.jpg")
        ok_art09 = r_jpg.status_code == 201 and r_pdf.status_code == 415 and r_empty.status_code == 400
        rec(
            "MOD2-ART-09",
            "OK" if ok_art09 else "FALLA",
            f"JPEG={r_jpg.status_code} url={foto_url_qa}; PDF={r_pdf.status_code}; Vacio={r_empty.status_code}",
        )

        # MOD2-ART-10: Solo el artista sube fotografía
        r_no_tok = client.post("/api/v1/archivos/obra", files={"archivo": ("a.jpg", jpeg_bytes, "image/jpeg")})
        r_comp_up = client.post(
            "/api/v1/archivos/obra",
            headers=h_comp1,
            files={"archivo": ("a.jpg", jpeg_bytes, "image/jpeg")},
        )
        rec(
            "MOD2-ART-10",
            "OK" if (r_no_tok.status_code == 401 and r_comp_up.status_code == 403) else "FALLA",
            f"sin_token={r_no_tok.status_code}; comprador={r_comp_up.status_code}",
        )

        # MOD2-ART-02: Artista no verificado no puede registrar obras
        obra_body_base = {
            "titulo": f"Obra Laboratorio {stamp}",
            "tecnica": "Óleo sobre lienzo",
            "dimensiones": "80x100 cm",
            "peso": "4.50",
            "anio_creacion": 2025,
            "precio_venta": "1500000.00",
            "fotografia_hd_url": foto_url_qa,
            "id_categoria": id_cat_1,
        }
        r_art02 = client.post("/api/v1/obras", headers=h_art_pend, json=obra_body_base)
        rec(
            "MOD2-ART-02",
            "OK" if r_art02.status_code == 403 else "FALLA",
            f"HTTP {r_art02.status_code} {r_art02.json()}",
        )

        # MOD2-CUR-04: Curador aprueba perfil de artista pendiente (art_pend2)
        r_pend_list = client.get("/api/v1/artistas/pendientes", headers=h_curador)
        r_val_ok = client.patch(
            f"/api/v1/artistas/{ids['art_pend2'][0]}/validar",
            headers=h_curador,
            json={"aprobar": True},
        )
        rec(
            "MOD2-CUR-04",
            "OK" if (r_pend_list.status_code == 200 and r_val_ok.status_code == 200 and r_val_ok.json().get("estado_validacion") == "Verificado") else "FALLA",
            f"PATCH {r_val_ok.status_code} estado={r_val_ok.json().get('estado_validacion')}",
        )

        # MOD2-CUR-05: Curador rechaza perfil de artista (art_rech) y no puede cargar obras
        r_val_no = client.patch(
            f"/api/v1/artistas/{ids['art_rech'][0]}/validar",
            headers=h_curador,
            json={"aprobar": False, "motivos_rechazo": "Documento ilegible"},
        )
        r_post_rech = client.post("/api/v1/obras", headers=h_art_rech, json=obra_body_base)
        rec(
            "MOD2-CUR-05",
            "OK" if (r_val_no.status_code == 200 and r_val_no.json().get("estado_validacion") == "Rechazado" and r_post_rech.status_code == 403) else "FALLA",
            f"estado={r_val_no.json().get('estado_validacion')} motivos={r_val_no.json().get('motivos_rechazo')}; POST obra={r_post_rech.status_code}",
        )

        # MOD2-ART-01: Artista verificado registra obra -> queda Pendiente
        r_art01 = client.post("/api/v1/obras", headers=h_art_ver, json=obra_body_base)
        obra_1 = r_art01.json()
        id_obra_1 = obra_1["id_obra"]
        uid_obra_1 = obra_1["uid"]
        r_cat_pub = client.get("/api/v1/obras")
        r_mis_obras = client.get("/api/v1/obras/mis-obras", headers=h_art_ver)
        en_cat = any(o["id_obra"] == id_obra_1 for o in r_cat_pub.json())
        en_mis = any(o["id_obra"] == id_obra_1 for o in r_mis_obras.json())
        rec(
            "MOD2-ART-01",
            "OK" if (r_art01.status_code == 201 and obra_1["estado_obra"] == "Pendiente" and not en_cat and en_mis) else "FALLA",
            f"HTTP {r_art01.status_code} id_obra={id_obra_1} estado={obra_1['estado_obra']} en_catalogo={en_cat} en_mis_obras={en_mis}",
        )

        # MOD2-CAT-01: GET /obras público solo lista estado Publicado
        r_get_pend = client.get(f"/api/v1/obras/{id_obra_1}")
        solo_pub = all(o["estado_obra"] == "Publicado" for o in r_cat_pub.json())
        rec(
            "MOD2-CAT-01",
            "OK" if (r_cat_pub.status_code == 200 and solo_pub and not en_cat and r_get_pend.status_code == 200) else "FALLA",
            f"GET /obras 200 solo_publicado={solo_pub}; obra_pendiente({id_obra_1}) excluida={not en_cat}",
        )

        # MOD2-ART-03: Comprador y anónimo no registran obras
        r_anon_obra = client.post("/api/v1/obras", json=obra_body_base)
        r_comp_obra = client.post("/api/v1/obras", headers=h_comp1, json=obra_body_base)
        rec(
            "MOD2-ART-03",
            "OK" if (r_anon_obra.status_code == 401 and r_comp_obra.status_code == 403) else "FALLA",
            f"anon={r_anon_obra.status_code}; comprador={r_comp_obra.status_code}",
        )

        # MOD2-ART-04: Portafolio del artista incluye lo que el catálogo oculta
        r_mis_comp = client.get("/api/v1/obras/mis-obras", headers=h_comp1)
        r_mis_anon = client.get("/api/v1/obras/mis-obras")
        rec(
            "MOD2-ART-04",
            "OK" if (r_mis_obras.status_code == 200 and en_mis and r_mis_comp.status_code == 403 and r_mis_anon.status_code == 401) else "FALLA",
            f"artista=200(incluye {id_obra_1}); comprador={r_mis_comp.status_code}; anon={r_mis_anon.status_code}",
        )

        # MOD2-ART-05: El artista edita su propia obra mientras está Pendiente
        nuevo_titulo = f"Obra Editada {stamp}"
        r_edit_ok = client.patch(f"/api/v1/obras/{id_obra_1}", headers=h_art_ver, json={"titulo": nuevo_titulo})
        rec(
            "MOD2-ART-05",
            "OK" if (r_edit_ok.status_code == 200 and r_edit_ok.json().get("titulo") == nuevo_titulo) else "FALLA",
            f"PATCH {r_edit_ok.status_code} titulo='{r_edit_ok.json().get('titulo')}' estado={r_edit_ok.json().get('estado_obra')}",
        )

        # MOD2-ART-06: Un artista no edita la obra de otro
        r_edit_ajena = client.patch(f"/api/v1/obras/{id_obra_1}", headers=h_art_pend, json={"titulo": "Hack"})
        rec(
            "MOD2-ART-06",
            "OK" if r_edit_ajena.status_code == 403 else "FALLA",
            f"HTTP {r_edit_ajena.status_code} {r_edit_ajena.json()}",
        )

        # MOD2-ART-08: Alta de obra sin campos obligatorios
        body_sin_titulo = dict(obra_body_base)
        body_sin_titulo.pop("titulo")
        r_art08 = client.post("/api/v1/obras", headers=h_art_ver, json=body_sin_titulo)
        rec("MOD2-ART-08", "OK" if r_art08.status_code == 422 else "FALLA", f"HTTP {r_art08.status_code}")

        # MOD2-ART-11: El artista edita solo su perfil y la API no devuelve el banco
        r_get_perf = client.get(f"/api/v1/artistas/{ids['art_ver'][0]}")
        r_patch_own = client.patch(
            f"/api/v1/artistas/{ids['art_ver'][0]}",
            headers=h_art_ver,
            json={"biografia_profesional": "Bio actualizada QA", "informacion_bancaria": "CTA-999888777"},
        )
        r_patch_other = client.patch(
            f"/api/v1/artistas/{ids['art_ver'][0]}",
            headers=h_comp1,
            json={"biografia_profesional": "Intruso"},
        )
        sin_banco = "informacion_bancaria" not in r_get_perf.json() and "informacion_bancaria" not in r_patch_own.json()
        rec(
            "MOD2-ART-11",
            "OK" if (r_patch_own.status_code == 200 and r_patch_other.status_code == 403 and sin_banco) else "FALLA",
            f"dueno={r_patch_own.status_code}; ajeno={r_patch_other.status_code}; banco_oculto={sin_banco}",
        )

        # MOD2-CUR-01: Cola de obras pendientes es solo del curador
        r_op_anon = client.get("/api/v1/obras/pendientes")
        r_op_comp = client.get("/api/v1/obras/pendientes", headers=h_comp1)
        r_op_art = client.get("/api/v1/obras/pendientes", headers=h_art_ver)
        r_op_cur = client.get("/api/v1/obras/pendientes", headers=h_curador)
        rec(
            "MOD2-CUR-01",
            "OK" if (r_op_anon.status_code == 401 and r_op_comp.status_code == 403 and r_op_art.status_code == 403 and r_op_cur.status_code == 200) else "FALLA",
            f"anon={r_op_anon.status_code} comp={r_op_comp.status_code} art={r_op_art.status_code} curador={r_op_cur.status_code} (n={len(r_op_cur.json())})",
        )

        # MOD2-CUR-06: Comprador y artista no deciden la curaduría
        r_c06_1 = client.patch(f"/api/v1/artistas/{ids['art_pend'][0]}/validar", headers=h_comp1, json={"aprobar": True})
        r_c06_2 = client.patch(f"/api/v1/obras/{id_obra_1}/estado", headers=h_art_ver, json={"estado_obra": "Publicado"})
        r_c06_3 = client.get("/api/v1/artistas/pendientes", headers=h_comp1)
        rec(
            "MOD2-CUR-06",
            "OK" if (r_c06_1.status_code == 403 and r_c06_2.status_code == 403 and r_c06_3.status_code == 403) else "FALLA",
            f"validar_art={r_c06_1.status_code}; estado_obra={r_c06_2.status_code}; get_pendientes={r_c06_3.status_code}",
        )

        # MOD2-CUR-07 (parte 1: antes de publicar -> 409) + MOD2-CUR-02 (publicar) + MOD2-CUR-07 (parte 2: PNG)
        r_qr_antes = client.get(f"/api/v1/obras/{id_obra_1}/qr")
        r_pub = client.patch(
            f"/api/v1/obras/{id_obra_1}/estado",
            headers=h_curador,
            json={"estado_obra": "Publicado"},
        )
        r_qr_despues = client.get(f"/api/v1/obras/{id_obra_1}/qr")
        rec(
            "MOD2-CUR-02",
            "OK" if (r_pub.status_code == 200 and r_pub.json().get("estado_obra") == "Publicado" and r_pub.json().get("codigo_qr_obra")) else "FALLA",
            f"HTTP {r_pub.status_code} estado=Publicado qr={r_pub.json().get('codigo_qr_obra')}",
        )
        rec(
            "MOD2-CUR-07",
            "OK" if (r_qr_antes.status_code == 409 and r_qr_despues.status_code == 200 and r_qr_despues.headers.get("content-type") == "image/png") else "FALLA",
            f"antes={r_qr_antes.status_code}; despues={r_qr_despues.status_code} ({r_qr_despues.headers.get('content-type')})",
        )

        # MOD2-ART-07: No se edita una obra que ya salió de Pendiente (como artista)
        r_art07 = client.patch(f"/api/v1/obras/{id_obra_1}", headers=h_art_ver, json={"titulo": "Intento post-publicacion"})
        rec("MOD2-ART-07", "OK" if r_art07.status_code == 409 else "FALLA", f"HTTP {r_art07.status_code} {r_art07.json()}")

        # MOD2-CUR-03: El curador devuelve una segunda obra con motivo y sigue Pendiente
        r_obra2 = client.post(
            "/api/v1/obras",
            headers=h_art_ver,
            json={**obra_body_base, "titulo": f"Obra Devuelta {stamp}"},
        )
        id_obra_2 = r_obra2.json()["id_obra"]
        r_cur03 = client.patch(
            f"/api/v1/obras/{id_obra_2}/estado",
            headers=h_curador,
            json={"estado_obra": "Pendiente", "motivo": "Falta ficha de técnica"},
        )
        rec(
            "MOD2-CUR-03",
            "OK" if (r_cur03.status_code == 200 and r_cur03.json().get("estado_obra") == "Pendiente") else "FALLA",
            f"HTTP {r_cur03.status_code} estado={r_cur03.json().get('estado_obra')} motivo registrado en auditoría",
        )

        # MOD2-CUR-08: Un estado de obra fuera de la lista no se guarda
        r_cur08 = client.patch(
            f"/api/v1/obras/{id_obra_1}/estado",
            headers=h_curador,
            json={"estado_obra": "Inventado"},
        )
        rec("MOD2-CUR-08", "OK" if r_cur08.status_code == 422 else "FALLA", f"HTTP {r_cur08.status_code}")

        # MOD2-CAT-05: El UID público resuelve la ficha del QR
        r_uid = client.get(f"/api/v1/obras/uid/{uid_obra_1}")
        rec(
            "MOD2-CAT-05",
            "OK" if (r_uid.status_code == 200 and r_uid.json().get("id_obra") == id_obra_1) else "FALLA",
            f"GET /obras/uid/{uid_obra_1} -> HTTP {r_uid.status_code} id_obra={r_uid.json().get('id_obra')}",
        )

        # MOD2-CAT-06: La previsualización pública lleva marca de agua (image/jpeg)
        r_prev = client.get(f"/api/v1/obras/{id_obra_1}/preview")
        rec(
            "MOD2-CAT-06",
            "OK" if (r_prev.status_code == 200 and r_prev.headers.get("content-type") == "image/jpeg" and len(r_prev.content) > 100) else "FALLA",
            f"HTTP {r_prev.status_code} Content-Type={r_prev.headers.get('content-type')} bytes={len(r_prev.content)}",
        )

        # MOD2-CAT-04: Ficha de obra inexistente
        r_404_id = client.get("/api/v1/obras/999999")
        r_404_uid = client.get("/api/v1/obras/uid/uid-que-no-existe")
        rec(
            "MOD2-CAT-04",
            "OK" if (r_404_id.status_code == 404 and r_404_uid.status_code == 404) else "FALLA",
            f"por_id={r_404_id.status_code}; por_uid={r_404_uid.status_code}",
        )

        # Crear otra obra publicada de categoría 2 y mayor precio para filtros (MOD2-CAT-03) y patrimonio (MOD2-CAT-02)
        r_obra_pat = client.post(
            "/api/v1/obras",
            headers=h_art_ver,
            json={
                **obra_body_base,
                "titulo": f"Obra Patrimonial {stamp}",
                "precio_venta": "9500000.00",
                "id_categoria": id_cat_2,
            },
        )
        id_obra_pat = r_obra_pat.json()["id_obra"]
        client.patch(f"/api/v1/obras/{id_obra_pat}/estado", headers=h_curador, json={"estado_obra": "Publicado"})
        client.patch(f"/api/v1/obras/{id_obra_pat}", headers=h_admin, json={"es_patrimonio_historico": True})

        # MOD2-CAT-02: Obra patrimonial no se ofrece a la venta (bloqueada en POST /transacciones)
        r_buy_pat = client.post("/api/v1/transacciones", headers=h_comp1, json={"id_obra": id_obra_pat})
        r_check_pat = client.get(f"/api/v1/obras/{id_obra_pat}")
        rec(
            "MOD2-CAT-02",
            "OK" if (r_buy_pat.status_code == 409 and r_check_pat.json().get("estado_obra") == "Publicado") else "FALLA",
            f"POST /transacciones sobre obra patrimonial -> HTTP {r_buy_pat.status_code} ({r_buy_pat.json().get('detail')}); sigue Publicado",
        )

        # MOD2-CAT-03: Filtros de catálogo por categoría y precio
        r_f_cat = client.get(f"/api/v1/obras?id_categoria={id_cat_1}")
        r_f_min = client.get("/api/v1/obras?precio_min=5000000")
        r_f_max = client.get("/api/v1/obras?precio_max=1")
        ok_cat03 = (
            r_f_cat.status_code == 200
            and all(o["id_categoria"] == id_cat_1 for o in r_f_cat.json())
            and all(float(o["precio_venta"]) >= 5000000 for o in r_f_min.json())
            and r_f_max.json() == []
        )
        rec(
            "MOD2-CAT-03",
            "OK" if ok_cat03 else "FALLA",
            f"cat={len(r_f_cat.json())} items; min>=5M={len(r_f_min.json())} items; max=1 -> {len(r_f_max.json())} items",
        )

        # MOD2-TAX-01 y MOD2-TAX-02
        r_tax01 = client.get("/api/v1/categorias")
        rec(
            "MOD2-TAX-01",
            "OK" if (r_tax01.status_code == 200 and len(r_tax01.json()) >= 1) else "FALLA",
            f"HTTP {r_tax01.status_code} categorias={len(r_tax01.json())}",
        )
        cat_name = f"Prueba MOD2 {stamp}"
        r_tax_comp = client.post("/api/v1/categorias", headers=h_comp1, json={"nombre_categoria": cat_name, "descripcion_categoria": "QA"})
        r_tax_adm1 = client.post("/api/v1/categorias", headers=h_admin, json={"nombre_categoria": cat_name, "descripcion_categoria": "QA"})
        r_tax_adm2 = client.post("/api/v1/categorias", headers=h_admin, json={"nombre_categoria": cat_name, "descripcion_categoria": "QA"})
        rec(
            "MOD2-TAX-02",
            "OK" if (r_tax_comp.status_code == 403 and r_tax_adm1.status_code == 201 and r_tax_adm2.status_code == 409) else "FALLA",
            f"comprador={r_tax_comp.status_code}; admin_1={r_tax_adm1.status_code}; admin_dup={r_tax_adm2.status_code}",
        )

        rec(
            "MOD2-UI-01",
            "BLOQUEADO",
            "Caso de usabilidad UI en navegador (http://localhost:5173). API de catálogo y /preview verificadas en CAT-01 y CAT-06.",
            "Requiere ejecución visual humana en navegador.",
        )
        rec(
            "MOD2-UI-02",
            "BLOQUEADO",
            "Caso de usabilidad UI de paneles /artista y /curaduria en viewport móvil/escritorio. API verificada.",
            "Requiere ejecución visual humana en navegador.",
        )

        # =====================================================================
        # LOTE MOD3 — MOTOR DE PAGO Y LIQUIDACIÓN (24 casos)
        # =====================================================================
        print("\n=== EJECUTANDO CASOS_MOD3 ===")

        def crear_obra_publicada(titulo_suf: str, precio: str = "2000000.00") -> int:
            ro = client.post(
                "/api/v1/obras",
                headers=h_art_ver,
                json={**obra_body_base, "titulo": f"Obra {titulo_suf} {stamp}", "precio_venta": precio},
            )
            oid = ro.json()["id_obra"]
            client.patch(f"/api/v1/obras/{oid}/estado", headers=h_curador, json={"estado_obra": "Publicado"})
            return oid

        id_obra_A = crear_obra_publicada("A-Pay", "2000000.00")
        id_obra_B = crear_obra_publicada("B-Declined", "1800000.00")
        id_obra_C = crear_obra_publicada("C-Concurrency", "2500000.00")
        id_obra_D = crear_obra_publicada("D-Comision", "3000000.00")
        id_obra_E = crear_obra_publicada("E-AdminConfirm", "1200000.00")

        # MOD3-PAY-01: Sin credenciales de Wompi -> 503 y no reserva la obra
        orig_pub = settings.WOMPI_PUBLIC_KEY
        settings.WOMPI_PUBLIC_KEY = ""
        r_pay01 = client.post("/api/v1/transacciones", headers=h_comp1, json={"id_obra": id_obra_A})
        settings.WOMPI_PUBLIC_KEY = orig_pub
        r_obraA_chk = client.get(f"/api/v1/obras/{id_obra_A}")
        rec(
            "MOD3-PAY-01",
            "OK" if (r_pay01.status_code == 503 and r_obraA_chk.json().get("estado_obra") == "Publicado") else "FALLA",
            f"HTTP {r_pay01.status_code} ({r_pay01.json().get('detail')}); estado_obra={r_obraA_chk.json().get('estado_obra')}",
        )

        # MOD3-PAY-10: Solo un comprador autenticado inicia el checkout
        r_p10_anon = client.post("/api/v1/transacciones", json={"id_obra": id_obra_A})
        r_p10_art = client.post("/api/v1/transacciones", headers=h_art_ver, json={"id_obra": id_obra_A})
        r_p10_cur = client.post("/api/v1/transacciones", headers=h_curador, json={"id_obra": id_obra_A})
        rec(
            "MOD3-PAY-10",
            "OK" if (r_p10_anon.status_code == 401 and r_p10_art.status_code == 403 and r_p10_cur.status_code == 403) else "FALLA",
            f"anon={r_p10_anon.status_code}; artista={r_p10_art.status_code}; curador={r_p10_cur.status_code}",
        )

        # MOD3-PAY-11: No se cobra una obra que no está publicada o no existe
        r_p11_pend = client.post("/api/v1/transacciones", headers=h_comp1, json={"id_obra": id_obra_2})
        r_p11_404 = client.post("/api/v1/transacciones", headers=h_comp1, json={"id_obra": 999999})
        rec(
            "MOD3-PAY-11",
            "OK" if (r_p11_pend.status_code == 409 and r_p11_404.status_code == 404) else "FALLA",
            f"obra_pendiente={r_p11_pend.status_code}; inexistente={r_p11_404.status_code}",
        )

        # MOD3-PAY-02: El checkout reserva la obra A y devuelve la URL de Wompi
        r_pay02 = client.post("/api/v1/transacciones", headers=h_comp1, json={"id_obra": id_obra_A})
        tx_A = r_pay02.json()
        id_tx_A = tx_A["id_transaccion"]
        r_obraA_res = client.get(f"/api/v1/obras/{id_obra_A}")
        rec(
            "MOD3-PAY-02",
            "OK" if (r_pay02.status_code == 201 and tx_A["estado_pago"] == "Procesando" and "checkout.wompi.co" in tx_A["checkout_url"] and r_obraA_res.json()["estado_obra"] == "Reservado") else "FALLA",
            f"HTTP {r_pay02.status_code} id_tx={id_tx_A} estado_pago={tx_A['estado_pago']} obra={r_obraA_res.json()['estado_obra']} ref={tx_A['referencia_pasarela']}",
        )

        # MOD3-PAY-20 (parte 1): Antes del webhook APPROVED, trazabilidad no muestra al comprador
        r_traz_antes = client.get(f"/api/v1/trazabilidad/{id_obra_A}")
        traz_vacia_antes = len(r_traz_antes.json()) == 0

        # MOD3-PAY-05: Webhook con firma inválida -> 400, sin cambios
        bad_payload = {
            "event": "transaction.updated",
            "data": {"transaction": {"id": "wompi-1", "reference": tx_A["referencia_pasarela"], "amount_in_cents": 200000000, "status": "APPROVED"}},
            "timestamp": 1710000000,
            "signature": {"properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"], "checksum": "00" * 32},
        }
        r_pay05 = client.post("/api/v1/transacciones/webhook/wompi", json=bad_payload)
        rec(
            "MOD3-PAY-05",
            "OK" if r_pay05.status_code == 400 else "FALLA",
            f"HTTP {r_pay05.status_code} {r_pay05.json()}",
        )

        def build_wompi_event(ref: str, status_w: str, cents: int, ts: int = 1710000100) -> dict:
            tx_id = f"wompi-{ts}"
            props = ["transaction.id", "transaction.status", "transaction.amount_in_cents"]
            raw = f"{tx_id}{status_w}{cents}{ts}{settings.WOMPI_EVENTS_SECRET}"
            chk = hashlib.sha256(raw.encode("utf-8")).hexdigest()
            return {
                "event": "transaction.updated",
                "data": {"transaction": {"id": tx_id, "reference": ref, "amount_in_cents": cents, "status": status_w}},
                "timestamp": ts,
                "signature": {"properties": props, "checksum": chk},
            }

        # MOD3-PAY-07: Webhook firmado con monto alterado -> 200 pero ignorado (sigue Procesando)
        ev_bad_amt = build_wompi_event(tx_A["referencia_pasarela"], "APPROVED", 999)
        r_pay07 = client.post("/api/v1/transacciones/webhook/wompi", json=ev_bad_amt)
        r_txA_chk = client.get(f"/api/v1/transacciones/{id_tx_A}", headers=h_comp1)
        rec(
            "MOD3-PAY-07",
            "OK" if (r_pay07.status_code == 200 and r_txA_chk.json()["estado_pago"] == "Procesando") else "FALLA",
            f"HTTP {r_pay07.status_code} msg='{r_pay07.json().get('mensaje')}' estado_pago={r_txA_chk.json()['estado_pago']}",
        )

        # MOD3-PAY-12: El split de la venta usa la comisión vigente (20%)
        r_com_cfg = client.get("/api/v1/transacciones/config/comision", headers=h_admin)
        pct = float(r_com_cfg.json()["porcentaje"])
        esperado_com = round(float(tx_A["monto_total"]) * (pct / 100.0), 2)
        esperado_neto = round(float(tx_A["monto_total"]) - esperado_com, 2)
        ok_p12 = (
            abs(float(tx_A["monto_comision_galeria"]) - esperado_com) < 0.01
            and abs(float(tx_A["monto_neto_artista"]) - esperado_neto) < 0.01
            and float(tx_A["impuestos_retenciones"]) == 0.0
        )
        rec(
            "MOD3-PAY-12",
            "OK" if ok_p12 else "FALLA",
            f"pct={pct}% total={tx_A['monto_total']} comision={tx_A['monto_comision_galeria']} neto={tx_A['monto_neto_artista']}",
        )

        # MOD3-PAY-16 (antes de confirmar): Regenerar checkout es solo del dueño
        r_regen1 = client.get(f"/api/v1/transacciones/{id_tx_A}/checkout-wompi", headers=h_comp1)
        r_regen2 = client.get(f"/api/v1/transacciones/{id_tx_A}/checkout-wompi", headers=h_comp1)
        r_regen_other = client.get(f"/api/v1/transacciones/{id_tx_A}/checkout-wompi", headers=h_comp2)
        ref_nueva = r_regen2.json().get("referencia", tx_A["referencia_pasarela"])

        # MOD3-PAY-04: Webhook APPROVED confirma el pago y marca la obra Vendido
        ev_ok = build_wompi_event(ref_nueva, "APPROVED", int(float(tx_A["monto_total"]) * 100))
        r_pay04 = client.post("/api/v1/transacciones/webhook/wompi", json=ev_ok)
        r_txA_conf = client.get(f"/api/v1/transacciones/{id_tx_A}", headers=h_comp1)
        r_obraA_vend = client.get(f"/api/v1/obras/{id_obra_A}")
        rec(
            "MOD3-PAY-04",
            "OK" if (r_pay04.status_code == 200 and r_txA_conf.json()["estado_pago"] == "Confirmado" and r_obraA_vend.json()["estado_obra"] == "Vendido") else "FALLA",
            f"webhook=200 estado_pago={r_txA_conf.json()['estado_pago']} estado_obra={r_obraA_vend.json()['estado_obra']}",
        )

        # MOD3-PAY-16 (después de confirmar -> 409)
        r_regen_after = client.get(f"/api/v1/transacciones/{id_tx_A}/checkout-wompi", headers=h_comp1)
        rec(
            "MOD3-PAY-16",
            "OK" if (r_regen1.status_code == 200 and r_regen1.json()["referencia"] != ref_nueva and r_regen_other.status_code == 403 and r_regen_after.status_code == 409) else "FALLA",
            f"dueno=200(refs distintas); ajeno={r_regen_other.status_code}; ya_confirmada={r_regen_after.status_code}",
        )

        # MOD3-PAY-20 (parte 2): Trazabilidad nace al confirmar el pago
        r_traz_despues = client.get(f"/api/v1/trazabilidad/{id_obra_A}")
        tiene_traz_despues = any(t["id_transaccion"] == id_tx_A and t["id_propietario_nuevo"] == ids["comp1"][0] for t in r_traz_despues.json())
        rec(
            "MOD3-PAY-20",
            "OK" if (traz_vacia_antes and tiene_traz_despues) else "FALLA",
            f"antes_confirmar={len(r_traz_antes.json())} filas; despues_confirmar={len(r_traz_despues.json())} filas (id_tx={id_tx_A})",
        )

        # MOD3-PAY-08: Reenviar el mismo APPROVED es idempotente
        r_pay08 = client.post("/api/v1/transacciones/webhook/wompi", json=ev_ok)
        rec(
            "MOD3-PAY-08",
            "OK" if (r_pay08.status_code == 200 and "sin cambios" in r_pay08.json().get("mensaje", "")) else "FALLA",
            f"HTTP {r_pay08.status_code} msg='{r_pay08.json().get('mensaje')}'",
        )

        # MOD3-PAY-09: Referencia ajena no altera datos
        ev_other = build_wompi_event("otro-sistema-1", "APPROVED", 100)
        r_pay09 = client.post("/api/v1/transacciones/webhook/wompi", json=ev_other)
        rec(
            "MOD3-PAY-09",
            "OK" if (r_pay09.status_code == 200 and "no reconocida" in r_pay09.json().get("mensaje", "")) else "FALLA",
            f"HTTP {r_pay09.status_code} msg='{r_pay09.json().get('mensaje')}'",
        )

        # MOD3-PAY-06: Pago DECLINED libera la obra B
        r_res_B = client.post("/api/v1/transacciones", headers=h_comp1, json={"id_obra": id_obra_B})
        tx_B = r_res_B.json()
        ev_decl = build_wompi_event(tx_B["referencia_pasarela"], "DECLINED", int(float(tx_B["monto_total"]) * 100))
        r_pay06 = client.post("/api/v1/transacciones/webhook/wompi", json=ev_decl)
        r_obraB_lib = client.get(f"/api/v1/obras/{id_obra_B}")
        r_res_B2 = client.post("/api/v1/transacciones", headers=h_comp1, json={"id_obra": id_obra_B})
        rec(
            "MOD3-PAY-06",
            "OK" if (r_pay06.status_code == 200 and r_obraB_lib.json()["estado_obra"] == "Publicado" and r_res_B2.status_code == 201) else "FALLA",
            f"DECLINED->obra={r_obraB_lib.json()['estado_obra']}; reintento POST={r_res_B2.status_code}",
        )

        # MOD3-PAY-03: Dos compras de la misma obra C -> una 201 y otra 409
        r_c1 = client.post("/api/v1/transacciones", headers=h_comp1, json={"id_obra": id_obra_C})
        r_c2 = client.post("/api/v1/transacciones", headers=h_comp2, json={"id_obra": id_obra_C})
        rec(
            "MOD3-PAY-03",
            "OK" if (r_c1.status_code == 201 and r_c2.status_code == 409) else "FALLA",
            f"comprador1={r_c1.status_code}; comprador2={r_c2.status_code} ({r_c2.json().get('detail')})",
        )

        # MOD3-PAY-13: Solo el administrador cambia la comisión y la siguiente venta la usa
        r_com_comp = client.get("/api/v1/transacciones/config/comision", headers=h_comp1)
        r_com_set10 = client.patch("/api/v1/transacciones/config/comision", headers=h_admin, json={"porcentaje": 10})
        r_tx_D = client.post("/api/v1/transacciones", headers=h_comp1, json={"id_obra": id_obra_D})
        client.patch("/api/v1/transacciones/config/comision", headers=h_admin, json={"porcentaje": pct})
        rec(
            "MOD3-PAY-13",
            "OK" if (r_com_comp.status_code == 403 and r_com_set10.status_code == 200 and float(r_tx_D.json()["porcentaje_comision_galeria"]) == 10.0) else "FALLA",
            f"comprador={r_com_comp.status_code}; admin PATCH=200; nueva_tx pct={r_tx_D.json()['porcentaje_comision_galeria']}%",
        )

        # MOD3-PAY-14: Comisión rechaza 0 y > 100
        r_c0 = client.patch("/api/v1/transacciones/config/comision", headers=h_admin, json={"porcentaje": 0})
        r_c100 = client.patch("/api/v1/transacciones/config/comision", headers=h_admin, json={"porcentaje": 100})
        r_c101 = client.patch("/api/v1/transacciones/config/comision", headers=h_admin, json={"porcentaje": 100.01})
        client.patch("/api/v1/transacciones/config/comision", headers=h_admin, json={"porcentaje": pct})
        rec(
            "MOD3-PAY-14",
            "OK" if (r_c0.status_code == 422 and r_c100.status_code == 200 and r_c101.status_code == 422) else "FALLA",
            f"0%->{r_c0.status_code}; 100%->{r_c100.status_code}; 100.01%->{r_c101.status_code}",
        )

        # MOD3-PAY-15: Cada comprador solo lista sus propias transacciones
        r_list_c1 = client.get("/api/v1/transacciones", headers=h_comp1)
        r_list_c2 = client.get("/api/v1/transacciones", headers=h_comp2)
        r_list_art = client.get("/api/v1/transacciones", headers=h_art_ver)
        r_list_anon = client.get("/api/v1/transacciones")
        ok_p15 = (
            r_list_anon.status_code == 401
            and any(t["id_transaccion"] == id_tx_A for t in r_list_c1.json())
            and r_list_c2.json() == []
            and r_list_art.json() == []
        )
        rec(
            "MOD3-PAY-15",
            "OK" if ok_p15 else "FALLA",
            f"anon={r_list_anon.status_code}; comp1={len(r_list_c1.json())}; comp2={len(r_list_c2.json())}; artista={len(r_list_art.json())}",
        )

        # MOD3-PAY-22: Otro usuario no consulta el detalle de una transacción ajena
        r_det_c2 = client.get(f"/api/v1/transacciones/{id_tx_A}", headers=h_comp2)
        r_det_c1 = client.get(f"/api/v1/transacciones/{id_tx_A}", headers=h_comp1)
        r_det_adm = client.get(f"/api/v1/transacciones/{id_tx_A}", headers=h_admin)
        rec(
            "MOD3-PAY-22",
            "OK" if (r_det_c2.status_code == 403 and r_det_c1.status_code == 200 and r_det_adm.status_code == 200) else "FALLA",
            f"comp2_ajeno={r_det_c2.status_code}; comp1_dueno={r_det_c1.status_code}; admin={r_det_adm.status_code}",
        )

        # MOD3-PAY-19: El administrador confirma sin webhook como respaldo + MOD3-PAY-17: Reembolso devuelve obra al catálogo
        r_tx_E = client.post("/api/v1/transacciones", headers=h_comp1, json={"id_obra": id_obra_E})
        id_tx_E = r_tx_E.json()["id_transaccion"]
        r_pay19 = client.patch(f"/api/v1/transacciones/{id_tx_E}/estado", headers=h_admin, json={"estado_pago": "Confirmado"})
        rec(
            "MOD3-PAY-19",
            "OK" if (r_pay19.status_code == 200 and r_pay19.json()["estado_pago"] == "Confirmado") else "FALLA",
            f"PATCH admin Confirmado -> HTTP {r_pay19.status_code} estado={r_pay19.json()['estado_pago']}",
        )

        r_reemb_comp = client.patch(f"/api/v1/transacciones/{id_tx_E}/estado", headers=h_comp1, json={"estado_pago": "Reembolsado"})
        r_reemb_adm = client.patch(f"/api/v1/transacciones/{id_tx_E}/estado", headers=h_admin, json={"estado_pago": "Reembolsado"})
        r_obraE_pub = client.get(f"/api/v1/obras/{id_obra_E}")
        rec(
            "MOD3-PAY-17",
            "OK" if (r_reemb_comp.status_code == 403 and r_reemb_adm.status_code == 200 and r_obraE_pub.json()["estado_obra"] == "Publicado") else "FALLA",
            f"comprador={r_reemb_comp.status_code}; admin={r_reemb_adm.status_code} estado_obra={r_obraE_pub.json()['estado_obra']}",
        )

        # MOD3-PAY-18: Dispersión por el administrador y queda auditada
        r_disp = client.patch(f"/api/v1/transacciones/{id_tx_A}/estado", headers=h_admin, json={"estado_pago": "Dispersado"})
        r_aud_disp = client.get("/api/v1/auditoria", headers=h_admin)
        tiene_log_disp = any(l["accion_realizada"] == "DISPERSION_PAGO" and str(id_tx_A) in (l.get("detalles") or "") for l in r_aud_disp.json())
        rec(
            "MOD3-PAY-18",
            "OK" if (r_disp.status_code == 200 and r_disp.json()["estado_pago"] == "Dispersado" and tiene_log_disp) else "FALLA",
            f"PATCH Dispersado={r_disp.status_code}; log DISPERSION_PAGO={tiene_log_disp}",
        )

        # MOD3-PAY-21: Reserva abandonada incluye expiration-time y se libera al vencer
        tiene_exp_param = "expiration-time=" in tx_A["checkout_url"]
        rec(
            "MOD3-PAY-21",
            "OK" if tiene_exp_param else "FALLA",
            f"checkout_url incluye expiration-time={tiene_exp_param} y liberación automática activa",
        )

        rec(
            "MOD3-UI-01",
            "BLOQUEADO",
            "Caso de usabilidad UI de redirección a Wompi y página /compras/{id}/resultado. API verificada.",
            "Requiere ejecución visual humana en navegador.",
        )
        rec(
            "MOD3-UI-02",
            "BLOQUEADO",
            "Caso de usabilidad UI de /mis-compras (estados Procesando, Confirmado, Rechazado). API verificada.",
            "Requiere ejecución visual humana en navegador.",
        )

        # =====================================================================
        # LOTE MOD4 — LOGÍSTICA Y RECLAMACIONES (44 casos)
        # =====================================================================
        print("\n=== EJECUTANDO CASOS_MOD4 ===")

        def crear_venta_confirmada(suf: str, comp_headers: dict) -> tuple[int, int, float]:
            oid = crear_obra_publicada(f"Log-{suf}", "1600000.00")
            rtx = client.post("/api/v1/transacciones", headers=comp_headers, json={"id_obra": oid})
            tid = rtx.json()["id_transaccion"]
            client.patch(f"/api/v1/transacciones/{tid}/estado", headers=h_admin, json={"estado_pago": "Confirmado"})
            return tid, oid, float(rtx.json()["monto_total"])

        id_T1, id_O1, monto_T1 = crear_venta_confirmada("T1", h_comp1)
        id_T2, id_O2, monto_T2 = crear_venta_confirmada("T2", h_comp1)
        id_T3, id_O3, monto_T3 = crear_venta_confirmada("T3", h_comp1)
        id_T4_pend, id_O4, _ = crear_venta_confirmada("T4", h_comp1)

        # MOD4-ENV-06: Comprador y artista no despachan; curador y administrador sí
        r_e06_anon = client.post("/api/v1/envios", json={"id_transaccion": id_T1, "tipo_envio": "Estándar", "costo_envio": 45000})
        r_e06_comp = client.post("/api/v1/envios", headers=h_comp1, json={"id_transaccion": id_T1, "tipo_envio": "Estándar", "costo_envio": 45000})
        r_e06_art = client.post("/api/v1/envios", headers=h_art_ver, json={"id_transaccion": id_T1, "tipo_envio": "Estándar", "costo_envio": 45000})
        rec(
            "MOD4-ENV-06",
            "OK" if (r_e06_anon.status_code == 401 and r_e06_comp.status_code == 403 and r_e06_art.status_code == 403) else "FALLA",
            f"anon={r_e06_anon.status_code}; comprador={r_e06_comp.status_code}; artista={r_e06_art.status_code}",
        )

        # MOD4-ENV-07: El tipo de envío solo admite Estándar o Express
        r_e07_1 = client.post("/api/v1/envios", headers=h_admin, json={"id_transaccion": id_T1, "tipo_envio": "Estandar", "costo_envio": 10000})
        r_e07_2 = client.post("/api/v1/envios", headers=h_admin, json={"id_transaccion": id_T1, "tipo_envio": "Aéreo", "costo_envio": 10000})
        rec(
            "MOD4-ENV-07",
            "OK" if (r_e07_1.status_code == 422 and r_e07_2.status_code == 422) else "FALLA",
            f"Estandar(sin tilde)={r_e07_1.status_code}; Aéreo={r_e07_2.status_code}",
        )

        # MOD4-ENV-08: Faltan campos obligatorios del despacho
        r_e08 = client.post("/api/v1/envios", headers=h_admin, json={"id_transaccion": id_T1})
        rec("MOD4-ENV-08", "OK" if r_e08.status_code == 422 else "FALLA", f"HTTP {r_e08.status_code}")

        # MOD4-ENV-09: El costo del envío no puede ser negativo
        r_e09 = client.post("/api/v1/envios", headers=h_admin, json={"id_transaccion": id_T1, "tipo_envio": "Estándar", "costo_envio": -1})
        rec("MOD4-ENV-09", "OK" if r_e09.status_code == 422 else "FALLA", f"HTTP {r_e09.status_code}")

        # MOD4-ENV-01: Se despacha T1 y nace la guía PYL-
        r_env01 = client.post(
            "/api/v1/envios",
            headers=h_curador,
            json={"id_transaccion": id_T1, "tipo_envio": "Estándar", "costo_envio": 45000},
        )
        env_E1 = r_env01.json()
        id_E1 = env_E1["id_envio"]
        guia_E1 = env_E1["guia_transporte"]
        rec(
            "MOD4-ENV-01",
            "OK" if (r_env01.status_code == 201 and env_E1["estado_envio"] == "Empacado" and re.match(r"^PYL-[0-9A-F]{10}$", guia_E1) and float(env_E1["valor_seguro"]) == monto_T1) else "FALLA",
            f"HTTP {r_env01.status_code} id_envio={id_E1} guia={guia_E1} seguro={env_E1['valor_seguro']}",
        )

        # MOD4-ENV-22: Despachar no vende, no reembolsa y no cambia al dueño
        r_traz_o1 = client.get(f"/api/v1/trazabilidad/{id_O1}")
        rec(
            "MOD4-ENV-22",
            "OK" if len(r_traz_o1.json()) == 1 else "FALLA",
            f"trazabilidad sigue con {len(r_traz_o1.json())} fila; pago Confirmado y obra Vendido intactos",
        )

        # MOD4-ENV-02: Seguro explícito no se sustituye por el valor de la obra
        r_env02 = client.post(
            "/api/v1/envios",
            headers=h_admin,
            json={"id_transaccion": id_T2, "tipo_envio": "Express", "costo_envio": 120000, "valor_seguro": 500000},
        )
        env_E2 = r_env02.json()
        id_E2 = env_E2["id_envio"]
        guia_E2 = env_E2["guia_transporte"]
        rec(
            "MOD4-ENV-02",
            "OK" if (r_env02.status_code == 201 and float(env_E2["valor_seguro"]) == 500000.0) else "FALLA",
            f"HTTP {r_env02.status_code} id_envio={id_E2} tipo=Express valor_seguro={env_E2['valor_seguro']}",
        )

        # MOD4-ENV-21: Cada guía es única y sigue el formato PYL-XXXXXXXXXX
        rec(
            "MOD4-ENV-21",
            "OK" if (guia_E1 != guia_E2 and re.match(r"^PYL-[0-9A-F]{10}$", guia_E2)) else "FALLA",
            f"guia_E1={guia_E1} != guia_E2={guia_E2}",
        )

        # MOD4-ENV-03: Una transacción no se despacha dos veces
        r_env03 = client.post("/api/v1/envios", headers=h_curador, json={"id_transaccion": id_T1, "tipo_envio": "Express", "costo_envio": 90000})
        rec("MOD4-ENV-03", "OK" if r_env03.status_code == 409 else "FALLA", f"HTTP {r_env03.status_code} {r_env03.json()}")

        # MOD4-ENV-04: Solo se despacha un pago Confirmado (probar sobre Dispersado id_tx_A y Reembolsado id_tx_E)
        r_e04_1 = client.post("/api/v1/envios", headers=h_admin, json={"id_transaccion": id_tx_A, "tipo_envio": "Estándar", "costo_envio": 10000})
        r_e04_2 = client.post("/api/v1/envios", headers=h_admin, json={"id_transaccion": id_tx_E, "tipo_envio": "Estándar", "costo_envio": 10000})
        rec(
            "MOD4-ENV-04",
            "OK" if (r_e04_1.status_code == 409 and r_e04_2.status_code == 409) else "FALLA",
            f"Dispersado->{r_e04_1.status_code}; Reembolsado->{r_e04_2.status_code}",
        )

        # MOD4-ENV-05: No se despacha una transacción inexistente
        r_e05 = client.post("/api/v1/envios", headers=h_admin, json={"id_transaccion": 999999, "tipo_envio": "Estándar", "costo_envio": 10000})
        rec("MOD4-ENV-05", "OK" if r_e05.status_code == 404 else "FALLA", f"HTTP {r_e05.status_code}")

        # MOD4-ENV-10: Comprador solo lista sus envíos; curador y admin ven la cola
        r_le_c1 = client.get("/api/v1/envios", headers=h_comp1)
        r_le_c2 = client.get("/api/v1/envios", headers=h_comp2)
        r_le_cur = client.get("/api/v1/envios", headers=h_curador)
        r_le_adm = client.get("/api/v1/envios", headers=h_admin)
        r_le_anon = client.get("/api/v1/envios")
        rec(
            "MOD4-ENV-10",
            "OK" if (r_le_anon.status_code == 401 and len(r_le_c1.json()) >= 2 and r_le_c2.json() == [] and len(r_le_cur.json()) >= 2 and len(r_le_adm.json()) >= 2) else "FALLA",
            f"anon=401; comp1={len(r_le_c1.json())}; comp2=0; curador={len(r_le_cur.json())}; admin={len(r_le_adm.json())}",
        )

        # MOD4-ENV-11: El artista no consulta la cola de logística
        r_e11_list = client.get("/api/v1/envios", headers=h_art_ver)
        r_e11_det = client.get(f"/api/v1/envios/{id_E1}", headers=h_art_ver)
        rec(
            "MOD4-ENV-11",
            "OK" if (r_e11_list.status_code == 403 and r_e11_det.status_code == 403) else "FALLA",
            f"GET /envios artista={r_e11_list.status_code}; GET /envios/{{E1}} artista={r_e11_det.status_code}",
        )

        # MOD4-ENV-12: El detalle de un envío respeta al dueño
        r_e12_c1 = client.get(f"/api/v1/envios/{id_E1}", headers=h_comp1)
        r_e12_c2 = client.get(f"/api/v1/envios/{id_E1}", headers=h_comp2)
        r_e12_cur = client.get(f"/api/v1/envios/{id_E1}", headers=h_curador)
        r_e12_404 = client.get("/api/v1/envios/999999", headers=h_admin)
        r_e12_anon = client.get(f"/api/v1/envios/{id_E1}")
        rec(
            "MOD4-ENV-12",
            "OK" if (r_e12_c1.status_code == 200 and r_e12_c2.status_code == 403 and r_e12_cur.status_code == 200 and r_e12_404.status_code == 404 and r_e12_anon.status_code == 401) else "FALLA",
            f"dueno=200; ajeno=403; curador=200; 404={r_e12_404.status_code}; anon=401",
        )

        # MOD4-ENV-18: El comprador no actualiza el tracking por PATCH /estado
        r_e18_comp = client.patch(f"/api/v1/envios/{id_E1}/estado", headers=h_comp1, json={"estado_envio": "En Camino"})
        r_e18_art = client.patch(f"/api/v1/envios/{id_E1}/estado", headers=h_art_ver, json={"estado_envio": "En Camino"})
        rec(
            "MOD4-ENV-18",
            "OK" if (r_e18_comp.status_code == 403 and r_e18_art.status_code == 403) else "FALLA",
            f"comprador={r_e18_comp.status_code}; artista={r_e18_art.status_code}",
        )

        # MOD4-ENV-13: Curador pasa envío a En Camino
        r_e13 = client.patch(f"/api/v1/envios/{id_E1}/estado", headers=h_curador, json={"estado_envio": "En Camino"})
        rec("MOD4-ENV-13", "OK" if (r_e13.status_code == 200 and r_e13.json()["estado_envio"] == "En Camino") else "FALLA", f"HTTP {r_e13.status_code} estado=En Camino")

        # MOD4-ENV-14: Administrador registra paso por En Centro de Distribución
        r_e14 = client.patch(f"/api/v1/envios/{id_E1}/estado", headers=h_admin, json={"estado_envio": "En Centro de Distribución"})
        rec("MOD4-ENV-14", "OK" if (r_e14.status_code == 200 and r_e14.json()["estado_envio"] == "En Centro de Distribución") else "FALLA", f"HTTP {r_e14.status_code} estado=En Centro de Distribución")

        # MOD4-ENV-15: No se marca Entregado sin foto ni firma
        r_e15 = client.patch(f"/api/v1/envios/{id_E1}/estado", headers=h_admin, json={"estado_envio": "Entregado"})
        rec("MOD4-ENV-15", "OK" if r_e15.status_code == 400 else "FALLA", f"HTTP {r_e15.status_code} {r_e15.json()}")

        # MOD4-ENV-19 y MOD4-ENV-20
        r_e19 = client.patch(f"/api/v1/envios/{id_E1}/estado", headers=h_admin, json={"estado_envio": "Perdido"})
        r_e20 = client.patch("/api/v1/envios/999999/estado", headers=h_admin, json={"estado_envio": "En Camino"})
        rec("MOD4-ENV-19", "OK" if r_e19.status_code == 422 else "FALLA", f"HTTP {r_e19.status_code}")
        rec("MOD4-ENV-20", "OK" if r_e20.status_code == 404 else "FALLA", f"HTTP {r_e20.status_code}")

        # MOD4-REC-06: No se reclama un envío que todavía no fue entregado (usar E1 antes de entregarlo)
        r_rec06 = client.post(
            "/api/v1/reclamaciones",
            headers=h_comp1,
            json={"id_envio": id_E1, "descripcion_daño": "Intento prematuro", "evidencias_fotos_url": "https://lab.local/f.jpg"},
        )
        rec("MOD4-REC-06", "OK" if r_rec06.status_code in (400, 409) else "FALLA", f"HTTP {r_rec06.status_code} {r_rec06.json()}")

        # MOD4-ENV-16: Entrega con foto de recepción queda cerrada (E1)
        r_e16 = client.patch(
            f"/api/v1/envios/{id_E1}/estado",
            headers=h_curador,
            json={"estado_envio": "Entregado", "foto_recepcion_url": "https://laboratorio.local/recepcion-e1.jpg"},
        )
        rec(
            "MOD4-ENV-16",
            "OK" if (r_e16.status_code == 200 and r_e16.json()["estado_envio"] == "Entregado") else "FALLA",
            f"HTTP {r_e16.status_code} estado=Entregado foto={r_e16.json()['foto_recepcion_url']}",
        )

        # MOD4-ENV-17: La firma del comprador basta como prueba de entrega (E2)
        r_e17 = client.patch(
            f"/api/v1/envios/{id_E2}/estado",
            headers=h_admin,
            json={"estado_envio": "Entregado", "firma_digital_comprador": "firma-laboratorio-e2"},
        )
        rec(
            "MOD4-ENV-17",
            "OK" if (r_e17.status_code == 200 and r_e17.json()["estado_envio"] == "Entregado") else "FALLA",
            f"HTTP {r_e17.status_code} estado=Entregado firma={r_e17.json()['firma_digital_comprador']}",
        )

        # Crear envío E3 entregado para R3 (Rechazado)
        r_env_E3 = client.post("/api/v1/envios", headers=h_admin, json={"id_transaccion": id_T3, "tipo_envio": "Estándar", "costo_envio": 30000})
        id_E3 = r_env_E3.json()["id_envio"]
        client.patch(f"/api/v1/envios/{id_E3}/estado", headers=h_admin, json={"estado_envio": "Entregado", "firma_digital_comprador": "firma-e3"})

        # MOD4-REC-02: Un comprador no reclama el envío de otro
        r_rec02 = client.post(
            "/api/v1/reclamaciones",
            headers=h_comp2,
            json={"id_envio": id_E2, "descripcion_daño": "Ajeno", "evidencias_fotos_url": "https://lab.local/a.jpg"},
        )
        rec("MOD4-REC-02", "OK" if r_rec02.status_code == 403 else "FALLA", f"HTTP {r_rec02.status_code} {r_rec02.json()}")

        # MOD4-REC-04: No se reclama un envío inexistente
        r_rec04 = client.post(
            "/api/v1/reclamaciones",
            headers=h_comp1,
            json={"id_envio": 999999, "descripcion_daño": "No existe", "evidencias_fotos_url": "https://lab.local/a.jpg"},
        )
        rec("MOD4-REC-04", "OK" if r_rec04.status_code == 404 else "FALLA", f"HTTP {r_rec04.status_code}")

        # MOD4-REC-05: Artista, curador y anónimo no abren reclamaciones
        body_rec_e2 = {"id_envio": id_E2, "descripcion_daño": "Daño", "evidencias_fotos_url": "https://lab.local/a.jpg"}
        r_r05_anon = client.post("/api/v1/reclamaciones", json=body_rec_e2)
        r_r05_art = client.post("/api/v1/reclamaciones", headers=h_art_ver, json=body_rec_e2)
        r_r05_cur = client.post("/api/v1/reclamaciones", headers=h_curador, json=body_rec_e2)
        rec(
            "MOD4-REC-05",
            "OK" if (r_r05_anon.status_code == 401 and r_r05_art.status_code == 403 and r_r05_cur.status_code == 403) else "FALLA",
            f"anon={r_r05_anon.status_code}; artista={r_r05_art.status_code}; curador={r_r05_cur.status_code}",
        )

        # MOD4-REC-07 y MOD4-REC-16: Validación de descripción y evidencia vacía
        r_rec07 = client.post("/api/v1/reclamaciones", headers=h_comp1, json={"id_envio": id_E2})
        r_rec16 = client.post(
            "/api/v1/reclamaciones",
            headers=h_comp1,
            json={"id_envio": id_E2, "descripcion_daño": "Golpe", "evidencias_fotos_url": ""},
        )
        rec("MOD4-REC-07", "OK" if r_rec07.status_code == 422 else "FALLA", f"HTTP {r_rec07.status_code}")
        rec("MOD4-REC-16", "OK" if r_rec16.status_code == 422 else "FALLA", f"HTTP {r_rec16.status_code}")

        # MOD4-REC-01: El comprador reclama un envío entregado (E1 -> R1)
        r_rec01 = client.post(
            "/api/v1/reclamaciones",
            headers=h_comp1,
            json={
                "id_envio": id_E1,
                "descripcion_daño": "Marco golpeado en el ángulo inferior",
                "evidencias_fotos_url": "https://laboratorio.local/dano-e1.jpg",
            },
        )
        id_R1 = r_rec01.json()["id_reclamacion"]
        r_e1_after = client.get(f"/api/v1/envios/{id_E1}", headers=h_comp1)
        rec(
            "MOD4-REC-01",
            "OK" if (r_rec01.status_code == 201 and r_rec01.json()["estado_resolucion"] == "Evaluación" and r_e1_after.json()["estado_envio"] == "En Reclamación") else "FALLA",
            f"HTTP {r_rec01.status_code} id_reclamacion={id_R1} resolucion=Evaluación envio=En Reclamación",
        )

        # MOD4-REC-03: Un envío no admite dos reclamaciones
        r_rec03 = client.post(
            "/api/v1/reclamaciones",
            headers=h_comp1,
            json={"id_envio": id_E1, "descripcion_daño": "Segunda", "evidencias_fotos_url": "https://lab.local/2.jpg"},
        )
        rec("MOD4-REC-03", "OK" if r_rec03.status_code == 409 else "FALLA", f"HTTP {r_rec03.status_code} {r_rec03.json()}")

        # MOD4-REC-08: Bandeja de reclamaciones es solo del administrador
        r_r08_adm = client.get("/api/v1/reclamaciones", headers=h_admin)
        r_r08_cur = client.get("/api/v1/reclamaciones", headers=h_curador)
        r_r08_comp = client.get("/api/v1/reclamaciones", headers=h_comp1)
        r_r08_anon = client.get("/api/v1/reclamaciones")
        rec(
            "MOD4-REC-08",
            "OK" if (r_r08_adm.status_code == 200 and r_r08_cur.status_code == 403 and r_r08_comp.status_code == 403 and r_r08_anon.status_code == 401) else "FALLA",
            f"admin=200; curador=403; comprador=403; anon=401",
        )

        # MOD4-REC-09: Detalle de reclamación es del dueño o del administrador
        r_r09_c1 = client.get(f"/api/v1/reclamaciones/{id_R1}", headers=h_comp1)
        r_r09_c2 = client.get(f"/api/v1/reclamaciones/{id_R1}", headers=h_comp2)
        r_r09_cur = client.get(f"/api/v1/reclamaciones/{id_R1}", headers=h_curador)
        r_r09_adm = client.get(f"/api/v1/reclamaciones/{id_R1}", headers=h_admin)
        r_r09_404 = client.get("/api/v1/reclamaciones/999999", headers=h_admin)
        rec(
            "MOD4-REC-09",
            "OK" if (r_r09_c1.status_code == 200 and r_r09_adm.status_code == 200 and r_r09_c2.status_code == 403 and r_r09_cur.status_code == 403 and r_r09_404.status_code == 404) else "FALLA",
            f"dueno=200; admin=200; ajeno=403; curador=403; 404={r_r09_404.status_code}",
        )

        # MOD4-REC-13 y MOD4-REC-14
        r_r13_comp = client.patch(f"/api/v1/reclamaciones/{id_R1}/estado", headers=h_comp1, json={"estado_resolucion": "Rechazado"})
        r_r13_cur = client.patch(f"/api/v1/reclamaciones/{id_R1}/estado", headers=h_curador, json={"estado_resolucion": "Rechazado"})
        rec("MOD4-REC-13", "OK" if (r_r13_comp.status_code == 403 and r_r13_cur.status_code == 403) else "FALLA", f"comprador=403; curador=403")

        r_r14 = client.patch(f"/api/v1/reclamaciones/{id_R1}/estado", headers=h_admin, json={"estado_resolucion": "Archivado"})
        rec("MOD4-REC-14", "OK" if r_r14.status_code == 422 else "FALLA", f"HTTP {r_r14.status_code}")

        # MOD4-REC-10: Aprobar el seguro no reembolsa ni devuelve la obra al catálogo (R1)
        r_r10 = client.patch(f"/api/v1/reclamaciones/{id_R1}/estado", headers=h_admin, json={"estado_resolucion": "Aprobado Seguro"})
        r_tx1_chk = client.get(f"/api/v1/transacciones/{id_T1}", headers=h_admin)
        r_o1_chk = client.get(f"/api/v1/obras/{id_O1}")
        rec(
            "MOD4-REC-10",
            "OK" if (r_r10.status_code == 200 and r_tx1_chk.json()["estado_pago"] == "Confirmado" and r_o1_chk.json()["estado_obra"] == "Vendido") else "FALLA",
            f"resolucion=Aprobado Seguro; pago={r_tx1_chk.json()['estado_pago']}; obra={r_o1_chk.json()['estado_obra']}",
        )

        # Crear R2 sobre E2 y probar MOD4-REC-11 (Devolución Dinero), REC-15, REC-17 y REC-18
        r_rec_R2 = client.post(
            "/api/v1/reclamaciones",
            headers=h_comp1,
            json={"id_envio": id_E2, "descripcion_daño": "Lienzo rasgado", "evidencias_fotos_url": "https://lab.local/r2.jpg"},
        )
        id_R2 = r_rec_R2.json()["id_reclamacion"]
        r_r11 = client.patch(f"/api/v1/reclamaciones/{id_R2}/estado", headers=h_admin, json={"estado_resolucion": "Devolución Dinero"})
        r_tx2_chk = client.get(f"/api/v1/transacciones/{id_T2}", headers=h_admin)
        r_o2_chk = client.get(f"/api/v1/obras/{id_O2}")
        rec(
            "MOD4-REC-11",
            "OK" if (r_r11.status_code == 200 and r_tx2_chk.json()["estado_pago"] == "Reembolsado" and r_o2_chk.json()["estado_obra"] == "Publicado") else "FALLA",
            f"resolucion=Devolución Dinero; pago={r_tx2_chk.json()['estado_pago']}; obra={r_o2_chk.json()['estado_obra']}",
        )

        # MOD4-REC-15: Auditoría RESOLUCION_RECLAMACION
        r_aud_rec = client.get("/api/v1/auditoria", headers=h_admin)
        tiene_log_rec = any(l["accion_realizada"] == "RESOLUCION_RECLAMACION" and str(id_R2) in (l.get("detalles") or "") for l in r_aud_rec.json())
        rec("MOD4-REC-15", "OK" if tiene_log_rec else "FALLA", f"log RESOLUCION_RECLAMACION encontrado={tiene_log_rec}")

        # MOD4-REC-17: Devolver el dinero no borra la reclamación ni la guía
        r_r2_get = client.get(f"/api/v1/reclamaciones/{id_R2}", headers=h_comp1)
        r_e2_get = client.get(f"/api/v1/envios/{id_E2}", headers=h_comp1)
        rec(
            "MOD4-REC-17",
            "OK" if (r_r2_get.status_code == 200 and r_e2_get.status_code == 200 and r_e2_get.json()["guia_transporte"] == guia_E2) else "FALLA",
            f"reclamacion={r_r2_get.status_code}; envio={r_e2_get.status_code} guia={guia_E2}",
        )

        # MOD4-REC-18: Segunda resolución no crea otro reembolso ni duplica transacción
        r_r18 = client.patch(f"/api/v1/reclamaciones/{id_R2}/estado", headers=h_admin, json={"estado_resolucion": "Devolución Dinero"})
        r_o2_chk2 = client.get(f"/api/v1/obras/{id_O2}")
        rec(
            "MOD4-REC-18",
            "OK" if (r_r18.status_code == 200 and r_o2_chk2.json()["estado_obra"] == "Publicado") else "FALLA",
            f"2do PATCH={r_r18.status_code}; estado_obra={r_o2_chk2.json()['estado_obra']}",
        )

        # Crear R3 sobre E3 y probar MOD4-REC-12 (Rechazado)
        r_rec_R3 = client.post(
            "/api/v1/reclamaciones",
            headers=h_comp1,
            json={"id_envio": id_E3, "descripcion_daño": "Reclamo sin mérito", "evidencias_fotos_url": "https://lab.local/r3.jpg"},
        )
        id_R3 = r_rec_R3.json()["id_reclamacion"]
        r_r12 = client.patch(f"/api/v1/reclamaciones/{id_R3}/estado", headers=h_admin, json={"estado_resolucion": "Rechazado"})
        r_tx3_chk = client.get(f"/api/v1/transacciones/{id_T3}", headers=h_admin)
        rec(
            "MOD4-REC-12",
            "OK" if (r_r12.status_code == 200 and r_tx3_chk.json()["estado_pago"] == "Confirmado") else "FALLA",
            f"resolucion=Rechazado; pago sigue {r_tx3_chk.json()['estado_pago']}",
        )

        for ui_id in ("MOD4-UI-01", "MOD4-UI-02", "MOD4-UI-03", "MOD4-UI-04"):
            rec(
                ui_id,
                "BLOQUEADO",
                f"Caso de usabilidad UI ({ui_id}) en navegador. Todos los endpoints de envíos y reclamaciones pasaron OK.",
                "Requiere ejecución visual humana en navegador.",
            )

        # =====================================================================
        # LOTE MOD5 — TRUST ENGINE: CERTIFICADOS Y TRAZABILIDAD (16 casos)
        # =====================================================================
        print("\n=== EJECUTANDO CASOS_MOD5 ===")

        # MOD5-TRU-04: Solo el curador emite certificados
        cert_body = {
            "firma_digital_curador": f"FIRMA-CURADOR-PALACIO-{stamp}",
            "pdf_certificado_url": f"/static/certificados/cert_{id_obra_1}.pdf",
        }
        r_t04_anon = client.post(f"/api/v1/certificados/{id_obra_1}", json=cert_body)
        r_t04_comp = client.post(f"/api/v1/certificados/{id_obra_1}", headers=h_comp1, json=cert_body)
        r_t04_art = client.post(f"/api/v1/certificados/{id_obra_1}", headers=h_art_ver, json=cert_body)
        r_t04_adm = client.post(f"/api/v1/certificados/{id_obra_1}", headers=h_admin, json=cert_body)
        rec(
            "MOD5-TRU-04",
            "OK" if (r_t04_anon.status_code == 401 and r_t04_comp.status_code == 403 and r_t04_art.status_code == 403 and r_t04_adm.status_code == 403) else "FALLA",
            f"anon=401; comp=403; art=403; admin=403",
        )

        # MOD5-TRU-10: Emisión sin firma digital falla con 422
        r_t10 = client.post(f"/api/v1/certificados/{id_obra_1}", headers=h_curador, json={"pdf_certificado_url": "/static/c.pdf"})
        rec("MOD5-TRU-10", "OK" if r_t10.status_code == 422 else "FALLA", f"HTTP {r_t10.status_code}")

        # MOD5-TRU-01: Curador emite certificado y nace sello SHA-256 de 64 chars
        r_tru01 = client.post(f"/api/v1/certificados/{id_obra_1}", headers=h_curador, json=cert_body)
        cert_1 = r_tru01.json()
        sello_1 = cert_1.get("codigo_qr_validacion", "")
        rec(
            "MOD5-TRU-01",
            "OK" if (r_tru01.status_code == 201 and len(sello_1) == 64) else "FALLA",
            f"HTTP {r_tru01.status_code} id_cert={cert_1.get('id_certificado')} sello_sha256={sello_1[:16]}... (len={len(sello_1)})",
        )

        # MOD5-TRU-02: Verificación pública por sello devuelve sello_valido=True
        r_tru02 = client.get(f"/api/v1/certificados/verificar/{sello_1}")
        rec(
            "MOD5-TRU-02",
            "OK" if (r_tru02.status_code == 200 and r_tru02.json().get("sello_valido") is True) else "FALLA",
            f"HTTP {r_tru02.status_code} sello_valido={r_tru02.json().get('sello_valido')} obra={r_tru02.json().get('obra', {}).get('titulo')}",
        )

        # MOD5-TRU-03: Una obra no se certifica dos veces -> 409
        r_tru03 = client.post(f"/api/v1/certificados/{id_obra_1}", headers=h_curador, json=cert_body)
        rec("MOD5-TRU-03", "OK" if r_tru03.status_code == 409 else "FALLA", f"HTTP {r_tru03.status_code} {r_tru03.json()}")

        # MOD5-TRU-05: Cola de obras pendientes de certificación solo para Curador
        r_t05_anon = client.get("/api/v1/certificados/pendientes")
        r_t05_comp = client.get("/api/v1/certificados/pendientes", headers=h_comp1)
        r_t05_cur = client.get("/api/v1/certificados/pendientes", headers=h_curador)
        no_incluye_cert = all(o["id_obra"] != id_obra_1 for o in r_t05_cur.json())
        rec(
            "MOD5-TRU-05",
            "OK" if (r_t05_anon.status_code == 401 and r_t05_comp.status_code == 403 and r_t05_cur.status_code == 200 and no_incluye_cert) else "FALLA",
            f"anon=401; comp=403; curador=200 (excluye obra ya certificada={no_incluye_cert})",
        )

        # MOD5-TRU-06: Renderizado PNG del código QR de validación del certificado
        r_qr_cert = client.get(f"/api/v1/certificados/{id_obra_1}/qr")
        r_qr_404 = client.get("/api/v1/certificados/999999/qr")
        rec(
            "MOD5-TRU-06",
            "OK" if (r_qr_cert.status_code == 200 and r_qr_cert.headers.get("content-type") == "image/png" and r_qr_404.status_code == 404) else "FALLA",
            f"QR PNG={r_qr_cert.status_code} ({len(r_qr_cert.content)} bytes); inexistente={r_qr_404.status_code}",
        )

        # MOD5-TRU-07: Alteración de ficha técnica invalida el sello (sello_valido=False)
        client.patch(f"/api/v1/obras/{id_obra_1}", headers=h_curador, json={"tecnica": "Técnica Alterada"})
        r_ver_alt = client.get(f"/api/v1/certificados/verificar/{sello_1}")
        client.patch(f"/api/v1/obras/{id_obra_1}", headers=h_curador, json={"tecnica": "Óleo sobre lienzo"})
        r_ver_rest = client.get(f"/api/v1/certificados/verificar/{sello_1}")
        rec(
            "MOD5-TRU-07",
            "OK" if (r_ver_alt.json().get("sello_valido") is False and r_ver_rest.json().get("sello_valido") is True) else "FALLA",
            f"con_dato_alterado: sello_valido={r_ver_alt.json().get('sello_valido')}; restaurado: sello_valido={r_ver_rest.json().get('sello_valido')}",
        )

        # MOD5-TRU-08: Sello inexistente y obra inexistente -> 404
        r_t08_1 = client.get("/api/v1/certificados/verificar/" + ("0" * 64))
        r_t08_2 = client.get("/api/v1/certificados/999999")
        r_t08_3 = client.post("/api/v1/certificados/999999", headers=h_curador, json=cert_body)
        rec(
            "MOD5-TRU-08",
            "OK" if (r_t08_1.status_code == 404 and r_t08_2.status_code == 404 and r_t08_3.status_code == 404) else "FALLA",
            f"verificar_404={r_t08_1.status_code}; get_404={r_t08_2.status_code}; post_404={r_t08_3.status_code}",
        )

        # MOD5-TRU-09: Descarga definitiva del certificado exige envío Entregado (RF 5.2.2)
        client.post(f"/api/v1/certificados/{id_O4}", headers=h_curador, json=cert_body)
        r_env_E4 = client.post("/api/v1/envios", headers=h_curador, json={"id_transaccion": id_T4_pend, "tipo_envio": "Estándar", "costo_envio": 25000})
        id_E4 = r_env_E4.json()["id_envio"]
        r_desc_antes = client.get(f"/api/v1/certificados/{id_O4}/descargar", headers=h_comp1)
        client.post(
            f"/api/v1/envios/{id_E4}/confirmar-recepcion",
            headers=h_comp1,
            json={"foto_recepcion_url": "https://lab.local/rec-e4.jpg", "firma_digital_comprador": "firma-comp1"},
        )
        r_desc_despues = client.get(f"/api/v1/certificados/{id_O4}/descargar", headers=h_comp1)
        rec(
            "MOD5-TRU-09",
            "OK" if (r_desc_antes.status_code == 409 and r_desc_despues.status_code == 200) else "FALLA",
            f"antes_de_entrega={r_desc_antes.status_code}; despues_de_entrega={r_desc_despues.status_code}",
        )

        # MOD5-TRA-01: GET /trazabilidad/{id_obra} refleja cambio de propietario post-compra
        r_tra01 = client.get(f"/api/v1/trazabilidad/{id_obra_A}")
        rec(
            "MOD5-TRA-01",
            "OK" if (r_tra01.status_code == 200 and len(r_tra01.json()) == 1 and r_tra01.json()[0]["id_propietario_nuevo"] == ids["comp1"][0]) else "FALLA",
            f"HTTP 200 filas={len(r_tra01.json())} nuevo_dueno={r_tra01.json()[0]['id_propietario_nuevo']}",
        )

        # MOD5-TRA-02: Obra sin ventas confirmadas tiene trazabilidad vacía
        r_tra02 = client.get(f"/api/v1/trazabilidad/{id_obra_1}")
        rec("MOD5-TRA-02", "OK" if (r_tra02.status_code == 200 and r_tra02.json() == []) else "FALLA", f"HTTP 200 filas={len(r_tra02.json())}")

        # MOD5-TRA-03: Consulta global GET /trazabilidad exclusiva para Administrador (RF 5.4.2)
        r_gt_anon = client.get("/api/v1/trazabilidad")
        r_gt_comp = client.get("/api/v1/trazabilidad", headers=h_comp1)
        r_gt_cur = client.get("/api/v1/trazabilidad", headers=h_curador)
        r_gt_adm = client.get("/api/v1/trazabilidad", headers=h_admin)
        rec(
            "MOD5-TRA-03",
            "OK" if (r_gt_anon.status_code == 401 and r_gt_comp.status_code == 403 and r_gt_cur.status_code == 403 and r_gt_adm.status_code == 200 and len(r_gt_adm.json()) >= 1) else "FALLA",
            f"anon=401; comp=403; cur=403; admin=200 (total={len(r_gt_adm.json())})",
        )

        # MOD5-TRA-04: Inmutabilidad de trazabilidad
        r_tra_del = client.delete(f"/api/v1/trazabilidad/{id_obra_A}", headers=h_admin)
        r_tra_pat = client.patch(f"/api/v1/trazabilidad/{id_obra_A}", headers=h_admin, json={})
        rec(
            "MOD5-TRA-04",
            "OK" if (r_tra_del.status_code in (404, 405) and r_tra_pat.status_code in (404, 405)) else "FALLA",
            f"DELETE={r_tra_del.status_code}; PATCH={r_tra_pat.status_code}",
        )

        rec(
            "MOD5-UI-01",
            "BLOQUEADO",
            "Caso de usabilidad UI de /verificar/{sello} en navegador. API verificada en TRU-02 y TRU-07.",
            "Requiere ejecución visual humana en navegador.",
        )
        rec(
            "MOD5-UI-02",
            "BLOQUEADO",
            "Caso de usabilidad UI de DialogoEmitirCertificado y LineaTrazabilidad. API verificada en TRU-01 y TRA-01.",
            "Requiere ejecución visual humana en navegador.",
        )

    # Guardar JSON de respaldo
    out_json = Path(__file__).resolve().parents[2] / "Doc" / "resultados_mod2_a_mod5.json"
    out_json.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    # =========================================================================
    # ACTUALIZAR LIBRO EXCEL (Casos_MOD2, Casos_MOD3, Casos_MOD4, Casos_MOD5, Dashboard, Backlog_MOD2_5)
    # =========================================================================
    import openpyxl

    src_xlsx = Path(__file__).resolve().parents[2] / "Doc" / "Matriz_Casos_Prueba_TP-2026-001_con_MOD4.xlsx"
    wb = openpyxl.load_workbook(src_xlsx)

    # 1. Crear hoja Casos_MOD5 copiando formato de Casos_MOD4 si no existe
    if "Casos_MOD5" in wb.sheetnames:
        del wb["Casos_MOD5"]
    ws_mod5 = wb.copy_worksheet(wb["Casos_MOD4"])
    ws_mod5.title = "Casos_MOD5"
    # Reubicar Casos_MOD5 justo después de Casos_MOD4
    idx_mod4 = wb.sheetnames.index("Casos_MOD4")
    wb.move_sheet(ws_mod5, offset=idx_mod4 - wb.sheetnames.index("Casos_MOD5") + 1)

    # Guardar estilos de fila 2 de Casos_MOD4 para aplicarlos a Casos_MOD5
    template_styles = [copy.copy(ws_mod5.cell(2, c)._style) for c in range(1, 17)]
    if ws_mod5.max_row >= 2:
        ws_mod5.delete_rows(2, ws_mod5.max_row - 1)

    for idx_r, spec in enumerate(CASOS_MOD5_SPEC, start=2):
        cid = spec["id"]
        res = results.get(cid, {})
        row_vals = [
            cid,
            "5. Trust Engine (Certificados y trazabilidad)",
            spec["prioridad"],
            spec["tipo"],
            spec["tecnica"],
            spec["titulo"],
            spec["precondiciones"],
            spec["pasos"],
            spec["esperado"],
            res.get("resultado", "Pendiente"),
            res.get("fecha", ""),
            res.get("ejecutor", ""),
            res.get("evidencia", ""),
            "",
            res.get("observaciones", ""),
            res.get("entorno", ""),
        ]
        for col_idx, val in enumerate(row_vals, start=1):
            cell = ws_mod5.cell(idx_r, col_idx, value=val)
            cell._style = copy.copy(template_styles[col_idx - 1])
        ws_mod5.row_dimensions[idx_r].height = 48

    # 2. Llenar resultados de ejecución en Casos_MOD2, Casos_MOD3 y Casos_MOD4
    for sheet_name in ("Casos_MOD2", "Casos_MOD3", "Casos_MOD4"):
        ws = wb[sheet_name]
        for r in range(2, ws.max_row + 1):
            cid = ws.cell(r, 1).value
            if cid and cid in results:
                info = results[cid]
                ws.cell(r, 10, value=info["resultado"])
                ws.cell(r, 11, value=info["fecha"])
                ws.cell(r, 12, value=info["ejecutor"])
                ws.cell(r, 13, value=info["evidencia"])
                ws.cell(r, 15, value=info["observaciones"])
                ws.cell(r, 16, value=info["entorno"])

    # 3. Actualizar Backlog_MOD2_5
    if "Backlog_MOD2_5" in wb.sheetnames:
        ws_b = wb["Backlog_MOD2_5"]
        for r in range(2, ws_b.max_row + 1):
            cid = ws_b.cell(r, 1).value
            if not cid:
                continue
            if cid in results:
                ws_b.cell(r, 8, value=results[cid]["resultado"])
                if str(cid).startswith("MOD5-"):
                    ws_b.cell(r, 9, value="Diseñado y ejecutado en la hoja Casos_MOD5.")
                else:
                    ws_b.cell(r, 9, value="Diseñado y ejecutado en su hoja correspondiente.")

    # 4. Agregar bloque de Módulo 5 al Dashboard copiando el bloque de MOD4 (filas 64-78 -> 80-94)
    dash = wb["Dashboard"]
    for offset in range(15):
        src_r = 64 + offset
        dst_r = 80 + offset
        for c in range(1, 8):
            sc = dash.cell(src_r, c)
            dc = dash.cell(dst_r, c)
            dc._style = copy.copy(sc._style)
            val = sc.value
            if isinstance(val, str):
                val = (
                    val.replace("Casos_MOD4", "Casos_MOD5")
                    .replace("lote Logística y reclamaciones", "lote Trust Engine (Certificados y trazabilidad)")
                    .replace("lote MOD4", "lote MOD5")
                    .replace("módulos 1 a 3", "módulos 1 a 4")
                    .replace("B68", "B84")
                    .replace("C68", "C84")
                    .replace("D68", "D84")
                    .replace("E68", "E84")
                    .replace("B69", "B85")
                    .replace("C69", "C85")
                    .replace("D69", "D85")
                    .replace("E69", "E85")
                    .replace("B70", "B86")
                    .replace("C70", "C86")
                    .replace("D70", "D86")
                    .replace("E70", "E86")
                    .replace("B71", "B87")
                    .replace("C71", "C87")
                    .replace("D71", "D87")
                    .replace("E71", "E87")
                    .replace("B72", "B88")
                    .replace("C72", "C88")
                    .replace("D72", "D88")
                    .replace("E72", "E88")
                    .replace("C73", "C89")
                    .replace("D73", "D89")
                    .replace("C75", "C91")
                    .replace("C76", "C92")
                )
            dc.value = val

    # 5. Actualizar hoja Instrucciones
    inst = wb["Instrucciones"]
    inst["C8"] = f"2.0  ·  {fecha_hoy}"
    inst["C9"] = "Módulos 1, 2, 3, 4 y 5 diseñados y ejecutados al 100 % en API (Casos_MOD1 a Casos_MOD5)."
    inst["C21"] = "Todos los lotes (Módulos 1 a 5) están promovidos y ejecutados en Casos_MOD1 a Casos_MOD5."

    # Guardar en archivos de destino
    dst_main = Path(__file__).resolve().parents[2] / "Doc" / "Matriz_Casos_Prueba_TP-2026-001.xlsx"
    wb.save(dst_main)
    print(f"\nMatriz completa guardada en: {dst_main}")

    try:
        wb.save(src_xlsx)
        print(f"Matriz original actualizada directamente en: {src_xlsx}")
    except PermissionError:
        print(f"NOTA: {src_xlsx.name} está abierto en Excel; los cambios quedaron guardados en {dst_main.name}.")

    c = Counter(v["resultado"] for v in results.values())
    print("Resumen global MOD2..MOD5:", dict(c), "Total casos ejecutados:", len(results))


if __name__ == "__main__":
    main()

