import { useEffect, useMemo, useState } from "react";
import BcBotao from "../../../components/BcBotao/BcBotao";
import BcConfirmacao from "../../../components/BcConfirmacao/BcConfirmacao";
import BcFormularioModal, { BcFormularioModalAreaTexto } from "../../../components/BcFormularioModal/BcFormularioModal";
import BcCampoTexto from "../../../components/BcCampoTexto/BcCampoTexto";
import BcModal from "../../../components/BcModal/BcModal";
import BcNotificacao, { useBcNotificacao } from "../../../components/BcNotificacao/BcNotificacao";
import BcBarraSuperior from "../../../components/BcBarraSuperior/BcBarraSuperior";
import { IconeSair, IconeVoltar } from "../../../components/icones/Icones";
import { listarIdososDoCuidador } from "../../../api/instituicaoApi";
import { atualizarAlerta, cadastrarAlerta, cancelarAlerta } from "../../../api/alertaApi";
import "./ConsultasCuidador.css";

const STORAGE_KEY = "bomcuidado_consultas_cuidador";

const TIPOS_ALERTA = [
  { value: "CONSULTA", label: "Consulta" },
  { value: "EXAME", label: "Exame" },
  { value: "OUTRO", label: "Outro" },
];

const STATUS = {
  pendente: { label: "Pendente", classe: "pendente" },
  confirmada: { label: "Confirmada", classe: "confirmada" },
  realizada: { label: "Realizada", classe: "realizada" },
  cancelada: { label: "Cancelada", classe: "cancelada" },
};

function IconeCalendario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconeRelogio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function IconeMedico() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4M16 2v4" />
      <path d="M5 6h14v4a7 7 0 0 1-14 0V6Z" />
      <path d="M12 17v5M9 22h6" />
    </svg>
  );
}

function IconeLocal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconeBusca() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconeMais() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
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

function IconeVisualizar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
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

