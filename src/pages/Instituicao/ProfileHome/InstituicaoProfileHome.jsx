import { useCallback, useEffect, useState } from "react";
import BcButton from "../../../components/Bcbutton/BcButton";
import BcFormModal, { BcFormModalRow, BcFormModalTextarea } from "../../../components/BcFormModal/BcFormModal";
import BcInput from "../../../components/Bcinput/BcInput";
import BcListagem from "../../../components/BcListagem/BcListagem";
import BcModal from "../../../components/BcModal/BcModal";
import BcTopbar from "../../../components/BcTopbar/BcTopbar";
import BcToast, { useBcToast } from "../../../components/BcToast/BcToast";
import ModalGerenciarCuidadores from "../../../components/Modalgerenciarcuidadores/Modalgerenciarcuidadores";
import {
  atualizarCuidador as atualizarCuidadorApi,
  atualizarIdoso as atualizarIdosoApi,
  buscarIdosoPorCpf,
  cadastrarCuidador,
  cadastrarIdoso,
  deletarCuidador,
  deletarIdoso,
  listarCuidadores,
  listarIdosos,
  reativarCuidador,
} from "../../../api/instituicaoApi";
import {
  IconeCuidadores,
  IconeIdosos,
  IconeSair,
} from "../../../components/icons/Icons";
import { cpfValido, somenteNumeros } from "../../../utils/validacaoDocumento";
import "./InstituicaoProfileHome.css";

