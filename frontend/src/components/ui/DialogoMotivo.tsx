import { useState } from "react";
import { Modal } from "./Modal";
import { Textarea } from "./Textarea";
import { Button } from "./Button";

interface DialogoMotivoProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: (motivo: string) => Promise<void> | void;
  titulo: string;
  descripcion?: string;
  etiquetaCampo?: string;
  etiquetaConfirmar?: string;
  placeholder?: string;
}

/** Diálogo compartido para las acciones curatoriales que exigen justificar la
 * decisión (rechazar un artista, devolver una obra con observaciones). El
 * motivo es obligatorio: es lo que viaja al correo del artista y al log de
 * auditoría. */
export function DialogoMotivo({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  descripcion,
  etiquetaCampo = "Motivo",
  etiquetaConfirmar = "Confirmar",
  placeholder,
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
    if (motivo.trim().length < 10) {
      setError("Describe el motivo con al menos 10 caracteres.");
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
    <Modal abierto={abierto} onCerrar={cerrar} titulo={titulo} descripcion={descripcion}>
      <div className="flex flex-col gap-4">
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
        <div className="flex justify-end gap-3">
          <Button variante="fantasma" onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button variante="peligro" onClick={confirmar} cargando={enviando}>
            {etiquetaConfirmar}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
