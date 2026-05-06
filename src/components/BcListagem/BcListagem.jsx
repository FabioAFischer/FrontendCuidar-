import { useState } from "react";
import BcButton from "../Bcbutton/BcButton";
import "./BcListagem.css";

const IconeBusca = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const IconeEditar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconeLixeira = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconeMais = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function BcListagem({
  titulo,
  iconeTitulo,
  itens = [],
  colunas = [],
  chaveLinha = (item) => item.id,
  busca = "",
  placeholderBusca = "Buscar...",
  onBuscaChange,
  textoBotao,
  onBotaoClick,
  textoVazio = "Nenhum registro encontrado.",
  carregando = false,
  textoCarregando = "Carregando...",
  erro = "",
  onEditar,
  onExcluir,
  tituloConfirmacao = "Excluir registro?",
  mensagemConfirmacao = "Esta acao nao pode ser desfeita.",
  textoConfirmar = "Sim, excluir",
  textoCarregandoExcluir = "Excluindo...",
  excluindo = false,
}) {
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const temAcoes = Boolean(onEditar || onExcluir);

  async function confirmarExclusao() {
    if (!itemParaExcluir || !onExcluir) return;

    await onExcluir(itemParaExcluir);
    setItemParaExcluir(null);
  }

  return (
    <>
      <div className="bc-listagem-toolbar">
        <div className="bc-listagem-buscaWrap">
          <span className="bc-listagem-buscaIcone"><IconeBusca /></span>
          <input
            className="bc-listagem-busca"
            type="text"
            placeholder={placeholderBusca}
            value={busca}
            onChange={(evento) => onBuscaChange?.(evento.target.value)}
          />
        </div>

        {textoBotao && onBotaoClick ? (
          <BcButton onClick={onBotaoClick} fullWidth={false}>
            <IconeMais /> {textoBotao}
          </BcButton>
        ) : null}
      </div>

      <div className="bc-listagem-card">
        <div className="bc-listagem-header">
          <span className="bc-listagem-titulo">
            {iconeTitulo}
            {titulo}
            <span className="bc-listagem-badge">{itens.length}</span>
          </span>
        </div>

        {erro ? <div className="bc-listagem-erro" role="alert">{erro}</div> : null}

        {carregando ? (
          <div className="bc-listagem-vazio">
            <div className="bc-listagem-vazioIcone">{iconeTitulo}</div>
            <p>{textoCarregando}</p>
          </div>
        ) : itens.length === 0 ? (
          <div className="bc-listagem-vazio">
            <div className="bc-listagem-vazioIcone">{iconeTitulo}</div>
            <p>{textoVazio}</p>
          </div>
        ) : (
          <div className="bc-listagem-tabelaWrap">
            <table className="bc-listagem-tabela">
              <thead>
                <tr>
                  {colunas.map((coluna) => (
                    <th key={coluna.chave}>{coluna.titulo}</th>
                  ))}
                  {temAcoes ? <th className="bc-listagem-thAcoes">Acoes</th> : null}
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={chaveLinha(item)}>
                    {colunas.map((coluna) => (
                      <td key={coluna.chave} className={coluna.className || ""}>
                        {coluna.render ? coluna.render(item) : item[coluna.chave]}
                      </td>
                    ))}
                    {temAcoes ? (
                      <td>
                        <div className="bc-listagem-acoes">
                          {onEditar ? (
                            <button
                              className="bc-listagem-btnIcone bc-listagem-btnEditar"
                              title="Editar"
                              type="button"
                              onClick={() => onEditar(item)}
                            >
                              <IconeEditar />
                            </button>
                          ) : null}
                          {onExcluir ? (
                            <button
                              className="bc-listagem-btnIcone bc-listagem-btnExcluir"
                              title="Excluir"
                              type="button"
                              onClick={() => setItemParaExcluir(item)}
                            >
                              <IconeLixeira />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {itemParaExcluir ? (
        <div className="bc-listagem-confirmOverlay" onClick={() => setItemParaExcluir(null)}>
          <div className="bc-listagem-confirm" onClick={(evento) => evento.stopPropagation()}>
            <div className="bc-listagem-confirmIcone"><IconeLixeira /></div>
            <h3>{tituloConfirmacao}</h3>
            <p>{mensagemConfirmacao}</p>
            <div className="bc-listagem-confirmAcoes">
              <button
                className="bc-listagem-confirmCancelar"
                type="button"
                onClick={() => setItemParaExcluir(null)}
              >
                Cancelar
              </button>
              <button
                className="bc-listagem-confirmConfirmar"
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindo}
              >
                {excluindo ? textoCarregandoExcluir : textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
