import BcButton from "../../../components/Bcbutton/BcButton";
import BcTopbar from "../../../components/BcTopbar/BcTopbar";
import { IconeSair, IconeVoltar } from "../../../components/icons/Icons";
import "./CuidadorRemediosPrescricao.css";

const remedios = [
  {
    nome: "Losartana 50mg",
    observacao: "Controle de pressao arterial. Manter acompanhamento diario.",
    resumo: "2 tomas hoje",
  },
  {
    nome: "Metformina 850mg",
    observacao: "Administrar junto das refeicoes principais.",
    resumo: "1 toma hoje",
  },
  {
    nome: "Vitamina D 2000 UI",
    observacao: "Suplementacao semanal conforme orientacao medica.",
    resumo: "Sem dose hoje",
  },
];

const idosos = [
  { nome: "Maria Silva", cpf: "123.456.789-00", telefone: "(11) 98765-4321", selecionado: true },
  { nome: "Joao Santos", cpf: "987.654.321-00", telefone: "(11) 91234-5678", selecionado: false },
];

const prescricoes = [
  {
    remedio: "Losartana 50mg",
    dosagem: "1 comprimido",
    intervalo: "12h",
    fim: "26/05/2026",
    etiqueta: "Jejum nao necessario",
    instrucao: "Oferecer com agua e aferir pressao antes da segunda dose.",
  },
  {
    remedio: "Metformina 850mg",
    dosagem: "1 comprimido",
    intervalo: "24h",
    fim: "30/05/2026",
    etiqueta: "Tomar apos o almoco",
    instrucao: "Evitar administrar com o estomago vazio.",
  },
];

const agenda = [
  { tipo: "REMEDIO", status: "AGENDADO", horario: "Hoje, 08:00", descricao: "Losartana 50mg" },
  { tipo: "REMEDIO", status: "AGENDADO", horario: "Hoje, 20:00", descricao: "Losartana 50mg" },
  { tipo: "CONSULTA", status: "REALIZADO", horario: "Ontem, 14:30", descricao: "Retorno cardiologista" },
];

function IconeRemedio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.24 4.24 0 0 0-6-6l-10 10a4.24 4.24 0 0 0 6 6Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}

function IconeUsuarios() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconeCalendario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconeMais() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconeEditar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function IconeLixeira() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function IconeCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function BotaoIcone({ children, tipo = "padrao", label }) {
  return (
    <button className={`cuidador-remedios-acao cuidador-remedios-acao--${tipo}`} type="button" title={label} aria-label={label}>
      {children}
    </button>
  );
}

function TituloSecao({ icone, children }) {
  return (
    <h2 className="cuidador-remedios-titulo">
      <span>{icone}</span>
      {children}
    </h2>
  );
}

