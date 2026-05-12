import { createPortal } from "react-dom";
import "./BcConfirmacao.css";

const IconeAlerta = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export default function BcConfirmacao({
  aberto,
  titulo = "Confirmar acao?",
  mensagem = "Esta acao nao pode ser desfeita.",
  textoCancelar = "Cancelar",
  textoConfirmar = "Confirmar",
  textoCarregando = "Processando...",
  carregando = false,
  icone = <IconeAlerta />,
  onCancelar,
  onConfirmar,
}) {
  if (!aberto) return null;

  const conteudo = (
    <div className="bc-confirmacao-overlay" onClick={(evento) => evento.stopPropagation()}>
      <div className="bc-confirmacao" onClick={(evento) => evento.stopPropagation()}>
        <div className="bc-confirmacao__icone">{icone}</div>
        <h3>{titulo}</h3>
        <p>{mensagem}</p>
        <div className="bc-confirmacao__acoes">
          <button
            className="bc-confirmacao__cancelar"
            type="button"
            onClick={onCancelar}
          >
            {textoCancelar}
          </button>
          <button
            className="bc-confirmacao__confirmar"
            type="button"
            onClick={onConfirmar}
            disabled={carregando}
          >
            {carregando ? textoCarregando : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(conteudo, document.body);
}
