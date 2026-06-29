import { useCallback, useEffect, useState } from "react";
import BcBotao from "../../../components/BcBotao/BcBotao";
import BcFormularioModal, { BcFormularioModalLinha, BcFormularioModalAreaTexto } from "../../../components/BcFormularioModal/BcFormularioModal";
import BcCampoTexto from "../../../components/BcCampoTexto/BcCampoTexto";
import BcForcaSenha from "../../../components/BcForcaSenha/BcForcaSenha";
import BcListagem from "../../../components/BcListagem/BcListagem";
import BcModal from "../../../components/BcModal/BcModal";
import BcBarraSuperior from "../../../components/BcBarraSuperior/BcBarraSuperior";
import BcNotificacao, { useBcNotificacao } from "../../../components/BcNotificacao/BcNotificacao";
import SecaoRelatorio from "../../../components/SecaoRelatorio/SecaoRelatorio";
import ModalGerenciarCuidadores from "../../../components/ModalGerenciarCuidadores/ModalGerenciarCuidadores";
import ModalEmergencia from "../../../components/ModalEmergencia/ModalEmergencia";
import {
  atualizarCuidador as atualizarCuidadorApi,
  atualizarIdoso as atualizarIdosoApi,
  buscarIdosoPorCpf,
  cadastrarCuidador,
  cadastrarIdoso,
  excluirCuidador,
  excluirIdoso,
  listarCuidadores,
  listarIdosos,
  reativarCuidador,
} from "../../../api/instituicaoApi";
import { buscarDadosRelatorioInstituicao } from "../../../api/relatorioinstituicaoapi";
import { gerarRelatorioInstituicaoPDF } from "../../../utils/gerarRelatorioInstituicaoPDF";
import {
  IconeCuidadores,
  IconeIdosos,
  IconeOlhoAberto,
  IconeOlhoFechado,
  IconeSair,
} from "../../../components/icones/Icones";
import { verificarCpfDisponivel, validarCpf, extrairSomenteNumeros, validarCelular } from "../../../utils/validacaoDocumento";
import "./PainelInstituicao.css";

const IconePessoa = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const IconeIdosoCard = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    <path d="M9 17l-1 4M15 17l1 4" />
  </svg>
);

/* Ícone de telefone/emergência para o botão da tabela */
const IconeTelefoneEmergencia = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" />
  </svg>
);

const RELATORIO_INICIAL = {
  cuidadores: { total: 0, ativos: 0, inativos: 0, lista: [] },
  idosos:     { total: 0, ativos: 0, inativos: 0, lista: [] },
};

