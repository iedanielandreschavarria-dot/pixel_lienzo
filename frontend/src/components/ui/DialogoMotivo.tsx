import { useState } from "react";
import { Modal } from "./Modal";
import { Textarea } from "./Textarea";
import { Button } from "./Button";

export interface DialogoMotivoProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: (motivo: string) => Promise<void> | void;
  titulo: string;
  descripcion?: string;
  etiquetaCampo?: string;
  etiquetaConfirmar?: string;
  placeholder?: string;
  minCaracteres?: number;
  destructivo?: boolean;
}

/**
 * Diálogo compartido para las acciones curatoriales y confirmaciones destructivas (4.8 y 6.14).
 */
export function DialogoMotivo({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  descripcion,
  etiquetaCampo = "Motivo",
  etiquetaConfirmar = "Confirmar",
  placeholder,
  minCaracteres = 20,
  destructivo = true,
}: DialogoMotivoProps) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  const cerrar = () => {
    setMotivo("");
    setError(undefined);
    onCerrar();
  };

  const confirmar = async () => {
    if (motivo.trim().length < minCaracteres) {
      setError(`Describe el motivo con al menos ${minCaracteres} caracteres.`);
      return;
    }
    setEnviando(true);
    try {
      await onConfirmar(motivo.trim());
      setMotivo("");
      setError(undefined);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={cerrar}
      titulo={titulo}
      descripcion={descripcion}
      destructivo={destructivo}
    >
      <div className="flex flex-col gap-[var(--espacio-16)]">
        <Textarea
          label={etiquetaCampo}
          rows={4}
          autoFocus
          value={motivo}
          placeholder={placeholder}
          error={error}
          onChange={(e) => {
            setMotivo(e.target.value);
            if (error) setError(undefined);
          }}
        />
        <div className="flex justify-end gap-[var(--espacio-12)]">
          <Button variante="secundario" onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            variante={destructivo ? "destructivo" : "primario"}
            onClick={confirmar}
            cargando={enviando}
          >
            {etiquetaConfirmar}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