export default function InstituicaoProfileHome({ onLogout }) {
  const { toastProps, mostrarToast } = useBcToast();

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

  // Modal de gerenciar cuidadores do idoso
  const [idosoGerenciar, setIdosoGerenciar] = useState(null);

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
      setCarregandoCuidadores(true);
      setErroCuidador("");
      const lista = await listarCuidadores();
      setCuidadores(lista);
    } catch (erro) {
      setErroCuidador(erro.message);
      mostrarToast("erro", "Erro ao carregar cuidadores", erro.message);
    } finally {
      setCarregandoCuidadores(false);
    }
  }, [mostrarToast]);

  const carregarIdosos = useCallback(async () => {
    try {
      setCarregandoIdosos(true);
      setErroIdoso("");
      const lista = await listarIdosos();
      setIdosos(lista);
    } catch (erro) {
      setErroIdoso(erro.message);
      mostrarToast("erro", "Erro ao carregar idosos", erro.message);
    } finally {
      setCarregandoIdosos(false);
    }
  }, [mostrarToast]);

  useEffect(() => {
    carregarCuidadores();
    carregarIdosos();
  }, [carregarCuidadores, carregarIdosos]);

  useEffect(() => {
    const instituicaoId = localStorage.getItem("usuarioId") || sessionStorage.getItem("usuarioId");
    const chave = `cuidadoresInativos:${instituicaoId || "atual"}`;
    const salvos = JSON.parse(localStorage.getItem(chave) || "[]");
    setCuidadoresInativos(Array.isArray(salvos) ? salvos : []);
  }, []);

  useEffect(() => {
    const cpfLimpo = somenteNumeros(formIdoso.cpf);
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
              cpf: formatarCPF(String(idosoEncontrado.cpf || cpfLimpo)),
              nome: idosoEncontrado.nome || "",
              observacoes: idosoEncontrado.observacoes || "",
              ddd: idosoEncontrado.contato?.ddd ? String(idosoEncontrado.contato.ddd) : "",
              telefone: idosoEncontrado.contato?.telefone ? formatarTelefone(String(idosoEncontrado.contato.telefone)) : "",
              contatoId: idosoEncontrado.contatoId || idosoEncontrado.contato?.id || null,
            }));
            return;
          }
          setIdosoParaReativar(null);
          if (statusIdoso === "ATIVO") setErroIdoso("CPF ja cadastrado para um idoso ativo.");
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

  function formatarCPF(valor) {
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
    if (name === "cpf") novoValor = formatarCPF(value);
    if (name === "ddd") novoValor = value.replace(/\D/g, "").slice(0, 2);
    if (name === "telefone") novoValor = formatarTelefone(value);

    if (name === "cpf") {
      const cpfDigitado = somenteNumeros(novoValor);
      const encontrado = cuidadoresInativos.find((c) => somenteNumeros(c.cpf) === cpfDigitado);
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
    if (name === "cpf") novoValor = formatarCPF(value);
    if (name === "ddd") novoValor = value.replace(/\D/g, "").slice(0, 2);
    if (name === "telefone") novoValor = formatarTelefone(value);
    if (name === "cpf") setErroIdoso("");
    setFormIdoso((ant) => ({ ...ant, [name]: novoValor }));
  }

  function getHintCpfIdoso() {
    if (consultaCpfIdoso.carregando) return "Verificando CPF...";
    if (!consultaCpfIdoso.consultado) return null;
    if (!consultaCpfIdoso.idoso) return "CPF ainda nao cadastrado.";
    const s = String(consultaCpfIdoso.idoso.status || "").toUpperCase();
    return s === "INATIVO"
      ? "Idoso inativo encontrado. Os dados foram preenchidos para reativacao."
      : "CPF ja cadastrado para um idoso ativo.";
  }

  function limparFormCuidador() {
    setFormCuidador({ cpf: "", nome: "", email: "", senha: "", confirmarSenha: "", ddd: "", telefone: "", contatoId: null });
    setCuidadorParaReativar(null);
  }

  function limparFormIdoso() {
    setFormIdoso({ nome: "", cpf: "", observacoes: "", ddd: "", telefone: "", contatoId: null });
    setConsultaCpfIdoso({ carregando: false, consultado: false, idoso: null });
    setIdosoParaReativar(null);
  }

  function abrirEdicaoCuidador(cuidador) {
    setErroCuidador("");
    setCuidadorEmEdicao(cuidador);
    setFormCuidador({
      cpf: formatarCPF(String(cuidador.cpf || "")), nome: cuidador.nome || "", email: cuidador.email || "", senha: "", confirmarSenha: "",
      ddd: cuidador.contato?.ddd ? String(cuidador.contato.ddd) : "",
      telefone: cuidador.contato?.telefone ? formatarTelefone(String(cuidador.contato.telefone)) : "",
      contatoId: cuidador.contatoId || cuidador.contato?.id || null,
    });
    setModalCuidadorAberto(true);
  }

  function abrirCadastroIdoso() {
    setErroIdoso(""); setIdosoEmEdicao(null); limparFormIdoso(); setModalIdosoAberto(true);
  }

  function abrirEdicaoIdoso(idoso) {
    setErroIdoso(""); setIdosoEmEdicao(idoso); setIdosoParaReativar(null);
    setFormIdoso({
      nome: idoso.nome || "", cpf: formatarCPF(String(idoso.cpf || "")), observacoes: idoso.observacoes || "",
      ddd: idoso.contato?.ddd ? String(idoso.contato.ddd) : "",
      telefone: idoso.contato?.telefone ? formatarTelefone(String(idoso.contato.telefone)) : "",
      contatoId: idoso.contatoId || idoso.contato?.id || null,
    });
    setModalIdosoAberto(true);
  }

  function fecharModalIdoso() {
    setModalIdosoAberto(false); setIdosoEmEdicao(null); setIdosoParaReativar(null); setErroIdoso(""); limparFormIdoso();
  }

  function abrirCadastroCuidador() {
    setErroCuidador(""); setCuidadorEmEdicao(null); limparFormCuidador(); setModalCuidadorAberto(true);
  }

  function fecharModalCuidador() {
    setErroCuidador(""); setModalCuidadorAberto(false); setCuidadorEmEdicao(null); limparFormCuidador();
  }

  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validarIdoso() {
    const s = String(consultaCpfIdoso.idoso?.status || "").toUpperCase();
    if (!idosoEmEdicao && s === "ATIVO") return "CPF ja cadastrado para um idoso ativo.";
    if (!formIdoso.nome.trim()) return "Informe o nome do idoso.";
    if (!cpfValido(formIdoso.cpf)) return "CPF invalido.";
    if (formIdoso.ddd.replace(/\D/g, "").length < 2) return "DDD invalido.";
    if (formIdoso.telefone.replace(/\D/g, "").length < 8) return "Telefone invalido.";
    return null;
  }

  function validarCuidador() {
    if (!cpfValido(formCuidador.cpf)) return "CPF invalido.";
    if (!formCuidador.nome.trim()) return "Informe o nome do cuidador.";
    if (!emailValido(formCuidador.email.trim())) return "Informe um e-mail valido.";
    if (!cuidadorEmEdicao && !cuidadorParaReativar && !formCuidador.senha.trim()) return "Informe a senha do cuidador.";
    if (formCuidador.senha.trim() && !formCuidador.confirmarSenha.trim()) return "Confirme a senha do cuidador.";
    if (formCuidador.senha.trim() && formCuidador.senha !== formCuidador.confirmarSenha) return "As senhas nao coincidem.";
    if (formCuidador.ddd.replace(/\D/g, "").length < 2) return "DDD invalido.";
    if (formCuidador.telefone.replace(/\D/g, "").length < 8) return "Telefone invalido.";
    return null;
  }

  function removerCuidadorInativo(cpf) {
    const id = localStorage.getItem("usuarioId") || sessionStorage.getItem("usuarioId");
    const chave = `cuidadoresInativos:${id || "atual"}`;
    setCuidadoresInativos((ant) => {
      const att = ant.filter((c) => somenteNumeros(c.cpf) !== somenteNumeros(cpf));
      localStorage.setItem(chave, JSON.stringify(att));
      return att;
    });
  }

  function guardarCuidadorInativo(cuidadorInativo) {
    const id = localStorage.getItem("usuarioId") || sessionStorage.getItem("usuarioId");
    const chave = `cuidadoresInativos:${id || "atual"}`;
    setCuidadoresInativos((ant) => {
      const sem = ant.filter((c) => somenteNumeros(c.cpf) !== somenteNumeros(cuidadorInativo.cpf));
      const att = [cuidadorInativo, ...sem];
      localStorage.setItem(chave, JSON.stringify(att));
      return att;
    });
  }

  async function handleCadastrarCuidador(evento) {
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
    } catch (erro) {
      setErroCuidador(erro.message);
      mostrarToast("erro", cuidadorEmEdicao ? "Erro ao atualizar cuidador" : cuidadorParaReativar ? "Erro ao reativar cuidador" : "Erro ao cadastrar cuidador", erro.message);
    } finally {
      setSalvandoCuidador(false);
    }
  }

  async function handleExcluirCuidador(cuidador) {
    try {
      setExcluindoCuidador(true); setErroCuidador("");
      await deletarCuidador(cuidador.id);
      guardarCuidadorInativo(cuidador);
      await carregarCuidadores();
      mostrarToast("sucesso", "Cuidador desativado", `${cuidador.nome} foi removido da listagem.`);
    } catch (erro) {
      setErroCuidador(erro.message);
      mostrarToast("erro", "Erro ao desativar cuidador", erro.message);
    } finally {
      setExcluindoCuidador(false);
    }
  }

  async function handleCadastrarIdoso(evento) {
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
    } catch (erro) {
      setErroIdoso(erro.message);
      mostrarToast("erro", idosoEmEdicao ? "Erro ao atualizar idoso" : idosoParaReativar ? "Erro ao reativar idoso" : "Erro ao cadastrar idoso", erro.message);
    } finally {
      setSalvandoIdoso(false);
    }
  }

  async function handleExcluirIdoso(idoso) {
    try {
      setExcluindoIdoso(true); setErroIdoso("");
      await deletarIdoso(idoso.id);
      await carregarIdosos();
      mostrarToast("sucesso", "Idoso desativado", `${idoso.nome} foi removido da listagem.`);
    } catch (erro) {
      setErroIdoso(erro.message);
      mostrarToast("erro", "Erro ao desativar idoso", erro.message);
    } finally {
      setExcluindoIdoso(false);
    }
  }

  return (
    <div className="instituicao-home">
      <BcToast {...toastProps} />

      <BcTopbar
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
                { chave: "cpf", titulo: "CPF", className: "bc-listagem-tdMuted", render: (c) => formatarCPF(String(c.cpf || "")) },
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
              onExcluir={handleExcluirCuidador}
              tituloConfirmacao="Desativar cuidador?"
              mensagemConfirmacao="O cuidador sera removido da listagem, mas podera ser reativado ao cadastrar o mesmo CPF."
              textoConfirmar="Sim, desativar"
              textoCarregandoExcluir="Desativando..."
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
              colunas={[
                { chave: "nome", titulo: "Nome", className: "bc-listagem-tdNome" },
                { chave: "cpf", titulo: "CPF", className: "bc-listagem-tdMuted", render: (i) => formatarCPF(String(i.cpf || "")) },
                { chave: "contato", titulo: "Contato", className: "bc-listagem-tdMuted bc-listagem-tdContato",
                  render: (i) => i.contato ? `(${i.contato.ddd}) ${formatarTelefone(String(i.contato.telefone || ""))}` : "-" },
                { chave: "observacoes", titulo: "Observacoes", className: "bc-listagem-tdMuted", render: (i) => i.observacoes || "-" },
              ]}
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
              onExcluir={handleExcluirIdoso}
              tituloConfirmacao="Desativar idoso?"
              mensagemConfirmacao="O idoso sera removido da listagem, mas podera ser reativado ao cadastrar o mesmo CPF."
              textoConfirmar="Sim, desativar"
              textoCarregandoExcluir="Desativando..."
              excluindo={excluindoIdoso}
            />
          </div>
        </div>
      </main>

      {/* Modal gerenciar cuidadores do idoso */}
      <ModalGerenciarCuidadores
        aberto={!!idosoGerenciar}
        onFechar={() => setIdosoGerenciar(null)}
        idoso={idosoGerenciar}
        cuidadores={cuidadores}
      />

      {/* Modal cadastro/edição de cuidador */}
      <BcModal aberto={modalCuidadorAberto} onFechar={fecharModalCuidador}>
        <section className="instituicao-modal instituicao-modal--cuidador">
          <div className="instituicao-modal__header">
            <h2>{cuidadorEmEdicao ? "Editar Cuidador" : cuidadorParaReativar ? "Reativar Cuidador" : "Novo Cuidador"}</h2>
          </div>
          <form className="instituicao-modal__form" onSubmit={handleCadastrarCuidador}>
            {erroCuidador ? <div className="instituicao-modal__error" role="alert">{erroCuidador}</div> : null}
            <BcInput label="CPF *" name="cpf" placeholder="000.000.000-00" value={formCuidador.cpf} onChange={atualizarCuidador} maxLength={14} />
            <BcInput label="Nome *" name="nome" placeholder="Insira um nome" value={formCuidador.nome} onChange={atualizarCuidador} />
            <BcInput label="E-mail *" name="email" type="email" placeholder="nome@email.com" value={formCuidador.email} onChange={atualizarCuidador} />
            <BcInput
              label={cuidadorEmEdicao || cuidadorParaReativar ? "Senha" : "Senha *"}
              name="senha" type="password"
              placeholder={cuidadorEmEdicao || cuidadorParaReativar ? "Preencha apenas se quiser alterar" : ""}
              value={formCuidador.senha} onChange={atualizarCuidador}
            />
            <BcInput
              label={cuidadorEmEdicao || cuidadorParaReativar ? "Confirmar senha" : "Confirmar senha *"}
              name="confirmarSenha" type="password"
              placeholder={cuidadorEmEdicao || cuidadorParaReativar ? "Repita apenas se quiser alterar" : ""}
              value={formCuidador.confirmarSenha} onChange={atualizarCuidador}
            />
            <div className="instituicao-modal__row">
              <BcInput label="DDD *" name="ddd" placeholder="11" value={formCuidador.ddd} onChange={atualizarCuidador} maxLength={2} />
              <BcInput label="Telefone *" name="telefone" placeholder="90000-0000" value={formCuidador.telefone} onChange={atualizarCuidador} maxLength={10} />
            </div>
            <BcButton type="submit" loading={salvandoCuidador}>
              {cuidadorEmEdicao ? "Salvar alteracoes" : cuidadorParaReativar ? "Reativar" : "Cadastrar"}
            </BcButton>
          </form>
        </section>
      </BcModal>

      {/* Modal cadastro/edição de idoso */}
      <BcModal aberto={modalIdosoAberto} onFechar={fecharModalIdoso}>
        <BcFormModal
          title={idosoEmEdicao ? "Editar Idoso" : idosoParaReativar ? "Reativar Idoso" : "Novo Idoso"}
          subtitle={idosoEmEdicao ? "Atualize os dados abaixo" : idosoParaReativar ? "Confira os dados antes de reativar" : "Preencha os dados para cadastrar"}
          error={erroIdoso}
          onSubmit={handleCadastrarIdoso}
        >
          <BcInput label="CPF *" name="cpf" placeholder="000.000.000-00" value={formIdoso.cpf} onChange={atualizarIdoso} inputMode="numeric" maxLength={14} hint={getHintCpfIdoso()} />
          <BcInput label="Nome *" name="nome" placeholder="Insira um nome" value={formIdoso.nome} onChange={atualizarIdoso} />
          <BcFormModalTextarea id="observacoes" label="Observações" name="observacoes" placeholder="Observações importantes sobre o idoso..." value={formIdoso.observacoes} onChange={atualizarIdoso} />
          <BcFormModalRow>
            <BcInput label="DDD *" name="ddd" placeholder="11" value={formIdoso.ddd} onChange={atualizarIdoso} maxLength={2} />
            <BcInput label="Telefone *" name="telefone" placeholder="90000-0000" value={formIdoso.telefone} onChange={atualizarIdoso} maxLength={10} />
          </BcFormModalRow>
          <BcButton type="submit" loading={salvandoIdoso}>
            {idosoEmEdicao ? "Salvar alteracoes" : idosoParaReativar ? "Reativar" : "Cadastrar"}
          </BcButton>
        </BcFormModal>
      </BcModal>
    </div>
  );
}