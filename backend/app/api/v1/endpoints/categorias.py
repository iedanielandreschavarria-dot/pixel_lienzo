"""
Módulo 2: Curaduría y Catálogo — Taxonomías de categorías artísticas.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import ROL_ADMINISTRADOR, require_roles
from app.core.database import get_db
from app.models.categoria_arte import CategoriaArte
from app.schemas.categoria import CategoriaCreate, CategoriaOut

router = APIRouter()


@router.get("", response_model=list[CategoriaOut])
def listar_categorias(db: Session = Depends(get_db)):
    """RF 2.1.3 — Taxonomías disponibles (Óleo, Escultura, Fotografía, etc.)."""
    return db.query(CategoriaArte).all()


@router.post(
    "",
    response_model=CategoriaOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))],
)
def crear_categoria(payload: CategoriaCreate, db: Session = Depends(get_db)):
    if db.query(CategoriaArte).filter(CategoriaArte.nombre_categoria == payload.nombre_categoria).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La categoría ya existe")
    categoria = CategoriaArte(**payload.model_dump())
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria
