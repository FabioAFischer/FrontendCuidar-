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
import { atualizarAlerta, cadastrarAlerta, cancelarAlerta, listarAlertas } from "../../../api/alertaApi";
import "./ConsultasCuidador.css";

const STORAGE_KEY = "bomcuidado_consultas_cuidador";
const ITENS_POR_PAGINA = 5;

const TIPOS_ALERTA = [
  { value: "CONSULTA", label: "Consulta" },
  { value: "EXAME", label: "Exame" },
  { value: "OUTRO", label: "Outro" },
];

const STATUS = {
  pendente: { label: "Pendente", classe: "pendente" },
  realizada: { label: "Realizada", classe: "realizada" },
  cancelada: { label: "Cancelada", classe: "cancelada" },
};

const STATUS_BACKEND_PARA_TELA = {
  AGENDADO: "pendente",
  REALIZADO: "realizada",
  CANCELADO: "cancelada",
};

const STATUS_TELA_PARA_BACKEND = {
  pendente: "AGENDADO",
  realizada: "REALIZADO",
  cancelada: "CANCELADO",
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

function obterDataAtualParaInput() {
  const agora = new Date();
  const offsetMs = agora.getTimezoneOffset() * 60000;
  return new Date(agora.getTime() - offsetMs).toISOString().slice(0, 10);
}

function lerConsultasSalvas() {
  try {
    const salvas = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(salvas) ? salvas : [];
  } catch {
    return [];
  }
}

function buscarDetalhesLocais(alerta, consultasSalvas) {
  return consultasSalvas.find((consulta) =>
    Number(consulta.alertaId || consulta.id) === Number(alerta.id)
  );
}

function normalizarDataHoraAlerta(valor) {
  if (!valor) return { data: "", hora: "" };

  const [data = "", horario = ""] = String(valor).split("T");
  return {
    data,
    hora: horario.slice(0, 5),
  };
}

function obterLabelTipoAlerta(tipoAlerta) {
  return TIPOS_ALERTA.find((tipo) => tipo.value === tipoAlerta)?.label || tipoAlerta || "Alerta";
}

function feedbackValido(texto) {
  return <span className="bc-form-modal__match" style={{ color: "#0d9e8a" }}>{texto}</span>;
}

function feedbackTextoObrigatorio(valor, nomeCampo) {
  if (!valor) return {};
  if (!String(valor).trim()) return { error: `${nomeCampo} obrigatório.` };
  return { hint: feedbackValido(`${nomeCampo} válido.`) };
}

function feedbackDataHora(data, hora) {
  if (!data || !hora) return {};
  if (new Date(`${data}T${hora}`) < new Date()) return { error: "Não é possível agendar no passado." };
  return { hint: feedbackValido("Data e horário válidos.") };
}

function mapearAlertaParaConsulta(alerta, idosos, consultasSalvas) {
  const detalhesLocais = buscarDetalhesLocais(alerta, consultasSalvas);
  const idoso = idosos.find((item) => Number(item.id) === Number(alerta.idosoId));
  const { data, hora } = normalizarDataHoraAlerta(alerta.dataAgendada);
  const tipoAlerta = alerta.tipoAlerta || detalhesLocais?.tipoAlerta || "CONSULTA";

  return {
    id: String(alerta.id),
    alertaId: alerta.id,
    idosoId: alerta.idosoId,
    idosoNome: alerta.idosoNome || idoso?.nome || detalhesLocais?.idosoNome || "Idoso sem nome",
    idosoCpf: idoso?.cpf || detalhesLocais?.idosoCpf || "",
    data,
    hora,
    medico: alerta.medico || detalhesLocais?.medico || "Não informado",
    especialidade: alerta.especialidade || detalhesLocais?.especialidade || obterLabelTipoAlerta(tipoAlerta),
    local: alerta.local || detalhesLocais?.local || "Não informado",
    observacoes: alerta.observacoes || detalhesLocais?.observacoes || "",
    status: STATUS_BACKEND_PARA_TELA[alerta.statusAlertas] || detalhesLocais?.status || "pendente",
    tipoAlerta,
    consultaId: alerta.consultaId || detalhesLocais?.consultaId,
    criadoEm: alerta.dataCriacao || detalhesLocais?.criadoEm,
  };
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

function CartaoConsulta({ consulta, onVisualizar, onEditar, onExcluir }) {
  const status = STATUS[consulta.status] || STATUS.pendente;

  return (
    <article className="cuidador-consultas-card">
      <div className="cuidador-consultas-card__avatar">
        {String(consulta.idosoNome || "?").charAt(0).toUpperCase()}
      </div>

      <div className="cuidador-consultas-card__conteudo">
        <div className="cuidador-consultas-card__topo">
          <div>
            <h3>{consulta.idosoNome}</h3>
            <p>CPF: {formatarCpf(consulta.idosoCpf) || "Não informado"}</p>
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
      </div>

      <div className="cuidador-consultas-card__acoes">
        <BotaoIcone label="Visualizar agendamento" onClick={() => onVisualizar(consulta)}>
          <IconeVisualizar />
        </BotaoIcone>
        <BotaoIcone label="Editar agendamento" onClick={() => onEditar(consulta)}>
          <IconeEditar />
        </BotaoIcone>
        <BotaoIcone label="Excluir agendamento" tipo="perigo" onClick={() => onExcluir(consulta)}>
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
  const [consultas, setConsultas] = useState([]);
  const [carregandoIdosos, setCarregandoIdosos] = useState(true);
  const [erroIdosos, setErroIdosos] = useState("");
  const [carregandoConsultas, setCarregandoConsultas] = useState(true);
  const [erroConsultas, setErroConsultas] = useState("");
  const [consultasCarregadas, setConsultasCarregadas] = useState(false);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [idosoFiltro, setIdosoFiltro] = useState("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [consultaEmEdicao, setConsultaEmEdicao] = useState(null);
  const [consultaEmVisualizacao, setConsultaEmVisualizacao] = useState(null);
  const [consultaParaExcluir, setConsultaParaExcluir] = useState(null);
  const [erroFormulario, setErroFormulario] = useState("");
  const [salvandoConsulta, setSalvandoConsulta] = useState(false);
  const [form, setForm] = useState(formInicial);

  useEffect(() => {
    carregarDadosTela();
  }, []);

  useEffect(() => {
    if (!consultasCarregadas) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consultas));
  }, [consultas, consultasCarregadas]);

  async function carregarDadosTela() {
    try {
      setCarregandoIdosos(true);
      setCarregandoConsultas(true);
      setErroIdosos("");
      setErroConsultas("");

      const [listaIdosos, listaAlertas] = await Promise.all([
        listarIdososDoCuidador(),
        listarAlertas(),
      ]);

      const idososCarregados = Array.isArray(listaIdosos) ? listaIdosos : [];
      const alertasCarregados = Array.isArray(listaAlertas) ? listaAlertas : [];
      const consultasSalvas = lerConsultasSalvas();

      setIdosos(idososCarregados);
      setConsultas(
        alertasCarregados
          .filter((alerta) => alerta.tipoAlerta !== "REMEDIO")
          .map((alerta) => mapearAlertaParaConsulta(alerta, idososCarregados, consultasSalvas))
      );
      setConsultasCarregadas(true);
    } catch (erro) {
      setErroIdosos(erro.message || "Não foi possível carregar os dados da tela.");
      setErroConsultas(erro.message || "Não foi possível carregar os alertas.");
      setIdosos([]);
      setConsultas([]);
    } finally {
      setCarregandoIdosos(false);
      setCarregandoConsultas(false);
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

  const totalPaginas = Math.max(Math.ceil(consultasFiltradas.length / ITENS_POR_PAGINA), 1);
  const consultasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return consultasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [consultasFiltradas, paginaAtual]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, statusFiltro, idosoFiltro]);

  useEffect(() => {
    setPaginaAtual((pagina) => Math.min(Math.max(pagina, 1), totalPaginas));
  }, [totalPaginas]);

  const proximas = consultas.filter((consulta) =>
    criarDataConsulta(consulta).getTime() > Date.now() && consulta.status !== "cancelada"
  );
  const medicoFeedback = feedbackTextoObrigatorio(form.medico, "Médico");
  const especialidadeFeedback = feedbackTextoObrigatorio(form.especialidade, "Especialidade");
  const localFeedback = feedbackTextoObrigatorio(form.local, "Local");
  const dataHoraFeedback = feedbackDataHora(form.data, form.hora);

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
    if (!form.data) return "Informe a data do agendamento.";
    if (!form.hora) return "Informe o horário do agendamento.";

    if (new Date(`${form.data}T${form.hora}`) < new Date()) {
      return "Não é possível agendar no passado.";
    }

    if (!form.tipoAlerta) return "Selecione o tipo do alerta.";
    if (!form.medico.trim()) return "Informe o nome do médico.";
    if (!form.especialidade.trim()) return "Informe a especialidade.";
    if (!form.local.trim()) return "Informe o local do agendamento.";
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
      setErroFormulario("Idoso selecionado não encontrado.");
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
      statusAlertas: STATUS_TELA_PARA_BACKEND[form.status] || "AGENDADO",
      medico: form.medico,
      especialidade: form.especialidade,
      local: form.local,
      observacoes: form.observacoes,
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
              ? { ...consulta, ...dados, alertaId: alertaSalvo?.id || consulta.alertaId, consultaId: alertaSalvo?.consultaId || consulta.consultaId }
              : consulta
          )
        );
        mostrarToast("sucesso", "Agendamento atualizado", "As alterações do agendamento foram salvas e o alerta foi atualizado.");
      } else {
        setConsultas((anteriores) => [
          {
            id: String(Date.now()),
            ...(alertaSalvo?.id ? { id: String(alertaSalvo.id) } : {}),
            ...dados,
            alertaId: alertaSalvo?.id,
            consultaId: alertaSalvo?.consultaId,
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

  return (
    <div className="cuidador-consultas-page">
      <BcNotificacao {...toastProps} />

      <BcBarraSuperior
        title="Agendamentos dos Idosos"
        subtitle="Gerencie agendamentos médicos"
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
          <CartaoEstatistica label="Total de Agendamentos" valor={consultas.length} tipo="total" />
          <CartaoEstatistica label="Próximos Agendamentos" valor={proximas.length} tipo="proximas" />
          <CartaoEstatistica label="Realizadas" valor={consultas.filter((consulta) => consulta.status === "realizada").length} tipo="realizadas" />
          <CartaoEstatistica label="Pendentes" valor={consultas.filter((consulta) => consulta.status === "pendente").length} tipo="pendentes" />
        </section>

        <section className="cuidador-consultas-toolbar" aria-label="Filtros de consultas">
          <div className="cuidador-consultas-busca">
            <IconeBusca />
            <input
              type="text"
              placeholder="Buscar por idoso, médico, especialidade ou local..."
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
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <BcBotao
            onClick={abrirCadastro}
            fullWidth={false}
            disabled={carregandoIdosos || carregandoConsultas || idosos.length === 0}
          >
            <IconeMais />
            Novo Agendamento
          </BcBotao>
        </section>

        {erroIdosos ? (
          <div className="cuidador-consultas-alerta" role="alert">
            <strong>Não foi possível carregar os idosos.</strong>
            <span>{erroIdosos}</span>
          </div>
        ) : null}

        {erroConsultas ? (
          <div className="cuidador-consultas-alerta" role="alert">
            <strong>Não foi possível carregar os alertas.</strong>
            <span>{erroConsultas}</span>
          </div>
        ) : null}

        {!carregandoIdosos && idosos.length === 0 ? (
          <div className="cuidador-consultas-alerta cuidador-consultas-alerta--aviso">
            <strong>Nenhum idoso vinculado.</strong>
            <span>É necessário ter idosos vinculados ao cuidador para criar agendamentos.</span>
          </div>
        ) : null}

        <section className="cuidador-consultas-listagem" aria-labelledby="consultas-titulo">
          <div className="cuidador-consultas-listagem__header">
            <h2 id="consultas-titulo"><IconeCalendario /> Agendamentos</h2>
            <span>{consultasFiltradas.length}</span>
          </div>

          {carregandoConsultas ? (
            <div className="cuidador-consultas-vazio">
              <span><IconeCalendario /></span>
              <p>Carregando alertas...</p>
            </div>
          ) : consultasFiltradas.length > 0 ? (
            <div className="cuidador-consultas-lista">
              {consultasPaginadas.map((consulta) => (
                <CartaoConsulta
                  key={consulta.id}
                  consulta={consulta}
                  onVisualizar={setConsultaEmVisualizacao}
                  onEditar={abrirEdicao}
                  onExcluir={setConsultaParaExcluir}
                />
              ))}
              {totalPaginas > 1 ? (
                <div className="cuidador-consultas-paginacao">
                  <p>Página {paginaAtual} de {totalPaginas}</p>
                  <div>
                    <button type="button" onClick={() => setPaginaAtual((pagina) => Math.max(pagina - 1, 1))} disabled={paginaAtual === 1}>
                      Anterior
                    </button>
                    <button type="button" onClick={() => setPaginaAtual((pagina) => Math.min(pagina + 1, totalPaginas))} disabled={paginaAtual === totalPaginas}>
                      Próxima
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="cuidador-consultas-vazio">
              <span><IconeCalendario /></span>
              <p>{busca || statusFiltro !== "todos" || idosoFiltro !== "todos" ? "Nenhum agendamento encontrado." : "Nenhum agendamento ainda."}</p>
            </div>
          )}
        </section>
      </main>

      <BcModal aberto={modalAberto} onFechar={fecharFormulario}>
        <BcFormularioModal
          title={consultaEmEdicao ? "Editar Agendamento" : "Novo Agendamento"}
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

          <BcCampoTexto label="Médico *" name="medico" placeholder="Dr. Nome do médico" value={form.medico} onChange={aoAlterarFormularioConsulta} error={medicoFeedback.error} hint={medicoFeedback.hint} />

          <div className="cuidador-consultas-form__linha">
            <BcCampoTexto
              label="Data *"
              name="data"
              type="date"
              value={form.data}
              onChange={aoAlterarFormularioConsulta}
              min={obterDataAtualParaInput()}
              error={dataHoraFeedback.error}
              hint={dataHoraFeedback.hint}
            />
            <BcCampoTexto label="Horário *" name="hora" type="time" value={form.hora} onChange={aoAlterarFormularioConsulta} error={dataHoraFeedback.error} />
          </div>

          <BcCampoTexto label="Especialidade *" name="especialidade" placeholder="Ex: Cardiologia" value={form.especialidade} onChange={aoAlterarFormularioConsulta} error={especialidadeFeedback.error} hint={especialidadeFeedback.hint} />
          <BcCampoTexto label="Local *" name="local" placeholder="Hospital, clínica ou endereço" value={form.local} onChange={aoAlterarFormularioConsulta} error={localFeedback.error} hint={localFeedback.hint} />

          <div className="cuidador-consultas-campo">
            <label htmlFor="consulta-status" className="bc-form-modal__label">Status</label>
            <select id="consulta-status" name="status" value={form.status} onChange={aoAlterarFormularioConsulta}>
              <option value="pendente">Pendente</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <BcFormularioModalAreaTexto
            id="consulta-observacoes"
            label="Observações"
            name="observacoes"
            placeholder="Informações adicionais sobre o agendamento..."
            value={form.observacoes}
            onChange={aoAlterarFormularioConsulta}
          />

          <BcBotao type="submit" loading={salvandoConsulta}>
            {consultaEmEdicao ? "Salvar alterações" : "Cadastrar agendamento"}
          </BcBotao>
        </BcFormularioModal>
      </BcModal>

      <BcModal aberto={Boolean(consultaEmVisualizacao)} onFechar={() => setConsultaEmVisualizacao(null)}>
        <section className="cuidador-consultas-detalhes" aria-label="Detalhes da consulta">
          <header className="cuidador-consultas-detalhes__header">
            <span><IconeCalendario /></span>
            <div>
              <h2>Detalhes do Agendamento</h2>
              <p>{consultaEmVisualizacao?.idosoNome}</p>
            </div>
          </header>

          <dl className="cuidador-consultas-detalhes__lista">
            <div><dt>Idoso</dt><dd>{consultaEmVisualizacao?.idosoNome || "-"}</dd></div>
            <div><dt>CPF</dt><dd>{formatarCpf(consultaEmVisualizacao?.idosoCpf) || "-"}</dd></div>
            <div><dt>Data</dt><dd>{formatarData(consultaEmVisualizacao?.data)}</dd></div>
            <div><dt>Horário</dt><dd>{consultaEmVisualizacao?.hora || "-"}</dd></div>
            <div><dt>Médico</dt><dd>{consultaEmVisualizacao?.medico || "-"}</dd></div>
            <div><dt>Especialidade</dt><dd>{consultaEmVisualizacao?.especialidade || "-"}</dd></div>
            <div><dt>Local</dt><dd>{consultaEmVisualizacao?.local || "-"}</dd></div>
            <div><dt>Status</dt><dd>{STATUS[consultaEmVisualizacao?.status]?.label || "-"}</dd></div>
            <div className="cuidador-consultas-detalhes__observacoes">
              <dt>Observações</dt>
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
              Editar agendamento
            </BcBotao>
          </div>
        </section>
      </BcModal>

      <BcConfirmacao
        aberto={Boolean(consultaParaExcluir)}
        titulo="Excluir agendamento?"
        mensagem="O agendamento será removido da agenda do cuidador."
        textoConfirmar="Excluir"
        textoCarregando="Excluindo..."
        icone={<IconeLixeira />}
        onCancelar={() => setConsultaParaExcluir(null)}
        onConfirmar={excluirConsulta}
      />
    </div>
  );
}
