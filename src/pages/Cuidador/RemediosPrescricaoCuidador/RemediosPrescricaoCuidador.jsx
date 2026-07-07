import { useCallback, useEffect, useMemo, useState } from "react";
import BcBotao from "../../../components/BcBotao/BcBotao";
import BcConfirmacao from "../../../components/BcConfirmacao/BcConfirmacao";
import BcFormularioModal, { BcFormularioModalAreaTexto } from "../../../components/BcFormularioModal/BcFormularioModal";
import BcCampoTexto from "../../../components/BcCampoTexto/BcCampoTexto";
import BcModal from "../../../components/BcModal/BcModal";
import BcListagemRemedios from "../../../components/BcListagemRemedios/BcListagemRemedios";
import BcNotificacao, { useBcNotificacao } from "../../../components/BcNotificacao/BcNotificacao";
import BcBarraSuperior from "../../../components/BcBarraSuperior/BcBarraSuperior";
import {
  IconeCalendario,
  IconeBusca,
  IconeEditar,
  IconeIdosos,
  IconeLixeira,
  IconeMais,
  IconeRemedio,
  IconeSair,
  IconeVisualizar,
  IconeVoltar,
} from "../../../components/icones/Icones";
import { extrairSomenteNumeros, validarCpf } from "../../../utils/validacaoDocumento";
import { listarIdososDoCuidador } from "../../../api/instituicaoApi";
import { cadastrarAlerta, cancelarAlerta, listarAlertasPorIdoso } from "../../../api/alertaApi";
import { atualizarPrescricao as atualizarPrescricaoApi, cadastrarPrescricao, inativarPrescricao, listarPrescricoesPorIdoso } from "../../../api/prescricaoApi";
import { atualizarRemedio as atualizarRemedioApi, cadastrarRemedio, inativarRemedio, listarRemedios } from "../../../api/remedioApi";
import "./RemediosPrescricaoCuidador.css";

const ITENS_POR_PAGINA_AGENDA = 5;

function BotaoIcone({ children, tipo = "padrao", label, onClick }) {
  return (
    <button
      className={`cuidador-remedios-acao cuidador-remedios-acao--${tipo}`}
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
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

function ControlesPaginacaoAgenda({ paginaAtual, totalPaginas, onAnterior, onProxima }) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="cuidador-remedios-paginacao">
      <p>Página {paginaAtual} de {totalPaginas}</p>
      <div>
        <button type="button" onClick={onAnterior} disabled={paginaAtual === 1}>Anterior</button>
        <button type="button" onClick={onProxima} disabled={paginaAtual === totalPaginas}>Próxima</button>
      </div>
    </div>
  );
}

function formatarCpf(valor = "") {
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

  if (!telefone) return "Telefone não informado";

  const numero = String(telefone).replace(/\D/g, "");
  const telefoneFormatado = numero.length > 8
    ? numero.replace(/(\d{5})(\d{4})$/, "$1-$2")
    : numero.replace(/(\d{4})(\d{4})$/, "$1-$2");

  return ddd ? `(${ddd}) ${telefoneFormatado}` : telefoneFormatado;
}

function formatarData(valor) {
  if (!valor) return "Sem data";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Sem data";

  return data.toLocaleDateString("pt-BR");
}

