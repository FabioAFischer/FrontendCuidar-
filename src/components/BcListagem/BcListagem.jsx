import { useEffect, useMemo, useState } from "react";
import BcButton from "../Bcbutton/BcButton";
import BcConfirmacao from "../BcConfirmacao/BcConfirmacao";
import {
  IconeBusca,
  IconeEditar,
  IconeInativar,
  IconeMais,
  IconeSetaDireita,
  IconeSetaEsquerda,
  IconeVisualizar,
} from "../icons/Icons";
import "./BcListagem.css";

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
  onVisualizar,
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
  const temAcoes = Boolean(onVisualizar || onEditar || onExcluir);
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
                  {temAcoes ? (
                    <th className="bc-listagem-thAcoes">
                      <span className="bc-listagem-acoesCabecalho">Acoes</span>
                    </th>
                  ) : null}
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
                      <td className="bc-listagem-tdAcoes">
                        <div className="bc-listagem-acoes">
                          {onVisualizar ? (
                            <button
                              className="bc-listagem-btnIcone bc-listagem-btnVisualizar"
                              title="Visualizar"
                              type="button"
                              onClick={() => onVisualizar(item)}
                            >
                              <IconeVisualizar />
                            </button>
                          ) : null}
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
