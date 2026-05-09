import { useEffect, useMemo, useState } from "react";
import BcButton from "../Bcbutton/BcButton";
import BcConfirmacao from "../BcConfirmacao/BcConfirmacao";
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

const IconeInativar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 8.5 7 7" />
  </svg>
);

const IconeMais = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconeSetaEsquerda = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const IconeSetaDireita = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="m9 18 6-6-6-6" />
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
  tituloConfirmacao = "Inativar registro?",
  mensagemConfirmacao = "O registro sera inativado na listagem.",
  textoConfirmar = "Sim, inativar",
  textoCarregandoExcluir = "Inativando...",
  excluindo = false,
  itensPorPagina = 10,
}) {
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const temAcoes = Boolean(onEditar || onExcluir);
  const totalPaginas = Math.max(1, Math.ceil(itens.length / itensPorPagina));

  const itensPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return itens.slice(inicio, inicio + itensPorPagina);
  }, [itens, itensPorPagina, paginaAtual]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, itensPorPagina]);

  useEffect(() => {
    setPaginaAtual((pagina) => Math.min(pagina, totalPaginas));
  }, [totalPaginas]);

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
                {itensPaginados.map((item) => (
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
                              className="bc-listagem-btnIcone bc-listagem-btnInativar"
                              title="Inativar"
                              type="button"
                              onClick={() => setItemParaExcluir(item)}
                            >
                              <IconeInativar />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
            {itens.length > itensPorPagina ? (
              <div className="bc-listagem-paginacao">
                <span className="bc-listagem-paginacaoInfo">
                  Pagina {paginaAtual} de {totalPaginas}
                </span>
                <div className="bc-listagem-paginacaoAcoes">
                  <button
                    className="bc-listagem-btnPagina"
                    type="button"
                    onClick={() => setPaginaAtual((pagina) => Math.max(1, pagina - 1))}
                    disabled={paginaAtual === 1}
                    aria-label="Pagina anterior"
                  >
                    <IconeSetaEsquerda />
                    Anterior
                  </button>
                  <button
                    className="bc-listagem-btnPagina"
                    type="button"
                    onClick={() => setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))}
                    disabled={paginaAtual === totalPaginas}
                    aria-label="Proxima pagina"
                  >
                    Proxima
                    <IconeSetaDireita />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <BcConfirmacao
        aberto={Boolean(itemParaExcluir)}
        titulo={tituloConfirmacao}
        mensagem={mensagemConfirmacao}
        textoConfirmar={textoConfirmar}
        textoCarregando={textoCarregandoExcluir}
        carregando={excluindo}
        icone={<IconeInativar />}
        onCancelar={() => setItemParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </>
  );
}
