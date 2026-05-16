/**
 * SecaoRelatorio — Seção de relatório reutilizável do BomCuidado
 *
 * Props:
 *   titulo      : string
 *   subtitulo   : string
 *   cards       : Array<{
 *                   icone    : ReactNode,
 *                   titulo   : string,
 *                   total    : number,
 *                   ativos   : number,
 *                   inativos : number,
 *                 }>
 *   onBaixar    : () => Promise<void>
 *   textoBotao? : string
 *   carregando? : boolean
 */

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

function CardResumo({ icone, titulo, total = 0, ativos = 0, inativos = 0 }) {
  return (
    <div className="sr-card">
      <div className="sr-card__icone">{icone}</div>
      <div className="sr-card__info">
        <span className="sr-card__titulo">{titulo}</span>
        <span className="sr-card__total">{total}</span>
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
  carregando = false,
  erro       = "",
  baixando   = false,
}) {
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
              total={card.total}
              ativos={card.ativos}
              inativos={card.inativos}
            />
          ))}
        </div>
      )}

      {carregando && (
        <p className="sr-carregando">Carregando dados...</p>
      )}

      {erro && <div className="sr-erro" role="alert">{erro}</div>}

      <BcButton onClick={onBaixar} loading={baixando} disabled={carregando}>
        <IconeDownload />
        {baixando ? "Gerando relatório..." : textoBotao}
      </BcButton>
    </section>
  );
}