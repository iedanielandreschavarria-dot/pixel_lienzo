// Tipos alineados 1:1 con los esquemas Pydantic del backend
// (ver backend/app/schemas/*.py). Mantenerlos sincronizados si el backend cambia.

export type NombreRol = "Administrador" | "Curador" | "Artista" | "Comprador";

export type EstadoObra =
  | "Pendiente"
  | "Publicado"
  | "Reservado"
  | "Vendido"
  | "En Préstamo"
  | "Mantenimiento";

export type EstadoPago = "Procesando" | "Confirmado" | "Dispersado" | "Reembolsado" | "Rechazado";

export interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
}

export interface Obra {
  id_obra: number;
  uid: string;
  titulo: string;
  tecnica: string;
  dimensiones: string;
  peso: string;
  anio_creacion: number | null;
  precio_venta: string;
  fotografia_hd_url: string;
  codigo_qr_obra: string | null;
  estado_obra: EstadoObra;
  es_patrimonio_historico: boolean;
  id_artista: number;
  id_categoria: number;
}

export interface PerfilArtista {
  id_artista: number;
  biografia_profesional: string | null;
  documento_identidad_url: string;
  estado_validacion: "Pendiente" | "Verificado" | "Rechazado";
  motivos_rechazo: string | null;
}

export interface Usuario {
  id_usuario: number;
  correo_electronico: string;
  id_rol: number;
  mfa_activado: boolean;
  estado_cuenta: "Activo" | "Inhabilitado";
  fecha_registro: string;
}

/** Usuario autenticado + el nombre de rol (decodificado del access token,
 * ya que `UsuarioOut` solo expone `id_rol` numérico). */
export interface AuthUser extends Usuario {
  rol: NombreRol;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  requiere_mfa: boolean;
}

export interface Msg {
  mensaje: string;
}

export interface Transaccion {
  id_transaccion: number;
  id_comprador: number;
  id_obra: number;
  fecha_pago: string;
  monto_total: string;
  porcentaje_comision_galeria: string;
  monto_neto_artista: string;
  monto_comision_galeria: string;
  impuestos_retenciones: string;
  estado_pago: EstadoPago;
  referencia_pasarela: string | null;
}

export interface TransaccionCreada extends Transaccion {
  checkout_url: string;
}

export interface CheckoutWompi {
  checkout_url: string;
  referencia: string;
}

export interface ApiError {
  detail: string;
}
