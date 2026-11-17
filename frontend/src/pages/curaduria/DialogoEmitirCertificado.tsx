import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { emitirCertificado } from "../../api/certificados";
import { subirPdfCertificado } from "../../api/archivos";
import { obtenerMensajeError } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/ui/FileUpload";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import type { Obra } from "../../types";

interface DialogoEmitirCertificadoProps {
  obra: Obra;
  abierto: boolean;
  onCerrar: () => void;
}

/**
 * Emisión del certificado de autenticidad (Sección 6.14):
 * La firma del curador se combina con la ficha técnica de la obra para calcular
 * el sello SHA-256 irreversible.
 */
export function DialogoEmitirCertificado({
  obra,
  abierto,
  onCerrar,
}: DialogoEmitirCertificadoProps) {
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
      void queryClient.invalidateQueries({ queryKey: ["obras-sin-certificado"] });
      void queryClient.invalidateQueries({ queryKey: ["certificado", obra.id_obra] });
      notificar("Certificado emitido. Su código QR de validación ya es público.", "exito");
      cerrar();
    },
    onError: (error) =>
      notificar(obtenerMensajeError(error, "No fue posible emitir el certificado"), "error"),
  });

  const emitir = () => {
    const nuevos: { firma?: string; pdf?: string } = {};
    if (firma.trim().length < 6) {
      nuevos.firma = "Ingresa tu firma digital (mínimo 6 caracteres).";
    }
    if (!pdf) {
      nuevos.pdf = "Adjunta el certificado firmado en formato PDF.";
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;
    mutacion.mutate();
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Emitir certificado"
      descripcion={`"${obra.titulo}" quedará certificada de forma permanente. El sello SHA-256 se calcula sobre su ficha técnica actual.`}
    >
      <div className="flex flex-col gap-[var(--espacio-24)]">
        <Input
          id="curador-firma-digital"
          variante="caja"
          label="Firma digital del curador"
          name="firma_digital_curador"
          value={firma}
          placeholder="Nombre completo y número de acreditación"
          error={errores.firma}
          onChange={(e) => {
            setFirma(e.target.value);
            if (errores.firma) setErrores((prev) => ({ ...prev, firma: undefined }));
          }}
        />

        <FileUpload
          label="Certificado firmado (PDF)"
          ayuda="Archivo PDF oficial firmado por curaduría."
          accept="application/pdf"
          archivoActual={pdf ? { nombre: pdf.name, tamanoBytes: pdf.size } : null}
          error={errores.pdf}
          onSelectFile={(archivo) => {
            setPdf(archivo);
            if (errores.pdf) setErrores((prev) => ({ ...prev, pdf: undefined }));
          }}
        />

        <div className="flex justify-end gap-[var(--espacio-12)] border-t border-[color:var(--divisor)] pt-[var(--espacio-16)]">
          <Button variante="secundario" onClick={cerrar} disabled={mutacion.isPending}>
            Cancelar
          </Button>
          <Button variante="primario" onClick={emitir} cargando={mutacion.isPending}>
            Emitir certificado
          </Button>
        </div>
      </div>
    </Modal>
  );
}