export default function PainelInstituicao({ onLogout }) {
  const { toastProps, mostrarToast } = useBcNotificacao();

  const [modalCuidadorAberto, setModalCuidadorAberto]   = useState(false);
  const [modalIdosoAberto, setModalIdosoAberto]         = useState(false);
  const [cuidadorEmEdicao, setCuidadorEmEdicao]         = useState(null);
  const [cuidadorParaReativar, setCuidadorParaReativar] = useState(null);
  const [cuidadoresInativos, setCuidadoresInativos]     = useState([]);
  const [idosoEmEdicao, setIdosoEmEdicao]               = useState(null);
  const [idosoParaReativar, setIdosoParaReativar]       = useState(null);
  const [cuidadores, setCuidadores]                     = useState([]);
  const [idosos, setIdosos]                             = useState([]);
  const [buscaCuidador, setBuscaCuidador]               = useState("");
  const [buscaIdoso, setBuscaIdoso]                     = useState("");
  const [carregandoCuidadores, setCarregandoCuidadores] = useState(true);
  const [carregandoIdosos, setCarregandoIdosos]         = useState(true);
  const [salvandoCuidador, setSalvandoCuidador]         = useState(false);
  const [salvandoIdoso, setSalvandoIdoso]               = useState(false);
  const [excluindoCuidador, setExcluindoCuidador]       = useState(false);
  const [excluindoIdoso, setExcluindoIdoso]             = useState(false);
  const [erroCuidador, setErroCuidador]                 = useState("");
  const [erroIdoso, setErroIdoso]                       = useState("");
  const [idosoGerenciar, setIdosoGerenciar]             = useState(null);
  const [idosoEmergencia, setIdosoEmergencia]           = useState(null);
  const [mostrarSenhaCuidador, setMostrarSenhaCuidador] = useState(false);
  const [mostrarConfirmarSenhaCuidador, setMostrarConfirmarSenhaCuidador] = useState(false);

  const [dadosRelatorio, setDadosRelatorio] = useState(RELATORIO_INICIAL);
  const [carregandoRel, setCarregandoRel]   = useState(false);
  const [erroRel, setErroRel]               = useState("");
  const [baixando, setBaixando]             = useState(false);

  const [consultaCpfIdoso, setConsultaCpfIdoso] = useState({
    carregando: false, consultado: false, idoso: null,
  });

  const [formCuidador, setFormCuidador] = useState({
    cpf: "", nome: "", email: "", senha: "", confirmarSenha: "", ddd: "", telefone: "", contatoId: null,
  });

  const [formIdoso, setFormIdoso] = useState({
    nome: "", cpf: "", observacoes: "", ddd: "", telefone: "", contatoId: null,
  });

  const carregarCuidadores = useCallback(async () => {
    try {
      setCarregandoCuidadores(true); setErroCuidador("");
      setCuidadores(await listarCuidadores());
    } catch (erro) {
      setErroCuidador(erro.message);
      mostrarToast("erro", "Erro ao carregar cuidadores", erro.message);
    } finally { setCarregandoCuidadores(false); }
  }, [mostrarToast]);

  const carregarIdosos = useCallback(async () => {
    try {
      setCarregandoIdosos(true); setErroIdoso("");
      setIdosos(await listarIdosos());
    } catch (erro) {
      setErroIdoso(erro.message);
      mostrarToast("erro", "Erro ao carregar idosos", erro.message);
    } finally { setCarregandoIdosos(false); }
  }, [mostrarToast]);

  const carregarRelatorio = useCallback(async () => {
    setCarregandoRel(true); setErroRel("");
    try {
      setDadosRelatorio(await buscarDadosRelatorioInstituicao());
    } catch (err) {
      setErroRel(err.message || "Erro ao carregar dados do relatório.");
    } finally { setCarregandoRel(false); }
  }, []);

  useEffect(() => {
    carregarCuidadores();
    carregarIdosos();
    carregarRelatorio();
  }, [carregarCuidadores, carregarIdosos, carregarRelatorio]);

  useEffect(() => {
    const instituicaoId = localStorage.getItem("usuarioId") || sessionStorage.getItem("usuarioId");
    const chave = `cuidadoresInativos:${instituicaoId || "atual"}`;
    const salvos = JSON.parse(localStorage.getItem(chave) || "[]");
    setCuidadoresInativos(Array.isArray(salvos) ? salvos : []);
  }, []);

  useEffect(() => {
    const cpfLimpo = extrairSomenteNumeros(formIdoso.cpf);
    if (!modalIdosoAberto || idosoEmEdicao || cpfLimpo.length !== 11) {
      setConsultaCpfIdoso({ carregando: false, consultado: false, idoso: null });
      setIdosoParaReativar(null);
      return;
    }
    let cancelado = false;
    async function verificarCpfIdoso() {
      try {
        setConsultaCpfIdoso({ carregando: true, consultado: false, idoso: null });
        const idosoEncontrado = await buscarIdosoPorCpf(cpfLimpo);
        if (!cancelado) {
          const statusIdoso = String(idosoEncontrado?.status || "").toUpperCase();
          setConsultaCpfIdoso({ carregando: false, consultado: true, idoso: idosoEncontrado });
          if (statusIdoso === "INATIVO") {
            setIdosoParaReativar(idosoEncontrado);
            setErroIdoso("");
            setFormIdoso((ant) => ({
              ...ant,
              cpf: formatarCpf(String(idosoEncontrado.cpf || cpfLimpo)),
              nome: idosoEncontrado.nome || "",
              observacoes: idosoEncontrado.observacoes || "",
              ddd: idosoEncontrado.contato?.ddd ? String(idosoEncontrado.contato.ddd) : "",
              telefone: idosoEncontrado.contato?.telefone ? formatarTelefone(String(idosoEncontrado.contato.telefone)) : "",
              contatoId: idosoEncontrado.contatoId || idosoEncontrado.contato?.id || null,
            }));
            return;
          }
          setIdosoParaReativar(null);
          if (statusIdoso === "ATIVO") setErroIdoso("CPF já cadastrado para um idoso ativo.");
        }
      } catch (erro) {
        if (!cancelado) {
          setConsultaCpfIdoso({ carregando: false, consultado: false, idoso: null });
          setErroIdoso(erro.message);
        }
      }
    }
    verificarCpfIdoso();
    return () => { cancelado = true; };
  }, [formIdoso.cpf, idosoEmEdicao, modalIdosoAberto]);

  const cuidadoresFiltrados = cuidadores.filter((c) =>
    String(c.nome || "").toLowerCase().includes(buscaCuidador.toLowerCase()) ||
    String(c.cpf || "").includes(buscaCuidador.replace(/\D/g, "")) ||
    String(c.email || "").toLowerCase().includes(buscaCuidador.toLowerCase())
  );

  const idososFiltrados = idosos.filter((i) =>
    String(i.nome || "").toLowerCase().includes(buscaIdoso.toLowerCase()) ||
    String(i.cpf || "").includes(buscaIdoso.replace(/\D/g, ""))
  );

  function formatarCpf(valor) {
    const n = valor.replace(/\D/g, "").slice(0, 11);
    return n.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatarTelefone(valor) {
    const n = valor.replace(/\D/g, "").slice(0, 9);
    return n.replace(/(\d{5})(\d{0,4})$/, "$1-$2").replace(/-$/, "");
  }

  function atualizarCuidador(evento) {
    const { name, value } = evento.target;
    let novoValor = value;
    if (name === "cpf") novoValor = formatarCpf(value);
    if (name === "ddd") novoValor = value.replace(/\D/g, "").slice(0, 2);
    if (name === "telefone") novoValor = formatarTelefone(value);
    if (name === "cpf") {
      const cpfDigitado = extrairSomenteNumeros(novoValor);
      const encontrado = cuidadoresInativos.find((c) => !verificarCpfDisponivel(cpfDigitado, [c]));
      if (cpfDigitado.length === 11 && encontrado) {
        setCuidadorParaReativar(encontrado);
        setErroCuidador("");
        setFormCuidador((ant) => ({
          ...ant, cpf: novoValor, nome: encontrado.nome || "", email: encontrado.email || "", senha: "", confirmarSenha: "",
          ddd: encontrado.contato?.ddd ? String(encontrado.contato.ddd) : "",
          telefone: encontrado.contato?.telefone ? formatarTelefone(String(encontrado.contato.telefone)) : "",
          contatoId: encontrado.contatoId || encontrado.contato?.id || null,
        }));
        return;
      }
      setCuidadorParaReativar(null);
    }
    setFormCuidador((ant) => ({ ...ant, [name]: novoValor }));
  }

  function atualizarIdoso(evento) {
    const { name, value } = evento.target;
    let novoValor = value;
    if (name === "cpf") novoValor = formatarCpf(value);
    if (name === "ddd") novoValor = value.replace(/\D/g, "").slice(0, 2);
    if (name === "telefone") novoValor = formatarTelefone(value);
    if (name === "cpf") setErroIdoso("");
    setFormIdoso((ant) => ({ ...ant, [name]: novoValor }));
  }

  function limparFormularioCuidador() {
    setFormCuidador({ cpf: "", nome: "", email: "", senha: "", confirmarSenha: "", ddd: "", telefone: "", contatoId: null });
    setCuidadorParaReativar(null);
    setMostrarSenhaCuidador(false);
    setMostrarConfirmarSenhaCuidador(false);
  }

  function limparFormularioIdoso() {
    setFormIdoso({ nome: "", cpf: "", observacoes: "", ddd: "", telefone: "", contatoId: null });
    setConsultaCpfIdoso({ carregando: false, consultado: false, idoso: null });
    setIdosoParaReativar(null);
  }

  function abrirEdicaoCuidador(cuidador) {
    setErroCuidador(""); setCuidadorEmEdicao(cuidador);
    setFormCuidador({
      cpf: formatarCpf(String(cuidador.cpf || "")), nome: cuidador.nome || "", email: cuidador.email || "", senha: "", confirmarSenha: "",
      ddd: cuidador.contato?.ddd ? String(cuidador.contato.ddd) : "",
      telefone: cuidador.contato?.telefone ? formatarTelefone(String(cuidador.contato.telefone)) : "",
      contatoId: cuidador.contatoId || cuidador.contato?.id || null,
    });
    setModalCuidadorAberto(true);
  }

  function abrirCadastroIdoso() { setErroIdoso(""); setIdosoEmEdicao(null); limparFormularioIdoso(); setModalIdosoAberto(true); }
  function abrirEdicaoIdoso(idoso) {
    setErroIdoso(""); setIdosoEmEdicao(idoso); setIdosoParaReativar(null);
    setFormIdoso({
      nome: idoso.nome || "", cpf: formatarCpf(String(idoso.cpf || "")), observacoes: idoso.observacoes || "",
      ddd: idoso.contato?.ddd ? String(idoso.contato.ddd) : "",
      telefone: idoso.contato?.telefone ? formatarTelefone(String(idoso.contato.telefone)) : "",
      contatoId: idoso.contatoId || idoso.contato?.id || null,
    });
    setModalIdosoAberto(true);
  }
  function fecharModalIdoso() { setModalIdosoAberto(false); setIdosoEmEdicao(null); setIdosoParaReativar(null); setErroIdoso(""); limparFormularioIdoso(); }
  function abrirCadastroCuidador() { setErroCuidador(""); setCuidadorEmEdicao(null); limparFormularioCuidador(); setModalCuidadorAberto(true); }
  function fecharModalCuidador() { setErroCuidador(""); setModalCuidadorAberto(false); setCuidadorEmEdicao(null); limparFormularioCuidador(); }

  function validarEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

  function validarIdoso() {
    const s = String(consultaCpfIdoso.idoso?.status || "").toUpperCase();
    if (!idosoEmEdicao && s === "ATIVO") return "CPF já cadastrado para um idoso ativo.";
    if (!formIdoso.nome.trim()) return "Informe o nome do idoso.";
    if (!validarCpf(formIdoso.cpf)) return "CPF inválido.";
    if (!idosoEmEdicao && !verificarCpfDisponivel(formIdoso.cpf, cuidadores)) return "CPF já está em uso por um cuidador.";
    if (!validarCelular(formIdoso.ddd, formIdoso.telefone)) return "Telefone celular inválido. Formato esperado: (XX) 9XXXX-XXXX";
    return null;
  }

  function validarCuidador() {
    if (!validarCpf(formCuidador.cpf)) return "CPF inválido.";
    if (!cuidadorEmEdicao && !cuidadorParaReativar && !verificarCpfDisponivel(formCuidador.cpf, cuidadores, idosos)) return "CPF já está em uso.";
    if (!formCuidador.nome.trim()) return "Informe o nome do cuidador.";
    if (!validarEmail(formCuidador.email.trim())) return "Informe um e-mail válido.";
    if (!cuidadorEmEdicao && !cuidadorParaReativar && !formCuidador.senha.trim()) return "Informe a senha do cuidador.";
    if (formCuidador.senha.trim() && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(formCuidador.senha)) {
      return "A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.";
    }
    if (formCuidador.senha.trim() && !formCuidador.confirmarSenha.trim()) return "Confirme a senha do cuidador.";
    if (formCuidador.senha.trim() && formCuidador.senha !== formCuidador.confirmarSenha) return "As senhas não coincidem.";
    if (!validarCelular(formCuidador.ddd, formCuidador.telefone)) return "Telefone celular inválido. Formato esperado: (XX) 9XXXX-XXXX";
    return null;
  }

  function removerCuidadorInativo(cpf) {
    const id = localStorage.getItem("usuarioId") || sessionStorage.getItem("usuarioId");
    const chave = `cuidadoresInativos:${id || "atual"}`;
    setCuidadoresInativos((ant) => {
      const att = ant.filter((c) => extrairSomenteNumeros(c.cpf) !== extrairSomenteNumeros(cpf));
      localStorage.setItem(chave, JSON.stringify(att));
      return att;
    });
  }

  function guardarCuidadorInativo(cuidadorInativo) {
    const id = localStorage.getItem("usuarioId") || sessionStorage.getItem("usuarioId");
    const chave = `cuidadoresInativos:${id || "atual"}`;
    setCuidadoresInativos((ant) => {
      const sem = ant.filter((c) => extrairSomenteNumeros(c.cpf) !== extrairSomenteNumeros(cuidadorInativo.cpf));
      const att = [cuidadorInativo, ...sem];
      localStorage.setItem(chave, JSON.stringify(att));
      return att;
    });
  }

  async function aoEnviarFormularioCuidador(evento) {
    evento.preventDefault();
    const erroV = validarCuidador();
    if (erroV) { setErroCuidador(erroV); return; }
    try {
      setSalvandoCuidador(true); setErroCuidador("");
      if (cuidadorEmEdicao) {
        const att = await atualizarCuidadorApi(cuidadorEmEdicao.id, formCuidador);
        setCuidadores((ant) => ant.map((c) => c.id === att?.id ? att : c));
        mostrarToast("sucesso", "Cuidador atualizado", `Os dados de ${formCuidador.nome} foram salvos.`);
      } else if (cuidadorParaReativar) {
        const reativado = await reativarCuidador(cuidadorParaReativar.id, formCuidador);
        if (reativado) setCuidadores((ant) => [reativado, ...ant]);
        removerCuidadorInativo(formCuidador.cpf);
        mostrarToast("sucesso", "Cuidador reativado", `${formCuidador.nome} foi reativado com sucesso.`);
      } else {
        const novo = await cadastrarCuidador(formCuidador);
        if (novo) setCuidadores((ant) => [novo, ...ant]);
        mostrarToast("sucesso", "Cuidador cadastrado", `${formCuidador.nome} foi cadastrado com sucesso.`);
      }
      fecharModalCuidador();
      await carregarCuidadores();
      await carregarRelatorio();
    } catch (erro) {
      setErroCuidador(erro.message);
      mostrarToast("erro", cuidadorEmEdicao ? "Erro ao atualizar cuidador" : cuidadorParaReativar ? "Erro ao reativar cuidador" : "Erro ao cadastrar cuidador", erro.message);
    } finally { setSalvandoCuidador(false); }
  }

  async function aoExcluirCuidador(cuidador) {
    try {
      setExcluindoCuidador(true); setErroCuidador("");
      await excluirCuidador(cuidador.id);
      guardarCuidadorInativo(cuidador);
      await carregarCuidadores();
      await carregarRelatorio();
      mostrarToast("sucesso", "Cuidador desativado", `${cuidador.nome} foi removido da listagem.`);
    } catch (erro) {
      setErroCuidador(erro.message);
      mostrarToast("erro", "Erro ao desativar cuidador", erro.message);
    } finally { setExcluindoCuidador(false); }
  }

  async function aoEnviarFormularioIdoso(evento) {
    evento.preventDefault();
    const erroV = validarIdoso();
    if (erroV) { setErroIdoso(erroV); return; }
    try {
      setSalvandoIdoso(true); setErroIdoso("");
      if (idosoEmEdicao) {
        const att = await atualizarIdosoApi(idosoEmEdicao.id, formIdoso);
        setIdosos((ant) => ant.map((i) => i.id === att?.id ? att : i));
        mostrarToast("sucesso", "Idoso atualizado", `Os dados de ${formIdoso.nome} foram salvos.`);
      } else {
        const novo = await cadastrarIdoso(formIdoso);
        if (novo) setIdosos((ant) => [novo, ...ant]);
        mostrarToast("sucesso", idosoParaReativar ? "Idoso reativado" : "Idoso cadastrado",
          idosoParaReativar ? `${formIdoso.nome} foi reativado com sucesso.` : `${formIdoso.nome} foi cadastrado com sucesso.`);
      }
      fecharModalIdoso();
      await carregarIdosos();
      await carregarRelatorio();
    } catch (erro) {
      setErroIdoso(erro.message);
      mostrarToast("erro", idosoEmEdicao ? "Erro ao atualizar idoso" : idosoParaReativar ? "Erro ao reativar idoso" : "Erro ao cadastrar idoso", erro.message);
    } finally { setSalvandoIdoso(false); }
  }

  async function aoExcluirIdoso(idoso) {
    try {
      setExcluindoIdoso(true); setErroIdoso("");
      await excluirIdoso(idoso.id);
      await carregarIdosos();
      await carregarRelatorio();
      mostrarToast("sucesso", "Idoso desativado", `${idoso.nome} foi removido da listagem.`);
    } catch (erro) {
      setErroIdoso(erro.message);
      mostrarToast("erro", "Erro ao desativar idoso", erro.message);
    } finally { setExcluindoIdoso(false); }
  }

  async function aoBaixarRelatorio() {
    setBaixando(true);
    try {
      const dados = await buscarDadosRelatorioInstituicao();
      setDadosRelatorio(dados);
      gerarRelatorioInstituicaoPDF(dados);
    } catch (err) {
      mostrarToast("erro", "Erro ao gerar relatório", err.message);
    } finally { setBaixando(false); }
  }

  /* ── Colunas dos idosos com botão de emergência ── */
  const colunasIdosos = [
    { chave: "nome", titulo: "Nome", className: "bc-listagem-tdNome" },
    { chave: "cpf", titulo: "CPF", className: "bc-listagem-tdMuted", render: (i) => formatarCpf(String(i.cpf || "")) },
    { chave: "contato", titulo: "Contato", className: "bc-listagem-tdMuted bc-listagem-tdContato",
      render: (i) => i.contato ? `(${i.contato.ddd}) ${formatarTelefone(String(i.contato.telefone || ""))}` : "-" },
    { chave: "observacoes", titulo: "Observações", className: "bc-listagem-tdMuted", render: (i) => i.observacoes || "-" },
    {
      chave: "_emergencia",
      titulo: "Emergência",
      className: "bc-listagem-tdMuted",
      render: (i) => (
        <button
          type="button"
          className="iph-btn-emergencia"
          onClick={(e) => { e.stopPropagation(); setIdosoEmergencia(i); }}
          title="Gerenciar contato de emergência"
        >
          <IconeTelefoneEmergencia />
          Emergência
        </button>
      ),
    },
  ];

  const senhasCuidadorCoincidem = formCuidador.confirmarSenha.length > 0 && formCuidador.senha === formCuidador.confirmarSenha;

  return (
    <div className="instituicao-home">
      <BcNotificacao {...toastProps} />

      <BcBarraSuperior
        title="Painel da Instituição"
        subtitle="Gestão de Cuidadores e Idosos"
        actionLabel="Sair"
        actionIcon={<IconeSair />}
        onAction={onLogout}
      />

      <main className="instituicao-home__content">
        <div className="instituicao-home__grid">

          {/* ── Cuidadores ── */}
          <div className="instituicao-home__listagem">
            <BcListagem
              titulo="Cuidadores Cadastrados"
              iconeTitulo={<IconeCuidadores />}
              itens={cuidadoresFiltrados}
              colunas={[
                { chave: "nome", titulo: "Nome", className: "bc-listagem-tdNome" },
                { chave: "cpf", titulo: "CPF", className: "bc-listagem-tdMuted", render: (c) => formatarCpf(String(c.cpf || "")) },
                { chave: "email", titulo: "E-mail", className: "bc-listagem-tdMuted", render: (c) => c.email || "-" },
                { chave: "contato", titulo: "Contato", className: "bc-listagem-tdMuted bc-listagem-tdContato",
                  render: (c) => c.contato ? `(${c.contato.ddd}) ${formatarTelefone(String(c.contato.telefone || ""))}` : "-" },
              ]}
              busca={buscaCuidador}
              placeholderBusca="Buscar por nome, CPF ou e-mail..."
              onBuscaChange={setBuscaCuidador}
              textoBotao="Cadastrar Cuidador"
              onBotaoClick={abrirCadastroCuidador}
              textoVazio={buscaCuidador ? "Nenhum cuidador encontrado." : "Nenhum cuidador cadastrado ainda."}
              carregando={carregandoCuidadores}
              textoCarregando="Carregando cuidadores..."
              erro={modalCuidadorAberto ? "" : erroCuidador}
              onEditar={abrirEdicaoCuidador}
              onExcluir={aoExcluirCuidador}
              tituloConfirmacao="Inativar cuidador?"
              mensagemConfirmacao="O cuidador será inativado na listagem, mas poderá ser reativado ao cadastrar o mesmo CPF."
              textoConfirmar="Sim, inativar"
              textoCarregandoExcluir="Inativando..."
              excluindo={excluindoCuidador}
              itensPorPagina={10}
            />
          </div>

          {/* ── Idosos ── */}
          <div className="instituicao-home__listagem">
            <BcListagem
              titulo="Idosos Cadastrados"
              iconeTitulo={<IconeIdosos />}
              itens={idososFiltrados}
              colunas={colunasIdosos}
              busca={buscaIdoso}
              placeholderBusca="Buscar por nome ou CPF..."
              onBuscaChange={setBuscaIdoso}
              textoBotao="Cadastrar Idoso"
              onBotaoClick={abrirCadastroIdoso}
              textoVazio={buscaIdoso ? "Nenhum idoso encontrado." : "Nenhum idoso cadastrado ainda."}
              carregando={carregandoIdosos}
              textoCarregando="Carregando idosos..."
              erro={modalIdosoAberto ? "" : erroIdoso}
              onVisualizar={(idoso) => setIdosoGerenciar(idoso)}
              onEditar={abrirEdicaoIdoso}
              onExcluir={aoExcluirIdoso}
              tituloConfirmacao="Desativar idoso?"
              mensagemConfirmacao="O idoso será removido da listagem, mas poderá ser reativado ao cadastrar o mesmo CPF."
              textoConfirmar="Sim, desativar"
              textoCarregandoExcluir="Desativando..."
              excluindo={excluindoIdoso}
            />
          </div>
        </div>

        {/* ── Relatório ── */}
        <SecaoRelatorio
          titulo="Relatório da Instituição"
          subtitulo="Visão consolidada de cuidadores e idosos cadastrados."
          carregando={carregandoRel}
          erro={erroRel}
          baixando={baixando}
          cards={[
            { icone: <IconePessoa />, titulo: "Cuidadores", total: dadosRelatorio.cuidadores.total, ativos: dadosRelatorio.cuidadores.ativos, inativos: dadosRelatorio.cuidadores.inativos },
            { icone: <IconeIdosoCard />, titulo: "Idosos", total: dadosRelatorio.idosos.total, ativos: dadosRelatorio.idosos.ativos, inativos: dadosRelatorio.idosos.inativos },
          ]}
          onBaixar={aoBaixarRelatorio}
        />
      </main>

      {/* Modal gerenciar cuidadores do idoso */}
      <ModalGerenciarCuidadores
        aberto={!!idosoGerenciar}
        onFechar={() => setIdosoGerenciar(null)}
        idoso={idosoGerenciar}
        cuidadores={cuidadores}
      />

      {/* Modal emergência */}
      <ModalEmergencia
        aberto={!!idosoEmergencia}
        onFechar={() => setIdosoEmergencia(null)}
        idoso={idosoEmergencia}
      />

      {/* Modal cadastro/edição de cuidador */}
      <BcModal aberto={modalCuidadorAberto} onFechar={fecharModalCuidador}>
        <BcFormularioModal
          title={cuidadorEmEdicao ? "Editar Cuidador" : cuidadorParaReativar ? "Reativar Cuidador" : "Novo Cuidador"}
          subtitle={cuidadorEmEdicao ? "Atualize os dados abaixo" : cuidadorParaReativar ? "Confira os dados antes de reativar" : "Preencha os dados para cadastrar"}
          error={erroCuidador}
          onSubmit={aoEnviarFormularioCuidador}
        >
          <BcCampoTexto label="CPF *" name="cpf" placeholder="000.000.000-00" value={formCuidador.cpf} onChange={atualizarCuidador} maxLength={14} />
          <BcCampoTexto label="Nome *" name="nome" placeholder="Insira um nome" value={formCuidador.nome} onChange={atualizarCuidador} />
          <BcCampoTexto label="E-mail *" name="email" type="email" placeholder="nome@email.com" value={formCuidador.email} onChange={atualizarCuidador} />
          <BcCampoTexto
            label={cuidadorEmEdicao || cuidadorParaReativar ? "Senha" : "Senha *"}
            name="senha"
            type={mostrarSenhaCuidador ? "text" : "password"}
            placeholder={cuidadorEmEdicao || cuidadorParaReativar ? "Preencha apenas se quiser alterar" : ""}
            value={formCuidador.senha}
            onChange={atualizarCuidador}
            autoComplete="new-password"
            suffix={
              <button type="button" className="bc-form-modal__icon-button" onClick={() => setMostrarSenhaCuidador((v) => !v)}>
                {mostrarSenhaCuidador ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
              </button>
            }
            hint={<BcForcaSenha password={formCuidador.senha} />}
          />
          <BcCampoTexto
            label={cuidadorEmEdicao || cuidadorParaReativar ? "Confirmar senha" : "Confirmar senha *"}
            name="confirmarSenha"
            type={mostrarConfirmarSenhaCuidador ? "text" : "password"}
            placeholder={cuidadorEmEdicao || cuidadorParaReativar ? "Repita apenas se quiser alterar" : ""}
            value={formCuidador.confirmarSenha}
            onChange={atualizarCuidador}
            autoComplete="new-password"
            suffix={
              <button type="button" className="bc-form-modal__icon-button" onClick={() => setMostrarConfirmarSenhaCuidador((v) => !v)}>
                {mostrarConfirmarSenhaCuidador ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
              </button>
            }
            hint={
              formCuidador.confirmarSenha.length > 0 ? (
                <span className="bc-form-modal__match" style={{ color: senhasCuidadorCoincidem ? "#0d9e8a" : "#e05252" }}>
                  {senhasCuidadorCoincidem ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
                </span>
              ) : null
            }
          />
          <BcFormularioModalLinha>
            <BcCampoTexto label="DDD *" name="ddd" placeholder="11" value={formCuidador.ddd} onChange={atualizarCuidador} maxLength={2} />
            <BcCampoTexto label="Telefone *" name="telefone" placeholder="99000-0000" value={formCuidador.telefone} onChange={atualizarCuidador} maxLength={10} />
          </BcFormularioModalLinha>
          <BcBotao type="submit" loading={salvandoCuidador}>
            {cuidadorEmEdicao ? "Salvar alterações" : cuidadorParaReativar ? "Reativar" : "Cadastrar"}
          </BcBotao>
        </BcFormularioModal>
      </BcModal>

      {/* Modal cadastro/edição de idoso */}
      <BcModal aberto={modalIdosoAberto} onFechar={fecharModalIdoso}>
        <BcFormularioModal
          title={idosoEmEdicao ? "Editar Idoso" : idosoParaReativar ? "Reativar Idoso" : "Novo Idoso"}
          subtitle={idosoEmEdicao ? "Atualize os dados abaixo" : idosoParaReativar ? "Confira os dados antes de reativar" : "Preencha os dados para cadastrar"}
          error={erroIdoso}
          onSubmit={aoEnviarFormularioIdoso}
        >
          <BcCampoTexto label="CPF *" name="cpf" placeholder="000.000.000-00" value={formIdoso.cpf} onChange={atualizarIdoso} inputMode="numeric" maxLength={14} />
          <BcCampoTexto label="Nome *" name="nome" placeholder="Insira um nome" value={formIdoso.nome} onChange={atualizarIdoso} />
          <BcFormularioModalAreaTexto id="observacoes" label="Observações" name="observacoes" placeholder="Observações importantes sobre o idoso..." value={formIdoso.observacoes} onChange={atualizarIdoso} />
          <BcFormularioModalLinha>
            <BcCampoTexto label="DDD *" name="ddd" placeholder="11" value={formIdoso.ddd} onChange={atualizarIdoso} maxLength={2} />
            <BcCampoTexto label="Telefone *" name="telefone" placeholder="99000-0000" value={formIdoso.telefone} onChange={atualizarIdoso} maxLength={10} />
          </BcFormularioModalLinha>
          <BcBotao type="submit" loading={salvandoIdoso}>
            {idosoEmEdicao ? "Salvar alterações" : idosoParaReativar ? "Reativar" : "Cadastrar"}
          </BcBotao>
        </BcFormularioModal>
      </BcModal>
    </div>
  );
}
