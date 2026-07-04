import { useEffect, useMemo, useState } from "react";
import BcBotao from "../BcBotao/BcBotao";
import BcConfirmacao from "../BcConfirmacao/BcConfirmacao";
import {
  IconeBusca,
  IconeEditar,
  IconeInativar,
  IconeMais,
  IconeSetaDireita,
  IconeSetaEsquerda,
  IconeVisualizar,
} from "../icones/Icones";
import "./BcListagem.css";

/* IconeAtivar não está em Icons.jsx, então fica local */
const IconeAtivar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 6 9 17l-5-5" />
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
  filtrosToolbar,
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
  mensagemConfirmacao = "O registro será inativado na listagem.",
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

  async function aoConfirmarExclusao() {
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

        {filtrosToolbar}

        {textoBotao && onBotaoClick ? (
          <BcBotao onClick={onBotaoClick} fullWidth={false}>
            <IconeMais /> {textoBotao}
          </BcBotao>
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
                      <span className="bc-listagem-acoesCabecalho">Ações</span>
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
                              title="Visualizar" type="button"
                              onClick={() => onVisualizar(item)}
                            >
                              <IconeVisualizar />
                            </button>
                          ) : null}
                          {onEditar ? (
                            <button
                              className="bc-listagem-btnIcone bc-listagem-btnEditar"
                              title="Editar" type="button"
                              onClick={() => onEditar(item)}
                            >
                              <IconeEditar />
                            </button>
                          ) : null}
                          {onExcluir ? (
                            <button
                              className={`bc-listagem-btnIcone ${
                                item.status === "ATIVO"
                                  ? "bc-listagem-btnInativar"
                                  : "bc-listagem-btnAtivar"
                              }`}
                              title={item.status === "ATIVO" ? "Inativar" : "Ativar"}
                              type="button"
                              onClick={() => setItemParaExcluir(item)}
                            >
                              {item.status === "ATIVO" ? <IconeInativar /> : <IconeAtivar />}
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
                  Página {paginaAtual} de {totalPaginas}
                </span>
                <div className="bc-listagem-paginacaoAcoes">
                  <button
                    className="bc-listagem-btnPagina" type="button"
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    aria-label="Página anterior"
                  >
                    <IconeSetaEsquerda /> Anterior
                  </button>
                  <button
                    className="bc-listagem-btnPagina" type="button"
                    onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    aria-label="Próxima página"
                  >
                    Próxima <IconeSetaDireita />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <BcConfirmacao
        aberto={Boolean(itemParaExcluir)}
        titulo={itemParaExcluir?.status === "ATIVO" ? tituloConfirmacao : "Ativar registro?"}
        mensagem={itemParaExcluir?.status === "ATIVO" ? mensagemConfirmacao : "O registro será reativado."}
        textoConfirmar={itemParaExcluir?.status === "ATIVO" ? textoConfirmar : "Sim, ativar"}
        textoCarregando={itemParaExcluir?.status === "ATIVO" ? textoCarregandoExcluir : "Ativando..."}
        carregando={excluindo}
        icone={itemParaExcluir?.status === "ATIVO" ? <IconeInativar /> : <IconeAtivar />}
        onCancelar={() => setItemParaExcluir(null)}
        onConfirmar={aoConfirmarExclusao}
      />
    </>
  );
}
