import api from "./client";
import type {
  CheckoutStripe,
  CheckoutWompi,
  PasarelaPago,
  Transaccion,
  TransaccionCreada,
} from "../types";

export async function crearTransaccion(
  idObra: number,
  pasarela: PasarelaPago = "wompi"
): Promise<TransaccionCreada> {
  const { data } = await api.post<TransaccionCreada>("/transacciones", {
    id_obra: idObra,
    pasarela,
  });
  return data;
}

export async function listarMisTransacciones(): Promise<Transaccion[]> {
  const { data } = await api.get<Transaccion[]>("/transacciones");
  return data;
}

export async function obtenerTransaccion(idTransaccion: number): Promise<Transaccion> {
  const { data } = await api.get<Transaccion>(`/transacciones/${idTransaccion}`);
  return data;
}

export async function obtenerCheckoutWompi(idTransaccion: number): Promise<CheckoutWompi> {
  const { data } = await api.get<CheckoutWompi>(`/transacciones/${idTransaccion}/checkout-wompi`);
  return data;
}

export async function obtenerCheckoutStripe(idTransaccion: number): Promise<CheckoutStripe> {
  const { data } = await api.get<CheckoutStripe>(`/transacciones/${idTransaccion}/checkout-stripe`);
  return data;
}