export default function CuidadorRemediosPrescricao({ onBack, onLogout }) {
  return (
    <div className="cuidador-remedios-page">
      <BcTopbar
        title="Gerenciamento de Prescricoes"
        subtitle="Remedios, prescricoes e agenda"
        actionLabel="Sair"
        actionIcon={<IconeSair />}
        onAction={onLogout}
      />

      <main className="cuidador-remedios-main">
        <button className="cuidador-remedios-voltar" type="button" onClick={onBack}>
          <IconeVoltar />
          Voltar ao painel
        </button>

        <section className="cuidador-remedios-grid" aria-label="Remedios e prescricoes">
          <aside className="cuidador-remedios-card cuidador-remedios-card--fixo">
            <div className="cuidador-remedios-card__header">
              <TituloSecao icone={<IconeRemedio />}>Remedios ({remedios.length})</TituloSecao>
              <BotaoIcone label="Adicionar remedio"><IconeMais /></BotaoIcone>
            </div>

            <form className="cuidador-remedios-form">
              <div className="cuidador-remedios-form__topo">
                <h3>Novo Remedio</h3>
                <span>visual</span>
              </div>
              <label>
                Nome *
                <input value="Dipirona 500mg" readOnly />
              </label>
              <label>
                Observacao
                <textarea value="Administrar apenas em caso de febre ou dor." readOnly />
              </label>
              <BcButton fullWidth={true}>Cadastrar</BcButton>
            </form>

            <div className="cuidador-remedios-lista">
              {remedios.map((remedio) => (
                <article className="cuidador-remedios-item" key={remedio.nome}>
                  <div>
                    <h3>{remedio.nome}</h3>
                    <p>{remedio.observacao}</p>
                    <small>{remedio.resumo}</small>
                  </div>
                  <div className="cuidador-remedios-item__acoes">
                    <BotaoIcone label="Editar remedio"><IconeEditar /></BotaoIcone>
                    <BotaoIcone tipo="perigo" label="Excluir remedio"><IconeLixeira /></BotaoIcone>
                  </div>
                </article>
              ))}
            </div>
          </aside>

          <section className="cuidador-remedios-centro">
            <div className="cuidador-remedios-card">
              <div className="cuidador-remedios-card__header">
                <TituloSecao icone={<IconeUsuarios />}>Selecione um Idoso</TituloSecao>
              </div>

              <div className="cuidador-remedios-idosos">
                {idosos.map((idoso) => (
                  <button
                    className={`cuidador-remedios-idoso ${idoso.selecionado ? "cuidador-remedios-idoso--selecionado" : ""}`}
                    type="button"
                    key={idoso.cpf}
                  >
                    <strong>{idoso.nome}</strong>
                    <span>CPF: {idoso.cpf}</span>
                    <span>{idoso.telefone}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="cuidador-remedios-card">
              <div className="cuidador-remedios-card__header">
                <TituloSecao icone={<IconeRemedio />}>Prescricoes de Maria Silva</TituloSecao>
                <button className="cuidador-remedios-prescrever" type="button">
                  <IconeMais />
                  Prescrever
                </button>
              </div>

              <form className="cuidador-remedios-prescricao-form">
                <div className="cuidador-remedios-form__topo cuidador-remedios-campo--inteiro">
                  <h3>Nova Prescricao</h3>
                  <span>modelo visual</span>
                </div>
                <label className="cuidador-remedios-campo--inteiro">
                  Remedio *
                  <select defaultValue="Losartana 50mg">
                    <option>Losartana 50mg</option>
                  </select>
                </label>
                <label>
                  Dosagem *
                  <input value="1 comprimido" readOnly />
                </label>
                <label>
                  Intervalo (horas) *
                  <input value="12" readOnly />
                </label>
                <label>
                  Data Fim *
                  <input value="2026-05-26" readOnly />
                </label>
                <label className="cuidador-remedios-checkbox">
                  <input type="checkbox" defaultChecked readOnly />
                  Necessario jejum
                </label>
                <label className="cuidador-remedios-campo--inteiro">
                  Instrucao
                  <textarea value="Oferecer com agua. Registrar qualquer efeito adverso observado." readOnly />
                </label>
                <div className="cuidador-remedios-campo--inteiro">
                  <BcButton fullWidth={true}>Prescrever</BcButton>
                </div>
              </form>

              <div className="cuidador-remedios-lista">
                {prescricoes.map((prescricao) => (
                  <article className="cuidador-remedios-prescricao" key={prescricao.remedio}>
                    <div>
                      <h3>{prescricao.remedio}</h3>
                      <dl>
                        <div>
                          <dt>Dosagem</dt>
                          <dd>{prescricao.dosagem}</dd>
                        </div>
                        <div>
                          <dt>Intervalo</dt>
                          <dd>{prescricao.intervalo}</dd>
                        </div>
                        <div>
                          <dt>Fim</dt>
                          <dd>{prescricao.fim}</dd>
                        </div>
                      </dl>
                      <span>{prescricao.etiqueta}</span>
                      <p>{prescricao.instrucao}</p>
                    </div>
                    <div className="cuidador-remedios-item__acoes">
                      <BotaoIcone label="Editar prescricao"><IconeEditar /></BotaoIcone>
                      <BotaoIcone tipo="perigo" label="Remover prescricao"><IconeLixeira /></BotaoIcone>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <aside className="cuidador-remedios-card cuidador-remedios-card--fixo">
            <div className="cuidador-remedios-card__header">
              <TituloSecao icone={<IconeCalendario />}>Agenda</TituloSecao>
              <BotaoIcone label="Adicionar evento"><IconeMais /></BotaoIcone>
            </div>

            <p className="cuidador-remedios-agenda-paciente">Maria Silva</p>

            <form className="cuidador-remedios-form">
              <div className="cuidador-remedios-form__topo">
                <h3>Novo Evento</h3>
                <span>preenchido</span>
              </div>
              <label>
                Tipo *
                  <select defaultValue="REMEDIO">
                  <option>REMEDIO</option>
                </select>
              </label>
              <label>
                Remedio
                  <select defaultValue="Losartana 50mg">
                  <option>Losartana 50mg</option>
                </select>
              </label>
              <label>
                Data *
                <input value="2026-05-11T20:00" readOnly />
              </label>
              <BcButton fullWidth={true}>Adicionar</BcButton>
            </form>

            <div className="cuidador-remedios-lista">
              {agenda.map((evento) => (
                <article className={`cuidador-remedios-agenda ${evento.status === "REALIZADO" ? "cuidador-remedios-agenda--realizado" : ""}`} key={`${evento.horario}-${evento.descricao}`}>
                  <div>
                    <div className="cuidador-remedios-agenda__badges">
                      <span>{evento.tipo}</span>
                      <span>{evento.status}</span>
                    </div>
                    <time>{evento.horario}</time>
                    <p>{evento.descricao}</p>
                  </div>
                  <div className="cuidador-remedios-item__acoes">
                    {evento.status === "AGENDADO" ? (
                      <BotaoIcone tipo="sucesso" label="Marcar como realizado"><IconeCheck /></BotaoIcone>
                    ) : null}
                    <BotaoIcone label="Editar evento"><IconeEditar /></BotaoIcone>
                    <BotaoIcone tipo="perigo" label="Excluir evento"><IconeLixeira /></BotaoIcone>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
