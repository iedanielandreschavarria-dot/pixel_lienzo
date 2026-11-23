import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Obra } from "../types";

export interface ItemCarrito {
  id_obra: number;
  uid: string;
  titulo: string;
  id_artista: number;
  tecnica: string;
  dimensiones: string;
  precio_venta: string;
  fotografia_hd_url?: string | null;
}

interface CartContextValue {
  items: ItemCarrito[];
  cantidad: number;
  total: number;
  abierto: boolean;
  abrirCarrito: () => void;
  cerrarCarrito: () => void;
  alternarCarrito: () => void;
  agregarObra: (obra: Obra) => boolean;
  quitarObra: (idObra: number) => void;
  vaciarCarrito: () => void;
  estaEnCarrito: (idObra: number) => boolean;
}

const STORAGE_KEY = "pyl_carrito_v1";

const CartContext = createContext<CartContextValue | null>(null);

function leerCarritoInicial(): ItemCarrito[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>(leerCarritoInicial);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignorar errores de almacenamiento privado
    }
  }, [items]);

  const abrirCarrito = useCallback(() => setAbierto(true), []);
  const cerrarCarrito = useCallback(() => setAbierto(false), []);
  const alternarCarrito = useCallback(() => setAbierto((prev) => !prev), []);

  const estaEnCarrito = useCallback(
    (idObra: number) => items.some((item) => item.id_obra === idObra),
    [items]
  );

  const agregarObra = useCallback((obra: Obra): boolean => {
    let agregada = false;
    setItems((prev) => {
      if (prev.some((item) => item.id_obra === obra.id_obra)) {
        return prev;
      }
      agregada = true;
      return [
        ...prev,
        {
          id_obra: obra.id_obra,
          uid: obra.uid,
          titulo: obra.titulo,
          id_artista: obra.id_artista,
          tecnica: obra.tecnica,
          dimensiones: obra.dimensiones,
          precio_venta: String(obra.precio_venta),
          fotografia_hd_url: obra.fotografia_hd_url,
        },
      ];
    });
    return agregada;
  }, []);

  const quitarObra = useCallback((idObra: number) => {
    setItems((prev) => prev.filter((item) => item.id_obra !== idObra));
  }, []);

  const vaciarCarrito = useCallback(() => {
    setItems([]);
  }, []);

  const total = useMemo(
    () => items.reduce((acc, item) => acc + (Number(item.precio_venta) || 0), 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      cantidad: items.length,
      total,
      abierto,
      abrirCarrito,
      cerrarCarrito,
      alternarCarrito,
      agregarObra,
      quitarObra,
      vaciarCarrito,
      estaEnCarrito,
    }),
    [
      items,
      total,
      abierto,
      abrirCarrito,
      cerrarCarrito,
      alternarCarrito,
      agregarObra,
      quitarObra,
      vaciarCarrito,
      estaEnCarrito,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe utilizarse dentro de un CartProvider");
  }
  return ctx;
}

