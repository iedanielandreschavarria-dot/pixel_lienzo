import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload } from "lucide-react";
import { emitirCertificado } from "../../api/certificados";
import { subirPdfCertificado } from "../../api/archivos";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { obtenerMensajeError } from "../../api/client";
import type { Obra } from "../../types";

interface DialogoEmitirCertificadoProps {
  obra: Obra;
  abierto: boolean;
  onCerrar: () => void;
}

/** Emisión del certificado de autenticidad. La firma del curador se combina con
 * la ficha técnica de la obra para calcular el sello SHA-256, así que es
 * irreversible: el backend rechaza un segundo certificado para la misma obra. */
export function DialogoEmitirCertificado({ obra, abierto, onCerrar }: DialogoEmitirCertificadoProps) {
  const { notificar } = useToast();
  const queryClient = useQueryClient();
  const [firma, setFirma] = useState("");
  const [pdf, setPdf] = useState<File>();
  const [errores, setErrores] = useState<{ firma?: string; pdf?: string }>({});

  const cerrar = () => {
    setFirma("");
    setPdf(undefined);
    setErrores({});
    onCerrar();
  };

  const mutacion = useMutation({
    mutationFn: async () => {
      const pdf_certificado_url = await subirPdfCertificado(pdf!);
      return emitirCertificado(obra.id_obra, {
        firma_digital_curador: firma.trim(),
        pdf_certificado_url,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras-sin-certificado"] });
      queryClient.invalidateQueries({ queryKey: ["certificado", obra.id_obra] });
      notificar("Certificado emitido. Su QR de validación ya es público.");
      cerrar();
    },
    onError: (error) => notificar(obtenerMensajeError(error, "No fue posible emitir el certificado"), "error"),
  });

  const emitir = () => {
    const nuevos: { firma?: string; pdf?: string } = {};
    if (firma.trim().length < 6) nuevos.firma = "Ingresa tu firma digital (mínimo 6 caracteres).";
    if (!pdf) nuevos.pdf = "Adjunta el certificado en PDF.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;
    mutacion.mutate();
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Emitir certificado"
      descripcion={`«${obra.titulo}» quedará certificada de forma permanente. El sello se calcula sobre su ficha técnica actual y no puede volver a emitirse.`}
    >
      <div className="flex flex-col gap-5">
        <Input
          label="Firma digital del curador"
          name="firma_digital_curador"
          autoFocus
          value={firma}
          placeholder="Nombre y número de acreditación"
          error={errores.firma}
          onChange={(e) => {
            setFirma(e.target.value);
            if (errores.firma) setErrores((prev) => ({ ...prev, firma: undefined }));
          }}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-marfil-suave">Certificado firmado (PDF)</span>
          <label
            htmlFor="pdf-certificado"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-antracita-suave bg-antracita px-4 py-3 text-sm text-marfil-suave transition-colors hover:border-ocre/50 hover:text-marfil"
          >
            {pdf ? <FileText size={17} className="text-ocre" /> : <Upload size={17} />}
            <span className="truncate">{pdf ? pdf.name : "Seleccionar archivo PDF"}</span>
          </label>
          <input
            id="pdf-certificado"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              setPdf(e.target.files?.[0]);
              if (errores.pdf) setErrores((prev) => ({ ...prev, pdf: undefined }));
            }}
          />
          {errores.pdf && <span className="text-xs text-terracota">{errores.pdf}</span>}
        </div>

        <div className="flex justify-end gap-3">
          <Button variante="fantasma" onClick={cerrar} disabled={mutacion.isPending}>
            Cancelar
          </Button>
          <Button onClick={emitir} cargando={mutacion.isPending}>
            Emitir certificado
          </Button>
        </div>
      </div>
    </Modal>
  );
}