function IconeSino() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function formatarCpf(valor = "") {
  const numeros = String(valor).replace(/\D/g, "").slice(0, 11);
  return numeros
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarData(valor) {
  if (!valor) return "-";
  const [ano, mes, dia] = String(valor).split("-");
  if (!ano || !mes || !dia) return "-";
  return `${dia}/${mes}/${ano}`;
}

function criarDataConsulta(consulta) {
  return new Date(`${consulta.data}T${consulta.hora || "00:00"}`);
}

function BotaoIcone({ children, label, tipo = "padrao", onClick }) {
  return (
    <button
      className={`cuidador-consultas-acao cuidador-consultas-acao--${tipo}`}
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function CartaoEstatistica({ label, valor, tipo }) {
  return (
    <article className={`cuidador-consultas-stat cuidador-consultas-stat--${tipo}`}>
      <span>{label}</span>
      <strong>{valor}</strong>
    </article>
  );
}

function CartaoConsulta({ consulta, onVisualizar, onEditar, onExcluir, onLembrete }) {
  const status = STATUS[consulta.status] || STATUS.pendente;
  const futura = criarDataConsulta(consulta).getTime() > Date.now();

  return (
    <article className="cuidador-consultas-card">
      <div className="cuidador-consultas-card__avatar">
        {String(consulta.idosoNome || "?").charAt(0).toUpperCase()}
      </div>

      <div className="cuidador-consultas-card__conteudo">
        <div className="cuidador-consultas-card__topo">
          <div>
            <h3>{consulta.idosoNome}</h3>
            <p>CPF: {formatarCpf(consulta.idosoCpf) || "Nao informado"}</p>
          </div>
          <span className={`cuidador-consultas-status cuidador-consultas-status--${status.classe}`}>
            {status.label}
          </span>
        </div>

        <div className="cuidador-consultas-card__infos">
          <span><IconeCalendario /> {formatarData(consulta.data)}</span>
          <span><IconeRelogio /> {consulta.hora || "-"}</span>
          <span><IconeMedico /> {consulta.medico} - {consulta.especialidade}</span>
          <span><IconeLocal /> {consulta.local}</span>
        </div>

        {consulta.lembreteEnviado ? (
          <span className="cuidador-consultas-lembrete"><IconeSino /> Lembrete enviado</span>
        ) : null}
      </div>

      <div className="cuidador-consultas-card__acoes">
        {futura && !consulta.lembreteEnviado ? (
          <BotaoIcone label="Enviar lembrete" tipo="lembrete" onClick={() => onLembrete(consulta)}>
            <IconeSino />
          </BotaoIcone>
        ) : null}
        <BotaoIcone label="Visualizar consulta" onClick={() => onVisualizar(consulta)}>
          <IconeVisualizar />
        </BotaoIcone>
        <BotaoIcone label="Editar consulta" onClick={() => onEditar(consulta)}>
          <IconeEditar />
        </BotaoIcone>
        <BotaoIcone label="Excluir consulta" tipo="perigo" onClick={() => onExcluir(consulta)}>
          <IconeLixeira />
        </BotaoIcone>
      </div>
    </article>
  );
}

const formInicial = {
  idosoId: "",
  data: "",
  hora: "",
  tipoAlerta: "CONSULTA",
  medico: "",
  especialidade: "",
  local: "",
  observacoes: "",
  status: "pendente",
};

export default function ConsultasCuidador({ onBack, onLogout }) {
  const { toastProps, mostrarToast } = useBcNotificacao();
  const [idosos, setIdosos] = useState([]);
  const [consultas, setConsultas] = useState(() => {
    try {
      const salvas = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(salvas) ? salvas : [];
    } catch {
      return [];
    }
  });
  const [carregandoIdosos, setCarregandoIdosos] = useState(true);
  const [erroIdosos, setErroIdosos] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [idosoFiltro, setIdosoFiltro] = useState("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [consultaEmEdicao, setConsultaEmEdicao] = useState(null);
  const [consultaEmVisualizacao, setConsultaEmVisualizacao] = useState(null);
  const [consultaParaExcluir, setConsultaParaExcluir] = useState(null);
  const [erroFormulario, setErroFormulario] = useState("");
  const [salvandoConsulta, setSalvandoConsulta] = useState(false);
  const [form, setForm] = useState(formInicial);

  useEffect(() => {
    carregarIdosos();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consultas));
  }, [consultas]);

  async function carregarIdosos() {
    try {
      setCarregandoIdosos(true);
      setErroIdosos("");
      const lista = await listarIdososDoCuidador();
      setIdosos(Array.isArray(lista) ? lista : []);
    } catch (erro) {
      setErroIdosos(erro.message);
      setIdosos([]);
    } finally {
      setCarregandoIdosos(false);
    }
  }

  const consultasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return consultas
      .filter((consulta) => {
        const texto = [
          consulta.idosoNome,
          consulta.medico,
          consulta.especialidade,
          consulta.local,
        ].join(" ").toLowerCase();

        const bateBusca = !termo || texto.includes(termo);
        const bateStatus = statusFiltro === "todos" || consulta.status === statusFiltro;
        const bateIdoso = idosoFiltro === "todos" || Number(consulta.idosoId) === Number(idosoFiltro);

        return bateBusca && bateStatus && bateIdoso;
      })
      .sort((a, b) => criarDataConsulta(a).getTime() - criarDataConsulta(b).getTime());
  }, [busca, consultas, idosoFiltro, statusFiltro]);

  const proximas = consultas.filter((consulta) =>
    criarDataConsulta(consulta).getTime() > Date.now() && consulta.status !== "cancelada"
  );

  function abrirCadastro() {
    setConsultaEmEdicao(null);
    setErroFormulario("");
    setForm({ ...formInicial, idosoId: idosos[0]?.id ? String(idosos[0].id) : "" });
    setModalAberto(true);
  }

  function abrirEdicao(consulta) {
    setConsultaEmEdicao(consulta);
    setErroFormulario("");
    setForm({
      idosoId: String(consulta.idosoId || ""),
      data: consulta.data || "",
      hora: consulta.hora || "",
      tipoAlerta: consulta.tipoAlerta || "CONSULTA",
      medico: consulta.medico || "",
      especialidade: consulta.especialidade || "",
      local: consulta.local || "",
      observacoes: consulta.observacoes || "",
      status: consulta.status || "pendente",
    });
    setModalAberto(true);
  }

  function fecharFormulario() {
    setModalAberto(false);
    setConsultaEmEdicao(null);
    setErroFormulario("");
    setForm(formInicial);
  }

  function aoAlterarFormularioConsulta(evento) {
    const { name, value } = evento.target;
    setForm((anterior) => ({ ...anterior, [name]: value }));
  }

  function validarFormulario() {
    if (!form.idosoId) return "Selecione um idoso.";
    if (!form.data) return "Informe a data da consulta.";
    if (!form.hora) return "Informe o horario da consulta.";
    if (!form.tipoAlerta) return "Selecione o tipo do alerta.";
    if (!form.medico.trim()) return "Informe o nome do medico.";
    if (!form.especialidade.trim()) return "Informe a especialidade.";
    if (!form.local.trim()) return "Informe o local da consulta.";
    return "";
  }

  async function aoSalvarConsulta(evento) {
    evento.preventDefault();

    const erro = validarFormulario();
    if (erro) {
      setErroFormulario(erro);
      return;
    }

    const idoso = idosos.find((item) => Number(item.id) === Number(form.idosoId));
    if (!idoso) {
      setErroFormulario("Idoso selecionado nao encontrado.");
      return;
    }

    const dados = {
      idosoId: Number(idoso.id),
      idosoNome: idoso.nome || "Idoso sem nome",
      idosoCpf: idoso.cpf || "",
      data: form.data,
      hora: form.hora,
      medico: form.medico.trim(),
      especialidade: form.especialidade.trim(),
      local: form.local.trim(),
      observacoes: form.observacoes,
      status: form.status,
      tipoAlerta: form.tipoAlerta,
    };

    const payloadAlerta = {
      idosoId: Number(idoso.id),
      tipoAlerta: form.tipoAlerta,
      dataAgendada: form.data + "T" + form.hora + ":00",
      ...(consultaEmEdicao ? { statusAlertas: "AGENDADO" } : {}),
    };

    try {
      setSalvandoConsulta(true);
      setErroFormulario("");

      let alertaSalvo = null;
      if (consultaEmEdicao?.alertaId) {
        alertaSalvo = await atualizarAlerta(consultaEmEdicao.alertaId, payloadAlerta);
      } else {
        alertaSalvo = await cadastrarAlerta(payloadAlerta);
      }

      if (consultaEmEdicao) {
        setConsultas((anteriores) =>
          anteriores.map((consulta) =>
            consulta.id === consultaEmEdicao.id
              ? { ...consulta, ...dados, alertaId: alertaSalvo?.id || consulta.alertaId }
              : consulta
          )
        );
        mostrarToast("sucesso", "Consulta atualizada", "As alteracoes da consulta foram salvas e o alerta foi atualizado.");
      } else {
        setConsultas((anteriores) => [
          {
            id: String(Date.now()),
            ...dados,
            alertaId: alertaSalvo?.id,
            lembreteEnviado: false,
            criadoEm: new Date().toISOString(),
          },
          ...anteriores,
        ]);
        mostrarToast("sucesso", "Alerta cadastrado", "O alerta foi cadastrado na agenda.");
      }

      fecharFormulario();
    } catch (erroApi) {
      setErroFormulario(erroApi.message || "Erro ao cadastrar alerta. Tente novamente.");
      mostrarToast("erro", "Erro ao salvar alerta", erroApi.message || "Tente novamente.");
    } finally {
      setSalvandoConsulta(false);
    }
  }

  async function excluirConsulta() {
    if (!consultaParaExcluir) return;

    try {
      if (consultaParaExcluir.alertaId) {
        await cancelarAlerta(consultaParaExcluir.alertaId);
      }

      setConsultas((anteriores) => anteriores.filter((consulta) => consulta.id !== consultaParaExcluir.id));
      setConsultaParaExcluir(null);
      mostrarToast("sucesso", "Alerta removido", "O alerta foi removido da agenda.");
    } catch (erro) {
      mostrarToast("erro", "Erro ao remover alerta", erro.message || "Tente novamente.");
    }
  }

  function aoEnviarLembreteConsulta(consultaSelecionada) {
    setConsultas((anteriores) =>
      anteriores.map((consulta) =>
        consulta.id === consultaSelecionada.id ? { ...consulta, lembreteEnviado: true } : consulta
      )
    );
    mostrarToast("sucesso", "Lembrete enviado", `Consulta de ${consultaSelecionada.idosoNome}.`);
  }

  return (
    <div className="cuidador-consultas-page">
      <BcNotificacao {...toastProps} />

      <BcBarraSuperior
        title="Consultas dos Idosos"
        subtitle="Gerencie consultas medicas e lembretes"
        actionLabel="Sair"
        actionIcon={<IconeSair />}
        onAction={onLogout}
      />

      <main className="cuidador-consultas-main">
        <button className="cuidador-consultas-voltar" type="button" onClick={onBack}>
          <IconeVoltar />
          Voltar ao painel
        </button>

        <section className="cuidador-consultas-stats" aria-label="Resumo das consultas">
          <CartaoEstatistica label="Total de Consultas" valor={consultas.length} tipo="total" />
          <CartaoEstatistica label="Proximas Consultas" valor={proximas.length} tipo="proximas" />
          <CartaoEstatistica label="Confirmadas" valor={consultas.filter((consulta) => consulta.status === "confirmada").length} tipo="confirmadas" />
          <CartaoEstatistica label="Pendentes" valor={consultas.filter((consulta) => consulta.status === "pendente").length} tipo="pendentes" />
        </section>

        <section className="cuidador-consultas-toolbar" aria-label="Filtros de consultas">
          <div className="cuidador-consultas-busca">
            <IconeBusca />
            <input
              type="text"
              placeholder="Buscar por idoso, medico, especialidade ou local..."
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
            />
          </div>

          <select value={idosoFiltro} onChange={(evento) => setIdosoFiltro(evento.target.value)}>
            <option value="todos">Todos os idosos</option>
            {idosos.map((idoso) => (
              <option key={idoso.id || idoso.cpf} value={idoso.id}>
                {idoso.nome}
              </option>
            ))}
          </select>

          <select value={statusFiltro} onChange={(evento) => setStatusFiltro(evento.target.value)}>
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="confirmada">Confirmada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <BcBotao
            onClick={abrirCadastro}
            fullWidth={false}
            disabled={carregandoIdosos || idosos.length === 0}
          >
            <IconeMais />
            Nova Consulta
          </BcBotao>
        </section>

        {erroIdosos ? (
          <div className="cuidador-consultas-alerta" role="alert">
            <strong>Nao foi possivel carregar os idosos.</strong>
            <span>{erroIdosos}</span>
          </div>
        ) : null}

        {!carregandoIdosos && idosos.length === 0 ? (
          <div className="cuidador-consultas-alerta cuidador-consultas-alerta--aviso">
            <strong>Nenhum idoso vinculado.</strong>
            <span>E necessario ter idosos vinculados ao cuidador para criar consultas.</span>
          </div>
        ) : null}

        <section className="cuidador-consultas-listagem" aria-labelledby="consultas-titulo">
          <div className="cuidador-consultas-listagem__header">
            <h2 id="consultas-titulo"><IconeCalendario /> Consultas Agendadas</h2>
            <span>{consultasFiltradas.length}</span>
          </div>

          {consultasFiltradas.length > 0 ? (
            <div className="cuidador-consultas-lista">
              {consultasFiltradas.map((consulta) => (
                <CartaoConsulta
                  key={consulta.id}
                  consulta={consulta}
                  onVisualizar={setConsultaEmVisualizacao}
                  onEditar={abrirEdicao}
                  onExcluir={setConsultaParaExcluir}
                  onLembrete={aoEnviarLembreteConsulta}
                />
              ))}
            </div>
          ) : (
            <div className="cuidador-consultas-vazio">
              <span><IconeCalendario /></span>
              <p>{busca || statusFiltro !== "todos" || idosoFiltro !== "todos" ? "Nenhuma consulta encontrada." : "Nenhuma consulta agendada ainda."}</p>
            </div>
          )}
        </section>
      </main>

      <BcModal aberto={modalAberto} onFechar={fecharFormulario}>
        <BcFormularioModal
          title={consultaEmEdicao ? "Editar Consulta" : "Nova Consulta"}
          subtitle={consultaEmEdicao ? "Atualize os dados abaixo" : "Preencha os dados para cadastrar"}
          error={erroFormulario}
          onSubmit={aoSalvarConsulta}
          className="cuidador-consultas-form"
        >
          <div className="cuidador-consultas-campo">
            <label htmlFor="consulta-idoso" className="bc-form-modal__label">Idoso *</label>
            <select id="consulta-idoso" name="idosoId" value={form.idosoId} onChange={aoAlterarFormularioConsulta}>
              <option value="">Selecione um idoso</option>
              {idosos.map((idoso) => (
                <option key={idoso.id || idoso.cpf} value={idoso.id}>
                  {idoso.nome} - CPF: {formatarCpf(idoso.cpf)}
                </option>
              ))}
            </select>
          </div>

          <div className="cuidador-consultas-campo">
            <label htmlFor="consulta-tipo-alerta" className="bc-form-modal__label">Tipo de alerta *</label>
            <select id="consulta-tipo-alerta" name="tipoAlerta" value={form.tipoAlerta} onChange={aoAlterarFormularioConsulta}>
              {TIPOS_ALERTA.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>

          <BcCampoTexto label="Medico *" name="medico" placeholder="Dr. Nome do medico" value={form.medico} onChange={aoAlterarFormularioConsulta} />

          <div className="cuidador-consultas-form__linha">
            <BcCampoTexto label="Data *" name="data" type="date" value={form.data} onChange={aoAlterarFormularioConsulta} />
            <BcCampoTexto label="Horario *" name="hora" type="time" value={form.hora} onChange={aoAlterarFormularioConsulta} />
          </div>

          <BcCampoTexto label="Especialidade *" name="especialidade" placeholder="Ex: Cardiologia" value={form.especialidade} onChange={aoAlterarFormularioConsulta} />
          <BcCampoTexto label="Local *" name="local" placeholder="Hospital, clinica ou endereco" value={form.local} onChange={aoAlterarFormularioConsulta} />

          <div className="cuidador-consultas-campo">
            <label htmlFor="consulta-status" className="bc-form-modal__label">Status</label>
            <select id="consulta-status" name="status" value={form.status} onChange={aoAlterarFormularioConsulta}>
              <option value="pendente">Pendente</option>
              <option value="confirmada">Confirmada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <BcFormularioModalAreaTexto
            id="consulta-observacoes"
            label="Observacoes"
            name="observacoes"
            placeholder="Informacoes adicionais sobre a consulta..."
            value={form.observacoes}
            onChange={aoAlterarFormularioConsulta}
          />

          <BcBotao type="submit" loading={salvandoConsulta}>
            {consultaEmEdicao ? "Salvar alterações" : "Cadastrar consulta"}
          </BcBotao>
        </BcFormularioModal>
      </BcModal>

      <BcModal aberto={Boolean(consultaEmVisualizacao)} onFechar={() => setConsultaEmVisualizacao(null)}>
        <section className="cuidador-consultas-detalhes" aria-label="Detalhes da consulta">
          <header className="cuidador-consultas-detalhes__header">
            <span><IconeCalendario /></span>
            <div>
              <h2>Detalhes da Consulta</h2>
              <p>{consultaEmVisualizacao?.idosoNome}</p>
            </div>
          </header>

          <dl className="cuidador-consultas-detalhes__lista">
            <div><dt>Idoso</dt><dd>{consultaEmVisualizacao?.idosoNome || "-"}</dd></div>
            <div><dt>CPF</dt><dd>{formatarCpf(consultaEmVisualizacao?.idosoCpf) || "-"}</dd></div>
            <div><dt>Data</dt><dd>{formatarData(consultaEmVisualizacao?.data)}</dd></div>
            <div><dt>Horario</dt><dd>{consultaEmVisualizacao?.hora || "-"}</dd></div>
            <div><dt>Medico</dt><dd>{consultaEmVisualizacao?.medico || "-"}</dd></div>
            <div><dt>Especialidade</dt><dd>{consultaEmVisualizacao?.especialidade || "-"}</dd></div>
            <div><dt>Local</dt><dd>{consultaEmVisualizacao?.local || "-"}</dd></div>
            <div><dt>Status</dt><dd>{STATUS[consultaEmVisualizacao?.status]?.label || "-"}</dd></div>
            <div className="cuidador-consultas-detalhes__observacoes">
              <dt>Observacoes</dt>
              <dd>{consultaEmVisualizacao?.observacoes || "-"}</dd>
            </div>
          </dl>

          <div className="cuidador-consultas-detalhes__acoes">
            <BcBotao type="button" variant="ghost" onClick={() => setConsultaEmVisualizacao(null)} fullWidth={false}>
              Fechar
            </BcBotao>
            <BcBotao
              type="button"
              onClick={() => {
                const consulta = consultaEmVisualizacao;
                setConsultaEmVisualizacao(null);
                abrirEdicao(consulta);
              }}
              fullWidth={false}
            >
              Editar consulta
            </BcBotao>
          </div>
        </section>
      </BcModal>

      <BcConfirmacao
        aberto={Boolean(consultaParaExcluir)}
        titulo="Excluir consulta?"
        mensagem="A consulta sera removida da agenda do cuidador."
        textoConfirmar="Excluir"
        textoCarregando="Excluindo..."
        icone={<IconeLixeira />}
        onCancelar={() => setConsultaParaExcluir(null)}
        onConfirmar={excluirConsulta}
      />
    </div>
  );
}
