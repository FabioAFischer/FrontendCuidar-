import { useCallback, useEffect, useState } from "react";
import "./BcToast.css";

const TIPOS = {
  sucesso: {
    tituloPadrao: "Tudo certo",
    icone: "OK",
  },
  erro: {
    tituloPadrao: "Algo deu errado",
    icone: "!",
  },
  aviso: {
    tituloPadrao: "Atencao",
    icone: "i",
  },
  info: {
    tituloPadrao: "Informacao",
    icone: "i",
  },
};

export function useBcToast() {
  const [toast, setToast] = useState({
    aberto: false,
    tipo: "info",
    titulo: "",
    mensagem: "",
  });

  const mostrarToast = useCallback((tipo, titulo, mensagem) => {
    setToast({
      aberto: true,
      tipo,
      titulo,
      mensagem,
    });
  }, []);

  const fecharToast = useCallback(() => {
    setToast((atual) => ({ ...atual, aberto: false }));
  }, []);

  return {
    toastProps: {
      ...toast,
      onFechar: fecharToast,
    },
    mostrarToast,
    fecharToast,
  };
}

export default function BcToast({
  aberto = false,
  tipo = "info",
  titulo,
  mensagem,
  duracao = 5000,
  onFechar,
}) {
  useEffect(() => {
    if (!aberto || !onFechar || duracao <= 0) return undefined;

    const timeoutId = window.setTimeout(onFechar, duracao);
    return () => window.clearTimeout(timeoutId);
  }, [aberto, duracao, onFechar]);

  if (!aberto) return null;

  const tipoSeguro = TIPOS[tipo] ? tipo : "info";
  const config = TIPOS[tipoSeguro];

  return (
    <div
      className="bc-toast-region"
      role={tipoSeguro === "erro" ? "alert" : "status"}
      aria-live={tipoSeguro === "erro" ? "assertive" : "polite"}
    >
      <div className={`bc-toast bc-toast--${tipoSeguro}`}>
        <span className="bc-toast__icone" aria-hidden="true">
          {config.icone}
        </span>

        <div className="bc-toast__conteudo">
          <strong className="bc-toast__titulo">
            {titulo || config.tituloPadrao}
          </strong>
          {mensagem ? <p className="bc-toast__mensagem">{mensagem}</p> : null}
        </div>

        {onFechar ? (
          <button
            className="bc-toast__fechar"
            type="button"
            aria-label="Fechar aviso"
            onClick={onFechar}
          >
            x
          </button>
        ) : null}
      </div>
    </div>
  );
}
