import { useEffect, useMemo, useState } from "react";
import BcButton from "../../../components/Bcbutton/BcButton";
import BcTopbar from "../../../components/BcTopbar/BcTopbar";
import {
  IconeCalendario,
  IconeIdosos,
  IconePerfil,
  IconeRemedio,
  IconeSair,
  IconeSetaDireita,
  IconeTelefone,
} from "../../../components/icons/Icons";
import { listarIdososDoCuidador } from "../../../api/instituicaoApi";
import "./CuidadorDashboard.css";

const CONTATOS_EMERGENCIA = [
  { nome: "SAMU", telefone: "192", destaque: "vermelho" },
  { nome: "Bombeiros", telefone: "193", destaque: "vermelho" },
  { nome: "Policia", telefone: "190", destaque: "azul" },
];


function formatarCPF(valor = "") {
  const numeros = String(valor).replace(/\D/g, "").slice(0, 11);
  return numeros
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefone(idoso) {
  const contato = idoso?.contato || {};
  const ddd = contato.ddd || idoso?.ddd;
  const telefone = contato.telefone || idoso?.telefone;

  if (!telefone) return "Nao informado";

  const numero = String(telefone).replace(/\D/g, "");
  const telefoneFormatado = numero.length > 8
    ? numero.replace(/(\d{5})(\d{4})$/, "$1-$2")
    : numero.replace(/(\d{4})(\d{4})$/, "$1-$2");

  return ddd ? `(${ddd}) ${telefoneFormatado}` : telefoneFormatado;
}

function getNomeCuidador() {
  return localStorage.getItem("usuarioNome") || sessionStorage.getItem("usuarioNome") || "Cuidador";
}

function isEventoProximo(dataAgendada) {
  const data = new Date(dataAgendada);
  const diferencaHoras = (data.getTime() - Date.now()) / (1000 * 60 * 60);
  return diferencaHoras >= 0 && diferencaHoras <= 24;
}

function QuickActionCard({ icon, title, description, onClick }) {
  return (
    <button type="button" className="cuidador-action-card" onClick={onClick}>
      <span className="cuidador-action-card__icon">{icon}</span>
      <span className="cuidador-action-card__text">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="cuidador-action-card__arrow"><IconeSetaDireita /></span>
    </button>
  );
}

function PatientCard({ idoso }) {
  const inicial = String(idoso.nome || "?").charAt(0).toUpperCase();

  return (
    <article className="cuidador-card cuidador-patient-card">
      <span className="cuidador-patient-card__avatar">{inicial}</span>
      <div className="cuidador-patient-card__content">
        <h3>{idoso.nome || "Idoso sem nome"}</h3>
        <p>CPF: {formatarCPF(idoso.cpf) || "Nao informado"}</p>
        <p>Tel: {formatarTelefone(idoso)}</p>
      </div>
    </article>
  );
}

function AgendaEventCard({ event }) {
  const data = new Date(event.dataAgendada);
  const proximo = isEventoProximo(event.dataAgendada);
  const tipo = String(event.tipo || "OUTRO").toUpperCase();
  const isMedicacao = tipo === "REMEDIO" || tipo === "MEDICACAO";

  return (
    <article className={`cuidador-agenda-card ${proximo ? "cuidador-agenda-card--soon" : ""}`}>
      <span className={`cuidador-agenda-card__icon cuidador-agenda-card__icon--${isMedicacao ? "medicacao" : "agenda"}`}>
        {isMedicacao ? <IconeRemedio /> : <IconeCalendario />}
      </span>
      <div className="cuidador-agenda-card__content">
        <div className="cuidador-agenda-card__badges">
          <span>{isMedicacao ? "Remedio" : tipo === "CONSULTA" ? "Consulta" : tipo === "EXAME" ? "Exame" : "Agenda"}</span>
          {proximo && <span className="cuidador-agenda-card__soon">Proximo</span>}
        </div>
        <h3>{event.idosoNome || "Idoso nao identificado"}</h3>
        {event.descricao && <p>{event.descricao}</p>}
        <small>{event.status || "Pendente"}</small>
      </div>
      <time className="cuidador-agenda-card__date" dateTime={event.dataAgendada}>
        <strong>{data.toLocaleDateString("pt-BR")}</strong>
        <span>{data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
      </time>
    </article>
  );
}

function PaginationControls({ currentPage, totalPages, onPrevious, onNext }) {
  if (totalPages <= 1) return null;

  return (
    <div className="cuidador-pagination">
      <p>Pagina {currentPage} de {totalPages}</p>
      <div>
        <button type="button" onClick={onPrevious} disabled={currentPage === 1}>Anterior</button>
        <button type="button" onClick={onNext} disabled={currentPage === totalPages}>Proxima</button>
      </div>
    </div>
  );
}

function DailySummary({ totalAgendas, totalIdosos }) {
  return (
    <section className="cuidador-card cuidador-summary" aria-labelledby="resumo-dia">
      <h2 id="resumo-dia">Resumo do Dia</h2>
      <dl>
        <div>
          <dt>Agendas Pendentes</dt>
          <dd className="cuidador-summary__alert">{totalAgendas}</dd>
        </div>
        <div>
          <dt>Idosos Cadastrados</dt>
          <dd>{totalIdosos}</dd>
        </div>
      </dl>
    </section>
  );
}

function EmergencyContacts() {
  return (
    <section className="cuidador-card cuidador-emergency" aria-labelledby="contatos-emergencia">
      <h2 id="contatos-emergencia">Contatos de Emergencia</h2>
      <div className="cuidador-emergency__list">
        {CONTATOS_EMERGENCIA.map((contato) => (
          <div className="cuidador-emergency__item" key={contato.telefone}>
            <span className={`cuidador-emergency__icon cuidador-emergency__icon--${contato.destaque}`}>
              <IconeTelefone />
            </span>
            <span>
              <strong>{contato.nome}</strong>
              <small>{contato.telefone}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CuidadorDashboard({ onLogout, onOpenConsultas, onOpenRemedios, onOpenIdososVinculados }) {
  const [nomeCuidador, setNomeCuidador] = useState(getNomeCuidador);
  const [idosos, setIdosos] = useState([]);
  const [agendaEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(agendaEvents.length / itemsPerPage);
  const currentEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return agendaEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [agendaEvents, currentPage]);

  useEffect(() => {
    setNomeCuidador(getNomeCuidador());

    listarIdososDoCuidador()
      .then((lista) => {
        if (Array.isArray(lista) && lista.length > 0) {
          setIdosos(lista);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <div className="cuidador-page">
      <BcTopbar
        title="Painel do Cuidador"
        subtitle="Acompanhamento de idosos e agenda"
        actionLabel="Sair"
        actionIcon={<IconeSair />}
        onAction={onLogout}
      />

      <main className="cuidador-main">
        <section className="cuidador-welcome">
          <div>
            <span className="cuidador-welcome__eyebrow">BomCuidado</span>
            <h1>Ola, {nomeCuidador}!</h1>
            <p>Bem-vindo ao seu painel de gerenciamento.</p>
          </div>
          <BcButton variant="ghost" fullWidth={false}>
            <IconePerfil />
            Meu Perfil
          </BcButton>
        </section>

        <section className="cuidador-actions" aria-label="Acoes rapidas">
          <QuickActionCard
            title="Medicacoes"
            description="Gerenciar medicacoes dos pacientes"
            icon={<IconeRemedio />}
            onClick={onOpenRemedios}
          />
          <QuickActionCard
            title="Consultas"
            description="Cadastrar e ver consultas agendadas"
            icon={<IconeCalendario />}
            onClick={onOpenConsultas}
          />
        </section>

        <section className="cuidador-section" aria-labelledby="idosos-titulo">
          <div className="cuidador-section__header">
            <div>
              <h2 id="idosos-titulo">Idosos</h2>
              <p>Pacientes vinculados ao seu acompanhamento.</p>
            </div>
            <button type="button" className="cuidador-outline-button" onClick={onOpenIdososVinculados}>
              <IconeIdosos />
              Ver Todos
            </button>
          </div>

          {idosos.length > 0 ? (
            <div className="cuidador-patient-grid">
              {idosos.slice(0, 4).map((idoso) => (
                <PatientCard key={idoso.id || idoso.cpf || idoso.nome} idoso={idoso} />
              ))}
            </div>
          ) : (
            <div className="cuidador-empty">
              <span><IconeIdosos /></span>
              <p>Nenhum idoso cadastrado ainda.</p>
              <small>Os idosos cadastrados pela instituicao aparecerao aqui.</small>
            </div>
          )}
        </section>

        <section className="cuidador-section" aria-labelledby="agendas-titulo">
          <div className="cuidador-section__header cuidador-section__header--compact">
            <div>
              <h2 id="agendas-titulo">Agendas Pendentes</h2>
              <p>Compromissos e lembretes que precisam de atencao.</p>
            </div>
            {agendaEvents.length > 0 && <span className="cuidador-badge">{agendaEvents.length}</span>}
          </div>

          {agendaEvents.length > 0 ? (
            <>
              <div className="cuidador-agenda-list">
                {currentEvents.map((event) => (
                  <AgendaEventCard key={event.id} event={event} />
                ))}
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevious={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                onNext={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              />
            </>
          ) : (
            <div className="cuidador-empty">
              <p>Nenhuma agenda pendente no momento.</p>
            </div>
          )}
        </section>

        <div className="cuidador-bottom-grid">
          <DailySummary totalAgendas={agendaEvents.length} totalIdosos={idosos.length} />
          <EmergencyContacts />
        </div>
      </main>
    </div>
  );
}
