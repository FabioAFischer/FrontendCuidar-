import { createPortal } from "react-dom";
import { IconeAlerta } from "../icones/Icones";
import "./BcConfirmacao.css";

export default function BcConfirmacao({
  aberto,
  titulo = "Confirmar ação?",
  mensagem = "Esta ação não pode ser desfeita.",
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
