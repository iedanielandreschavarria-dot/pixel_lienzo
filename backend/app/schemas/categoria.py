from pydantic import BaseModel, ConfigDict


class CategoriaBase(BaseModel):
    nombre_categoria: str


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaOut(CategoriaBase):
    model_config = ConfigDict(from_attributes=True)

    id_categoria: int