function formatarDataHora(valor) {
  if (!valor) return "Sem data";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Sem data";

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarValorInputData(valor) {
  if (!valor) return "";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";

  const offsetMs = data.getTimezoneOffset() * 60000;
  return new Date(data.getTime() - offsetMs).toISOString().slice(0, 10);
}

function obterDataHoraAtualParaInput() {
  const agora = new Date();
  const offsetMs = agora.getTimezoneOffset() * 60000;
  return new Date(agora.getTime() - offsetMs).toISOString().slice(0, 16);
}

function calcularFimDoDia(valor) {
  if (!valor) return null;
  return `${valor}T23:59:59`;
}

function ehAlertaRemedioPendente(alerta) {
  const tipo = String(alerta?.tipoAlerta || alerta?.tipo || "").toUpperCase();
  const status = String(alerta?.statusAlertas || alerta?.status || "").toUpperCase();

  return tipo === "REMEDIO" && status !== "REALIZADO";
}

export default function RemediosPrescricaoCuidador({ onBack, onLogout }) {
  const { toastProps, mostrarToast } = useBcNotificacao();
  const [remedios, setRemedios] = useState([]);
  const [idosos, setIdosos] = useState([]);
  const [prescricoes, setPrescricoes] = useState([]);
  const [alertasRemedio, setAlertasRemedio] = useState([]);
  const [paginaAgendaAtual, setPaginaAgendaAtual] = useState(1);
  const [idosoSelecionadoId, setIdosoSelecionadoId] = useState(null);
  const [carregandoIdosos, setCarregandoIdosos] = useState(true);
  const [erroIdosos, setErroIdosos] = useState("");
  const [carregandoRemedios, setCarregandoRemedios] = useState(true);
  const [erroRemedios, setErroRemedios] = useState("");
  const [carregandoPrescricoes, setCarregandoPrescricoes] = useState(false);
  const [erroListagemPrescricao, setErroListagemPrescricao] = useState("");
  const [carregandoAlertasRemedio, setCarregandoAlertasRemedio] = useState(false);
  const [erroAlertasRemedio, setErroAlertasRemedio] = useState("");
  const [salvandoRemedio, setSalvandoRemedio] = useState(false);
  const [salvandoPrescricao, setSalvandoPrescricao] = useState(false);
  const [inativandoRemedio, setInativandoRemedio] = useState(false);
  const [inativandoPrescricao, setInativandoPrescricao] = useState(false);
  const [modalRemedioAberto, setModalRemedioAberto] = useState(false);
  const [modalPrescricaoAberto, setModalPrescricaoAberto] = useState(false);
  const [modalAlertaRemedioAberto, setModalAlertaRemedioAberto] = useState(false);
  const [buscaIdoso, setBuscaIdoso] = useState("");
  const [buscaRemedioPrescricao, setBuscaRemedioPrescricao] = useState("");
  const [sugestoesRemedioAbertas, setSugestoesRemedioAbertas] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);
  const [remedioEmEdicao, setRemedioEmEdicao] = useState(null);
  const [prescricaoEmEdicao, setPrescricaoEmEdicao] = useState(null);
  const [remedioEmVisualizacao, setRemedioEmVisualizacao] = useState(null);
  const [prescricaoEmVisualizacao, setPrescricaoEmVisualizacao] = useState(null);
  const [erroCadastroRemedio, setErroCadastroRemedio] = useState("");
  const [erroPrescricao, setErroPrescricao] = useState("");
  const [erroAlertaRemedio, setErroAlertaRemedio] = useState("");
  const [salvandoAlertaRemedio, setSalvandoAlertaRemedio] = useState(false);
  const [formRemedio, setFormRemedio] = useState({
    nome: "",
    observacao: "",
  });
  const [formPrescricao, setFormPrescricao] = useState({
    remedioId: "",
    dosagem: "",
    intervalo: "",
    dataFim: "",
    necessarioJejum: "false",
    instrucao: "",
  });
  const [formAlertaRemedio, setFormAlertaRemedio] = useState({
    prescricaoId: "",
    dataAgendada: "",
  });

  const idosoSelecionado = idosos.find((idoso) => Number(idoso.id) === Number(idosoSelecionadoId));
  const idososFiltrados = useMemo(() => {
    const termo = buscaIdoso.trim().toLowerCase();

    if (!termo) {
      return idosos;
    }

    return idosos.filter((idoso) => {
      const nome = String(idoso.nome || "").toLowerCase();
      const cpf = extrairSomenteNumeros(idoso.cpf);
      const cpfFormatado = formatarCpf(idoso.cpf).toLowerCase();
      const telefone = formatarTelefone(idoso).toLowerCase();
      const termoNumerico = extrairSomenteNumeros(termo);

      // If user typed a full CPF, validate it; if invalid, don't match by CPF
      if (termoNumerico.length === 11 && !validarCpf(termoNumerico)) return nome.includes(termo) || telefone.includes(termo) || cpfFormatado.includes(termo);

      return (
        nome.includes(termo) ||
        cpfFormatado.includes(termo) ||
        telefone.includes(termo) ||
        (termoNumerico && cpf.includes(termoNumerico))
      );
    });
  }, [buscaIdoso, idosos]);
  const remediosFiltradosPrescricao = useMemo(() => {
    const termo = buscaRemedioPrescricao.trim().toLowerCase();

    if (!termo) {
      return remedios;
    }

    return remedios.filter((remedio) =>
      String(remedio.nome || "").toLowerCase().startsWith(termo)
    );
  }, [buscaRemedioPrescricao, remedios]);
  const totalPaginasAgenda = Math.ceil(alertasRemedio.length / ITENS_POR_PAGINA_AGENDA);
  const alertasRemedioPaginados = useMemo(() => {
    const inicio = (paginaAgendaAtual - 1) * ITENS_POR_PAGINA_AGENDA;
    return alertasRemedio.slice(inicio, inicio + ITENS_POR_PAGINA_AGENDA);
  }, [alertasRemedio, paginaAgendaAtual]);

  const carregarPrescricoesDoIdoso = useCallback(async () => {
    if (!idosoSelecionadoId) {
      setPrescricoes([]);
      return;
    }

    try {
      setCarregandoPrescricoes(true);
      setErroListagemPrescricao("");
      const lista = await listarPrescricoesPorIdoso(idosoSelecionadoId);
      setPrescricoes(Array.isArray(lista) ? lista : []);
    } catch (erro) {
      setErroListagemPrescricao(erro.message);
      setPrescricoes([]);
    } finally {
      setCarregandoPrescricoes(false);
    }
  }, [idosoSelecionadoId]);

  const carregarAlertasRemedioDoIdoso = useCallback(async () => {
    if (!idosoSelecionadoId) {
      setAlertasRemedio([]);
      return;
    }

    try {
      setCarregandoAlertasRemedio(true);
      setErroAlertasRemedio("");
      const lista = await listarAlertasPorIdoso(idosoSelecionadoId);
      const alertas = Array.isArray(lista) ? lista : [];
      setAlertasRemedio(alertas.filter(ehAlertaRemedioPendente));
    } catch (erro) {
      setErroAlertasRemedio(erro.message);
      setAlertasRemedio([]);
    } finally {
      setCarregandoAlertasRemedio(false);
    }
  }, [idosoSelecionadoId]);

  useEffect(() => {
    carregarRemedios();
    carregarIdosos();
  }, []);

  useEffect(() => {
    setPaginaAgendaAtual(1);
    carregarPrescricoesDoIdoso();
    carregarAlertasRemedioDoIdoso();
  }, [carregarPrescricoesDoIdoso, carregarAlertasRemedioDoIdoso]);

  useEffect(() => {
    setPaginaAgendaAtual((pagina) => Math.min(Math.max(pagina, 1), Math.max(totalPaginasAgenda, 1)));
  }, [totalPaginasAgenda]);

  async function carregarIdosos() {
    try {
      setCarregandoIdosos(true);
      setErroIdosos("");
      const lista = await listarIdososDoCuidador();
      const idososVinculados = Array.isArray(lista) ? lista : [];

      setIdosos(idososVinculados);
      setIdosoSelecionadoId(idososVinculados[0]?.id || null);
    } catch (erro) {
      setErroIdosos(erro.message);
      setIdosos([]);
      setIdosoSelecionadoId(null);
    } finally {
      setCarregandoIdosos(false);
    }
  }

  async function carregarRemedios() {
    try {
      setCarregandoRemedios(true);
      setErroRemedios("");
      const lista = await listarRemedios();
      setRemedios(Array.isArray(lista) ? lista : []);
    } catch (erro) {
      setErroRemedios(erro.message);
      setRemedios([]);
    } finally {
      setCarregandoRemedios(false);
    }
  }

  function abrirCadastroRemedio() {
    setErroCadastroRemedio("");
    setRemedioEmEdicao(null);
    setFormRemedio({
      nome: "",
      observacao: "",
    });
    setModalRemedioAberto(true);
  }

  function fecharCadastroRemedio() {
    setModalRemedioAberto(false);
    setRemedioEmEdicao(null);
    setErroCadastroRemedio("");
    setFormRemedio({
      nome: "",
      observacao: "",
    });
  }

  function aoAlterarFormularioRemedio(evento) {
    const { name, value } = evento.target;
    setFormRemedio((anterior) => ({ ...anterior, [name]: value }));
  }

  function abrirEdicaoRemedio(remedio) {
    setErroCadastroRemedio("");
    setRemedioEmEdicao(remedio);
    setFormRemedio({
      nome: remedio.nome || "",
      observacao: remedio.observacao || "",
    });
    setModalRemedioAberto(true);
  }

  function abrirVisualizacaoRemedio(remedio) {
    setRemedioEmVisualizacao(remedio);
  }

  function fecharVisualizacaoRemedio() {
    setRemedioEmVisualizacao(null);
  }

  function abrirVisualizacaoPrescricao(prescricao) {
    setPrescricaoEmVisualizacao(prescricao);
  }

  function fecharVisualizacaoPrescricao() {
    setPrescricaoEmVisualizacao(null);
  }

  function abrirCadastroAlertaRemedio() {
    setErroAlertaRemedio("");
    setFormAlertaRemedio({ prescricaoId: "", dataAgendada: "" });
    setModalAlertaRemedioAberto(true);
  }

  function fecharCadastroAlertaRemedio() {
    setModalAlertaRemedioAberto(false);
    setErroAlertaRemedio("");
    setFormAlertaRemedio({ prescricaoId: "", dataAgendada: "" });
  }

  function aoAlterarFormularioAlertaRemedio(evento) {
    const { name, value } = evento.target;
    setFormAlertaRemedio((anterior) => ({ ...anterior, [name]: value }));
  }

  async function aoSalvarAlertaRemedio(evento) {
    evento.preventDefault();

    if (!idosoSelecionado) {
      setErroAlertaRemedio("Selecione um idoso para criar o alerta.");
      return;
    }

    if (!formAlertaRemedio.dataAgendada) {
      setErroAlertaRemedio("Informe a data e horário do alerta.");
      return;
    }

    if (new Date(formAlertaRemedio.dataAgendada) < new Date()) {
      setErroAlertaRemedio("Não é possível agendar um alerta no passado.");
      return;
    }

    if (!formAlertaRemedio.prescricaoId) {
      setErroAlertaRemedio("Selecione a prescrição do remédio.");
      return;
    }

    try {
      setSalvandoAlertaRemedio(true);
      setErroAlertaRemedio("");

      await cadastrarAlerta({
        idosoId: Number(idosoSelecionado.id),
        prescricaoId: Number(formAlertaRemedio.prescricaoId),
        tipoAlerta: "REMEDIO",
        dataAgendada: formAlertaRemedio.dataAgendada,
      });

      await carregarAlertasRemedioDoIdoso();
      setPaginaAgendaAtual(1);
      fecharCadastroAlertaRemedio();
      mostrarToast("sucesso", "Alerta cadastrado", "O alerta de remédio foi cadastrado na agenda.");
    } catch (erro) {
      setErroAlertaRemedio(erro.message || "Erro ao cadastrar alerta.");
      mostrarToast("erro", "Erro ao cadastrar alerta", erro.message || "Tente novamente.");
    } finally {
      setSalvandoAlertaRemedio(false);
    }
  }

  async function removerAlertaRemedio(alerta) {
    try {
      await cancelarAlerta(alerta.id);
      setAlertasRemedio((anteriores) => anteriores.filter((item) => Number(item.id) !== Number(alerta.id)));
      mostrarToast("sucesso", "Alerta cancelado", "O alerta foi removido da agenda.");
    } catch (erro) {
      mostrarToast("erro", "Erro ao cancelar alerta", erro.message || "Tente novamente.");
    }
  }

  function abrirCadastroPrescricao() {
    setErroPrescricao("");
    setPrescricaoEmEdicao(null);
    setBuscaRemedioPrescricao("");
    setSugestoesRemedioAbertas(false);
    setFormPrescricao({
      remedioId: "",
      dosagem: "",
      intervalo: "",
      dataFim: "",
      necessarioJejum: "false",
      instrucao: "",
    });
    setModalPrescricaoAberto(true);
  }

  function fecharCadastroPrescricao() {
    setModalPrescricaoAberto(false);
    setPrescricaoEmEdicao(null);
    setErroPrescricao("");
    setBuscaRemedioPrescricao("");
    setSugestoesRemedioAbertas(false);
    setFormPrescricao({
      remedioId: "",
      dosagem: "",
      intervalo: "",
      dataFim: "",
      necessarioJejum: "false",
      instrucao: "",
    });
  }

  function aoAlterarFormularioPrescricao(evento) {
    const { name, value } = evento.target;
    setFormPrescricao((anterior) => ({ ...anterior, [name]: value }));
  }

  function abrirEdicaoPrescricao(prescricao) {
    setErroPrescricao("");
    setPrescricaoEmEdicao(prescricao);
    setBuscaRemedioPrescricao(prescricao.remedioNome || "");
    setSugestoesRemedioAbertas(false);
    setFormPrescricao({
      remedioId: prescricao.remedioId ? String(prescricao.remedioId) : "",
      dosagem: prescricao.dosagem || "",
      intervalo: prescricao.intervalo ? String(prescricao.intervalo) : "",
      dataFim: formatarValorInputData(prescricao.dataFim),
      necessarioJejum: prescricao.necessarioJejum ? "true" : "false",
      instrucao: prescricao.instrucao || "",
    });
    setModalPrescricaoAberto(true);
  }

  function aoAlterarBuscaRemedioPrescricao(evento) {
    const valor = evento.target.value;

    setBuscaRemedioPrescricao(valor);
    setSugestoesRemedioAbertas(true);
    setFormPrescricao((anterior) => ({ ...anterior, remedioId: "" }));
  }

  function aoSelecionarRemedioPrescricao(remedio) {
    setBuscaRemedioPrescricao(remedio.nome || "");
    setSugestoesRemedioAbertas(false);
    setFormPrescricao((anterior) => ({ ...anterior, remedioId: String(remedio.id) }));
  }

  async function aoSalvarPrescricao(evento) {
    evento.preventDefault();

    if (!idosoSelecionado) {
      setErroPrescricao("Selecione um idoso para criar a prescrição.");
      return;
    }

    if (!formPrescricao.remedioId) {
      setErroPrescricao("Selecione um remédio.");
      return;
    }

    if (!formPrescricao.dosagem.trim()) {
      setErroPrescricao("Informe a dosagem.");
      return;
    }

    if (!formPrescricao.intervalo || Number(formPrescricao.intervalo) <= 0) {
      setErroPrescricao("Informe um intervalo maior que zero.");
      return;
    }

    const remedioSelecionado = remedios.find((remedio) => Number(remedio.id) === Number(formPrescricao.remedioId));
    const dados = {
      remedioId: Number(formPrescricao.remedioId),
      idosoId: Number(idosoSelecionado.id),
      remedioNome: remedioSelecionado?.nome || "",
      idosoNome: idosoSelecionado.nome || "",
      dosagem: formPrescricao.dosagem,
      intervalo: Number(formPrescricao.intervalo),
      dataFim: calcularFimDoDia(formPrescricao.dataFim),
      necessarioJejum: formPrescricao.necessarioJejum === "true",
      instrucao: formPrescricao.instrucao,
    };

    try {
      setSalvandoPrescricao(true);
      setErroPrescricao("");
      const editandoPrescricao = Boolean(prescricaoEmEdicao);

      if (editandoPrescricao) {
        const prescricaoAtualizada = await atualizarPrescricaoApi(prescricaoEmEdicao.id, dados);
        setPrescricoes((anteriores) =>
          anteriores.map((prescricao) =>
            Number(prescricao.id) === Number(prescricaoEmEdicao.id) ? prescricaoAtualizada : prescricao
          )
        );
      } else {
        const prescricaoCriada = await cadastrarPrescricao(dados);
        setPrescricoes((anteriores) => [prescricaoCriada, ...anteriores]);
      }

      await carregarAlertasRemedioDoIdoso();
      setPaginaAgendaAtual(1);
      fecharCadastroPrescricao();
      mostrarToast(
        "sucesso",
        editandoPrescricao ? "Prescrição atualizada" : "Prescrição cadastrada",
        editandoPrescricao
          ? "As alterações da prescrição foram salvas."
          : "A prescrição foi criada para o idoso selecionado."
      );
    } catch (erro) {
      setErroPrescricao(erro.message);
      mostrarToast("erro", "Erro ao salvar prescrição", erro.message);
    } finally {
      setSalvandoPrescricao(false);
    }
  }

  async function aoSalvarRemedio(evento) {
    evento.preventDefault();

    if (!formRemedio.nome.trim()) {
      setErroCadastroRemedio("Informe o nome do remédio.");
      return;
    }

    try {
      setSalvandoRemedio(true);
      setErroCadastroRemedio("");
      const editandoRemedio = Boolean(remedioEmEdicao);

      if (editandoRemedio) {
        const remedioAtualizado = await atualizarRemedioApi(remedioEmEdicao.id, formRemedio);

        if (remedioAtualizado) {
          setRemedios((anteriores) =>
            anteriores.map((remedio) =>
              Number(remedio.id) === Number(remedioEmEdicao.id) ? remedioAtualizado : remedio
            )
          );
        } else {
          await carregarRemedios();
        }
      } else {
        const remedioCadastrado = await cadastrarRemedio(formRemedio);

        if (remedioCadastrado) {
          setRemedios((anteriores) => [remedioCadastrado, ...anteriores]);
        } else {
          await carregarRemedios();
        }
      }

      fecharCadastroRemedio();
      mostrarToast(
        "sucesso",
        editandoRemedio ? "Remédio atualizado" : "Remédio cadastrado",
        editandoRemedio
          ? "As alterações do remédio foram salvas."
          : "O remédio foi adicionado à listagem."
      );
    } catch (erro) {
      setErroCadastroRemedio(erro.message);
      mostrarToast("erro", "Erro ao salvar remédio", erro.message);
    } finally {
      setSalvandoRemedio(false);
    }
  }

  async function confirmarInativacaoRemedio(remedio) {
    try {
      setInativandoRemedio(true);
      setErroRemedios("");
      await inativarRemedio(remedio.id);
      setRemedios((anteriores) => anteriores.filter((item) => Number(item.id) !== Number(remedio.id)));
      setPrescricoes((anteriores) => anteriores.filter((item) => Number(item.remedioId) !== Number(remedio.id)));
      mostrarToast("sucesso", "Remédio inativado", "As prescrições vinculadas também foram removidas da listagem.");
    } catch (erro) {
      setErroRemedios(erro.message);
      mostrarToast("erro", "Erro ao inativar remédio", erro.message);
    } finally {
      setInativandoRemedio(false);
    }
  }

  function solicitarInativacaoPrescricao(prescricao) {
    setConfirmacao({
      tipo: "prescricao",
      item: prescricao,
      titulo: "Remover prescrição?",
      mensagem: "A prescrição será removida da listagem deste idoso.",
      textoConfirmar: "Remover",
      textoCarregando: "Removendo...",
    });
  }

  async function confirmarInativacaoPrescricao(prescricao) {
    try {
      setInativandoPrescricao(true);
      setErroListagemPrescricao("");
      await inativarPrescricao(prescricao.id);
      setPrescricoes((anteriores) => anteriores.filter((item) => Number(item.id) !== Number(prescricao.id)));
      setConfirmacao(null);
      mostrarToast("sucesso", "Prescrição removida", "A prescrição foi removida da listagem deste idoso.");
    } catch (erro) {
      setErroListagemPrescricao(erro.message);
      mostrarToast("erro", "Erro ao remover prescrição", erro.message);
    } finally {
      setInativandoPrescricao(false);
    }
  }

  function aoConfirmarAcaoPendente() {
    if (!confirmacao) return;
    confirmarInativacaoPrescricao(confirmacao.item);
  }

  return (
    <div className="cuidador-remedios-page">
      <BcNotificacao {...toastProps} />

      <BcBarraSuperior
        title="Gerenciamento de Prescrições"
        subtitle="Remédios, prescrições e agenda"
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
          <aside className="cuidador-remedios-listagem">
            <BcListagemRemedios
              remedios={remedios}
              carregando={carregandoRemedios}
              erro={erroRemedios}
              inativando={inativandoRemedio}
              onCadastrar={abrirCadastroRemedio}
              onVisualizar={abrirVisualizacaoRemedio}
              onEditar={abrirEdicaoRemedio}
              onInativar={confirmarInativacaoRemedio}
            />
          </aside>

          <section className="cuidador-remedios-centro">
            <div className="cuidador-remedios-card">
              <div className="cuidador-remedios-card__header">
                <TituloSecao icone={<IconeIdosos />}>Selecione um Idoso</TituloSecao>
              </div>

              {!carregandoIdosos && !erroIdosos && idosos.length > 0 ? (
                <label className="cuidador-remedios-busca-idoso">
                  <span><IconeBusca /></span>
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou telefone..."
                    value={buscaIdoso}
                    onChange={(evento) => setBuscaIdoso(evento.target.value)}
                  />
                </label>
              ) : null}

              {carregandoIdosos ? (
                <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                  <p>Carregando idosos vinculados...</p>
                </div>
              ) : erroIdosos ? (
                <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                  <p>{erroIdosos}</p>
                  <small>Não foi possível carregar os idosos vinculados ao cuidador.</small>
                </div>
              ) : idosos.length > 0 && idososFiltrados.length > 0 ? (
                <div className="cuidador-remedios-idosos">
                  {idososFiltrados.map((idoso) => (
                    <button
                      className={`cuidador-remedios-idoso ${Number(idosoSelecionadoId) === Number(idoso.id) ? "cuidador-remedios-idoso--selecionado" : ""}`}
                      type="button"
                      key={idoso.id || idoso.cpf}
                      onClick={() => setIdosoSelecionadoId(idoso.id)}
                    >
                      <strong>{idoso.nome}</strong>
                      <span>CPF: {formatarCpf(idoso.cpf) || "Não informado"}</span>
                      <span>{formatarTelefone(idoso)}</span>
                    </button>
                  ))}
                </div>
              ) : idosos.length > 0 ? (
                <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                  <p>Nenhum idoso encontrado.</p>
                  <small>Tente buscar por outro nome, CPF ou telefone.</small>
                </div>
              ) : (
                <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                  <p>Nenhum idoso vinculado.</p>
                  <small>Quando houver idosos disponíveis, eles aparecerão aqui para seleção.</small>
                </div>
              )}
            </div>

            <div className="cuidador-remedios-card">
              <div className="cuidador-remedios-card__header">
                <TituloSecao icone={<IconeRemedio />}>Prescrições</TituloSecao>
                <button className="cuidador-remedios-prescrever" type="button" onClick={abrirCadastroPrescricao}>
                  <IconeMais />
                  Prescrever
                </button>
              </div>

              <div className="cuidador-remedios-lista cuidador-remedios-prescricoes-lista">
                {carregandoPrescricoes ? (
                  <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                    <p>Carregando prescrições...</p>
                  </div>
                ) : erroListagemPrescricao ? (
                  <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                    <p>{erroListagemPrescricao}</p>
                    <small>Não foi possível carregar as prescrições deste idoso.</small>
                  </div>
                ) : prescricoes.length > 0 ? (
                  prescricoes.map((prescricao) => (
                    <article className="cuidador-remedios-prescricao" key={prescricao.id}>
                      <div>
                        <div className="cuidador-remedios-prescricao__topo">
                          <h3>{prescricao.remedioNome || "Remédio não identificado"}</h3>
                          <span>{prescricao.necessarioJejum ? "Necessário jejum" : "Sem jejum"}</span>
                        </div>
                        <dl>
                          <div>
                            <dt>Dosagem</dt>
                            <dd>{prescricao.dosagem}</dd>
                          </div>
                          <div>
                            <dt>Intervalo</dt>
                            <dd>{prescricao.intervalo}h</dd>
                          </div>
                          <div>
                            <dt>Fim</dt>
                            <dd>{formatarData(prescricao.dataFim)}</dd>
                          </div>
                        </dl>
                      </div>
                      <div className="cuidador-remedios-item__acoes">
                        <BotaoIcone label="Visualizar prescrição" onClick={() => abrirVisualizacaoPrescricao(prescricao)}><IconeVisualizar /></BotaoIcone>
                        <BotaoIcone label="Editar prescrição" onClick={() => abrirEdicaoPrescricao(prescricao)}><IconeEditar /></BotaoIcone>
                        <BotaoIcone tipo="perigo" label="Remover prescrição" onClick={() => solicitarInativacaoPrescricao(prescricao)}><IconeLixeira /></BotaoIcone>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                    <p>Nenhuma prescrição registrada.</p>
                    <small>Cadastre um remédio e selecione um idoso para iniciar uma prescrição.</small>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="cuidador-remedios-card cuidador-remedios-card--fixo">
            <div className="cuidador-remedios-card__header">
              <TituloSecao icone={<IconeCalendario />}>Alertas</TituloSecao>
              <BotaoIcone label="Adicionar alerta de remédio" onClick={abrirCadastroAlertaRemedio}><IconeMais /></BotaoIcone>
            </div>

            <div className="cuidador-remedios-lista">
              {carregandoAlertasRemedio ? (
                <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                  <p>Carregando agenda...</p>
                </div>
              ) : erroAlertasRemedio ? (
                <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                  <p>{erroAlertasRemedio}</p>
                  <small>Não foi possível carregar os alertas deste idoso.</small>
                </div>
              ) : alertasRemedio.length > 0 ? (
                <>
                  {alertasRemedioPaginados.map((alerta) => (
                    <article className="cuidador-remedios-agenda" key={alerta.id}>
                      <div>
                        <div className="cuidador-remedios-agenda__badges">
                          <span>Remédio</span>
                          <span>{alerta.statusAlertas || alerta.status || "AGENDADO"}</span>
                        </div>
                        <time>{formatarDataHora(alerta.dataAgendada)}</time>
                        <p>{alerta.remedioNome || "Remédio prescrito"}</p>
                        <small>{alerta.idosoNome || idosoSelecionado?.nome || "Idoso selecionado"}</small>
                      </div>
                      <div className="cuidador-remedios-item__acoes">
                        <BotaoIcone tipo="perigo" label="Cancelar alerta" onClick={() => removerAlertaRemedio(alerta)}><IconeLixeira /></BotaoIcone>
                      </div>
                    </article>
                  ))}
                  <ControlesPaginacaoAgenda
                    paginaAtual={paginaAgendaAtual}
                    totalPaginas={totalPaginasAgenda}
                    onAnterior={() => setPaginaAgendaAtual((pagina) => Math.max(pagina - 1, 1))}
                    onProxima={() => setPaginaAgendaAtual((pagina) => Math.min(pagina + 1, totalPaginasAgenda))}
                  />
                </>
              ) : (
                <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                  <p>Nenhum evento agendado.</p>
                  <small>Os lembretes de medicação aparecerão aqui depois das prescrições.</small>
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>

      <BcModal aberto={modalAlertaRemedioAberto} onFechar={fecharCadastroAlertaRemedio}>
        <BcFormularioModal
          title="Novo Alerta de Remédio"
          subtitle="Informe quando o cuidador deve ser lembrado"
          error={erroAlertaRemedio}
          onSubmit={aoSalvarAlertaRemedio}
        >
          <div className="cuidador-remedios-agenda-paciente">
            <span>Idoso selecionado</span>
            <strong>{idosoSelecionado?.nome || "Nenhum idoso selecionado"}</strong>
            {idosoSelecionado ? <small>CPF: {formatarCpf(idosoSelecionado.cpf) || "Não informado"}</small> : null}
          </div>

          <div className="cuidador-remedios-campo">
            <label htmlFor="alerta-prescricao" className="bc-form-modal__label">Prescrição *</label>
            <select
              id="alerta-prescricao"
              name="prescricaoId"
              className="cuidador-remedios-select"
              value={formAlertaRemedio.prescricaoId}
              onChange={aoAlterarFormularioAlertaRemedio}
              disabled={prescricoes.length === 0}
            >
              <option value="">
                {prescricoes.length === 0 ? "Nenhuma prescrição disponível" : "Selecione uma prescrição"}
              </option>
              {prescricoes.map((prescricao) => (
                <option key={prescricao.id} value={prescricao.id}>
                  {prescricao.remedioNome || "Remedio"} - {prescricao.dosagem || "Sem dosagem"} - {prescricao.intervalo || "-"}h
                </option>
              ))}
            </select>
          </div>

          <BcCampoTexto
            label="Data e horário *"
            name="dataAgendada"
            type="datetime-local"
            value={formAlertaRemedio.dataAgendada}
            onChange={aoAlterarFormularioAlertaRemedio}
            min={obterDataHoraAtualParaInput()}
          />

          <BcBotao type="submit" loading={salvandoAlertaRemedio}>
            Cadastrar alerta
          </BcBotao>
        </BcFormularioModal>
      </BcModal>

      <BcModal aberto={modalRemedioAberto} onFechar={fecharCadastroRemedio}>
        <BcFormularioModal
          title={remedioEmEdicao ? "Editar Remédio" : "Novo Remédio"}
          subtitle={remedioEmEdicao ? "Atualize os dados abaixo" : "Preencha os dados para cadastrar"}
          error={erroCadastroRemedio}
          onSubmit={aoSalvarRemedio}
        >
          <BcCampoTexto
            label="Nome *"
            name="nome"
            placeholder="Insira o nome do remédio"
            value={formRemedio.nome}
            onChange={aoAlterarFormularioRemedio}
          />

          <BcFormularioModalAreaTexto
            id="observacao"
            label="Observação"
            name="observacao"
            placeholder="Observações importantes sobre o remédio..."
            value={formRemedio.observacao}
            onChange={aoAlterarFormularioRemedio}
          />

          <BcBotao type="submit" loading={salvandoRemedio}>
            {remedioEmEdicao ? "Salvar alterações" : "Cadastrar"}
          </BcBotao>
        </BcFormularioModal>
      </BcModal>

      <BcModal aberto={Boolean(remedioEmVisualizacao)} onFechar={fecharVisualizacaoRemedio}>
        <section className="cuidador-remedios-detalhes" aria-label="Dados do remédio">
          <header className="cuidador-remedios-detalhes__header">
            <span className="cuidador-remedios-detalhes__icone"><IconeRemedio /></span>
            <div>
              <h2>Dados do Remédio</h2>
              <p>Informações cadastradas para consulta.</p>
            </div>
          </header>

          <dl className="cuidador-remedios-detalhes__lista">
            <div>
              <dt>Nome</dt>
              <dd>{remedioEmVisualizacao?.nome || "-"}</dd>
            </div>
            <div>
              <dt>Observação</dt>
              <dd>{remedioEmVisualizacao?.observacao || "-"}</dd>
            </div>
          </dl>

          <BcBotao type="button" onClick={fecharVisualizacaoRemedio}>
            Fechar
          </BcBotao>
        </section>
      </BcModal>

      <BcModal aberto={Boolean(prescricaoEmVisualizacao)} onFechar={fecharVisualizacaoPrescricao}>
        <section className="cuidador-remedios-detalhes" aria-label="Dados da prescrição">
          <header className="cuidador-remedios-detalhes__header">
            <span className="cuidador-remedios-detalhes__icone"><IconeRemedio /></span>
            <div>
              <h2>Dados da Prescrição</h2>
              <p>Informações cadastradas para consulta.</p>
            </div>
          </header>

          <dl className="cuidador-remedios-detalhes__lista">
            <div>
              <dt>Idoso</dt>
              <dd>{prescricaoEmVisualizacao?.idosoNome || idosoSelecionado?.nome || "-"}</dd>
            </div>
            <div>
              <dt>Remédio</dt>
              <dd>{prescricaoEmVisualizacao?.remedioNome || "-"}</dd>
            </div>
            <div>
              <dt>Dosagem</dt>
              <dd>{prescricaoEmVisualizacao?.dosagem || "-"}</dd>
            </div>
            <div>
              <dt>Intervalo</dt>
              <dd>{prescricaoEmVisualizacao?.intervalo ? `${prescricaoEmVisualizacao.intervalo}h` : "-"}</dd>
            </div>
            <div>
              <dt>Fim</dt>
              <dd>{formatarData(prescricaoEmVisualizacao?.dataFim)}</dd>
            </div>
            <div>
              <dt>Jejum</dt>
              <dd>{prescricaoEmVisualizacao?.necessarioJejum ? "Necessário" : "Não necessário"}</dd>
            </div>
            <div>
              <dt>Instrução</dt>
              <dd>{prescricaoEmVisualizacao?.instrucao || "-"}</dd>
            </div>
          </dl>

          <BcBotao type="button" onClick={fecharVisualizacaoPrescricao}>
            Fechar
          </BcBotao>
        </section>
      </BcModal>

      <BcModal aberto={modalPrescricaoAberto} onFechar={fecharCadastroPrescricao}>
        <BcFormularioModal
          title={prescricaoEmEdicao ? "Editar Prescrição" : "Nova Prescrição"}
          subtitle={prescricaoEmEdicao ? "Atualize os dados da prescrição" : "Preencha os dados para criar uma prescrição para o idoso selecionado"}
          error={erroPrescricao}
          onSubmit={aoSalvarPrescricao}
          className="cuidador-remedios-prescricao-modal"
        >
          <div className="cuidador-remedios-prescricao-paciente">
            <span>Idoso selecionado</span>
            <strong>{idosoSelecionado?.nome || "Nenhum idoso selecionado"}</strong>
            {idosoSelecionado ? <small>CPF: {formatarCpf(idosoSelecionado.cpf) || "Não informado"}</small> : null}
          </div>

          <div className="cuidador-remedios-campo">
            <label htmlFor="prescricao-remedio" className="bc-form-modal__label">Remédio *</label>
            <div className="cuidador-remedios-combobox">
              <input
                id="prescricao-remedio"
                className="cuidador-remedios-select cuidador-remedios-combobox__input"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={sugestoesRemedioAbertas}
                aria-controls="prescricao-remedio-opcoes"
                placeholder="Digite o nome do remédio"
                value={buscaRemedioPrescricao}
                onChange={aoAlterarBuscaRemedioPrescricao}
                onFocus={() => setSugestoesRemedioAbertas(true)}
                onBlur={() => window.setTimeout(() => setSugestoesRemedioAbertas(false), 120)}
              />

              {sugestoesRemedioAbertas ? (
                <div className="cuidador-remedios-combobox__lista" id="prescricao-remedio-opcoes" role="listbox">
                  {remediosFiltradosPrescricao.length > 0 ? (
                    remediosFiltradosPrescricao.map((remedio) => (
                      <button
                        className={`cuidador-remedios-combobox__opcao ${Number(formPrescricao.remedioId) === Number(remedio.id) ? "cuidador-remedios-combobox__opcao--selecionada" : ""}`}
                        type="button"
                        role="option"
                        aria-selected={Number(formPrescricao.remedioId) === Number(remedio.id)}
                        key={remedio.id}
                        onMouseDown={(evento) => evento.preventDefault()}
                        onClick={() => aoSelecionarRemedioPrescricao(remedio)}
                      >
                        {remedio.nome}
                      </button>
                    ))
                  ) : (
                    <span className="cuidador-remedios-combobox__vazio">Nenhum remédio encontrado.</span>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <BcCampoTexto
            label="Dosagem *"
            name="dosagem"
            placeholder="Ex: 1 comprimido de 25g, 1 cápsula de 500mg, 10ml"
            value={formPrescricao.dosagem}
            onChange={aoAlterarFormularioPrescricao}
          />

          <BcCampoTexto
            label="Intervalo em horas *"
            name="intervalo"
            type="number"
            placeholder="Ex: 8"
            value={formPrescricao.intervalo}
            onChange={aoAlterarFormularioPrescricao}
            inputMode="decimal"
          />

          <BcCampoTexto
            label="Data final"
            name="dataFim"
            type="date"
            value={formPrescricao.dataFim}
            onChange={aoAlterarFormularioPrescricao}
          />

          <div className="cuidador-remedios-campo">
            <label htmlFor="prescricao-jejum" className="bc-form-modal__label">Necessário jejum?</label>
            <select
              id="prescricao-jejum"
              name="necessarioJejum"
              className="cuidador-remedios-select"
              value={formPrescricao.necessarioJejum}
              onChange={aoAlterarFormularioPrescricao}
            >
              <option value="false">Nao</option>
              <option value="true">Sim</option>
            </select>
          </div>

          <BcFormularioModalAreaTexto
            id="prescricao-instrucao"
            label="Instrução"
            name="instrucao"
            placeholder="Orientações importantes sobre a administração..."
            value={formPrescricao.instrucao}
            onChange={aoAlterarFormularioPrescricao}
          />

          <BcBotao type="submit" loading={salvandoPrescricao} disabled={inativandoPrescricao}>
            {prescricaoEmEdicao ? "Salvar alterações" : "Criar prescrição"}
          </BcBotao>
        </BcFormularioModal>
      </BcModal>

      <BcConfirmacao
        aberto={Boolean(confirmacao)}
        titulo={confirmacao?.titulo}
        mensagem={confirmacao?.mensagem}
        textoConfirmar={confirmacao?.textoConfirmar}
        textoCarregando={confirmacao?.textoCarregando}
        carregando={inativandoRemedio || inativandoPrescricao}
        icone={<IconeLixeira />}
        onCancelar={() => setConfirmacao(null)}
        onConfirmar={aoConfirmarAcaoPendente}
      />
    </div>
  );
}
