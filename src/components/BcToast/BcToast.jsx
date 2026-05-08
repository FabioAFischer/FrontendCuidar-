import { useEffect } from "react";
import "./BcToast.css";

const TIPOS = {
  sucesso: {
    tituloPadrao: "Tudo certo",
    icone: "✓",
  },
  erro: {
    tituloPadrao: "Algo deu errado",
    icone: "!",
  },
  aviso: {
    tituloPadrao: "Atenção",
    icone: "i",
  },
  info: {
    tituloPadrao: "Informação",
    icone: "i",
  },
};

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

  const config = TIPOS[tipo] || TIPOS.info;

  return (
    <div className="bc-toast-region" role="status" aria-live="polite">
      <div className={`bc-toast bc-toast--${tipo}`}>
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
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
