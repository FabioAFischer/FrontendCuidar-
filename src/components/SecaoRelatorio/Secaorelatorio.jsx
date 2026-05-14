/**
 * SecaoRelatorio — Seção de relatório reutilizável do BomCuidado
 *
 * Props:
 *   titulo      : string                        — título da seção
 *   subtitulo   : string                        — descrição abaixo do título
 *   cards       : Array<{
 *                   icone    : ReactNode,        — ícone do card
 *                   titulo   : string,           — label do card
 *                   dados    : Array<{ status }> — lista de itens com campo status
 *                 }>
 *   onBaixar    : () => Promise<void>           — função chamada ao clicar no botão
 *   textoBotao? : string                        — texto do botão (default: "Baixar Relatório em PDF")
 */

import { useState } from "react";
import BcButton from "../Bcbutton/BcButton";
import "./Secaorelatorio.css";

const IconeDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

function contar(lista, status) {
  return lista.filter(i => i.status === status).length;
}

function CardResumo({ icone, titulo, dados = [] }) {
  const ativos   = contar(dados, "ATIVO");
  const inativos = contar(dados, "INATIVO");

  return (
    <div className="sr-card">
      <div className="sr-card__icone">{icone}</div>
      <div className="sr-card__info">
        <span className="sr-card__titulo">{titulo}</span>
        <span className="sr-card__total">{dados.length}</span>
        <div className="sr-card__detalhe">
          <span className="sr-card__ativo">↑ {ativos} ativos</span>
          <span className="sr-card__inativo">↓ {inativos} inativos</span>
        </div>
      </div>
    </div>
  );
}

export default function SecaoRelatorio({
  titulo     = "Relatório",
  subtitulo  = "",
  cards      = [],
  onBaixar,
  textoBotao = "Baixar Relatório em PDF",
}) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]             = useState("");
  const [gerado, setGerado]         = useState(false);

  async function handleBaixar() {
    if (!onBaixar) return;
    setErro("");
    setCarregando(true);
    try {
      await onBaixar();
      setGerado(true);
    } catch (err) {
      setErro(err.message || "Erro ao gerar relatório.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="sr-wrap">
      <div className="sr-cabecalho">
        <div>
          <h2 className="sr-titulo">{titulo}</h2>
          {subtitulo && <p className="sr-subtitulo">{subtitulo}</p>}
        </div>
      </div>

      {cards.length > 0 && (
        <div
          className="sr-cards"
          style={{ gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, 1fr)` }}
        >
          {cards.map((card, i) => (
            <CardResumo
              key={i}
              icone={card.icone}
              titulo={card.titulo}
              dados={card.dados}
            />
          ))}
        </div>
      )}

      {erro && <div className="sr-erro" role="alert">{erro}</div>}

      <BcButton onClick={handleBaixar} loading={carregando}>
        <IconeDownload />
        {carregando ? "Gerando relatório..." : textoBotao}
      </BcButton>
    </section>
  );
}