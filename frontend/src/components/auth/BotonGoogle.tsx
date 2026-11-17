import { useEffect, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";

export interface DatosCuentaGoogle {
  credential: string;
  email: string;
  nombre?: string;
}

interface GoogleJwtPayload {
  email?: string;
  name?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: string;
      size?: string;
      text?: string;
      shape?: string;
      width?: number;
      locale?: string;
    }
  ) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

export interface BotonGoogleProps {
  texto?: "signin_with" | "signup_with" | "continue_with";
  etiquetaFallback?: string;
  onSuccess: (datos: DatosCuentaGoogle) => void;
  onError?: (mensaje: string) => void;
}

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export function BotonGoogle({
  texto = "continue_with",
  etiquetaFallback = "Continuar con Google",
  onSuccess,
  onError,
}: BotonGoogleProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [scriptListo, setScriptListo] = useState(false);
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? "";

  useEffect(() => {
    if (!clientId) return;

    const existente = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existente) {
      if (window.google?.accounts?.id) {
        setScriptListo(true);
      } else {
        existente.addEventListener("load", () => setScriptListo(true), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptListo(true);
    script.onerror = () => onError?.("No se pudo cargar el servicio de autenticación de Google.");
    document.head.appendChild(script);
  }, [clientId, onError]);

  useEffect(() => {
    if (!clientId || !scriptListo || !contenedorRef.current || !window.google?.accounts?.id) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (!response.credential) {
          onError?.("No se recibió la credencial de Google.");
          return;
        }
        try {
          const decoded = jwtDecode<GoogleJwtPayload>(response.credential);
          onSuccess({
            credential: response.credential,
            email: decoded.email ?? "",
            nombre: decoded.name,
          });
        } catch {
          onSuccess({
            credential: response.credential,
            email: "",
          });
        }
      },
    });

    contenedorRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(contenedorRef.current, {
      theme: "filled_black",
      size: "large",
      text: texto,
      shape: "rectangular",
      width: 340,
      locale: "es",
    });
  }, [clientId, scriptListo, texto, onSuccess, onError]);

  if (clientId) {
    return (
      <div className="flex w-full justify-center">
        <div ref={contenedorRef} className="min-h-[44px]" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        onError?.(
          "Configura VITE_GOOGLE_CLIENT_ID en frontend/.env y GOOGLE_CLIENT_ID en backend/.env para activar el inicio con Google."
        )
      }
      className="inline-flex min-h-[var(--alto-control)] w-full cursor-pointer items-center justify-center gap-[var(--espacio-12)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] px-[var(--espacio-20)] py-[var(--espacio-12)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] font-medium text-[color:var(--tinta)] transition-colors duration-[var(--duracion-hover)] hover:border-[color:var(--riel)]"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
        />
      </svg>
      <span>{etiquetaFallback}</span>
    </button>
  );
}

