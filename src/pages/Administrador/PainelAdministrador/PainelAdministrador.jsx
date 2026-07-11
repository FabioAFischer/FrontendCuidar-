import { useCallback, useState, useEffect } from "react";
import BcBotao from "../../../components/BcBotao/BcBotao";
import BcModal from "../../../components/BcModal/BcModal";
import BcCampoTexto from "../../../components/BcCampoTexto/BcCampoTexto";
import BcForcaSenha from "../../../components/BcForcaSenha/BcForcaSenha";
import BcBarraSuperior from "../../../components/BcBarraSuperior/BcBarraSuperior";
import BcNotificacao, { useBcNotificacao } from "../../../components/BcNotificacao/BcNotificacao";
import BcListagem from "../../../components/BcListagem/BcListagem";
import BcSelecao from "../../../components/BcSelecao/BcSelecao";
import BcFormularioModal, { BcFormularioModalLinha } from "../../../components/BcFormularioModal/BcFormularioModal";
import SecaoRelatorio from "../../../components/SecaoRelatorio/SecaoRelatorio";
import {
  IconeEdificio,
  IconeOlhoAberto,
  IconeOlhoFechado,
  IconeSair,
} from "../../../components/icones/Icones";
import {
  cadastrarInstituicao,
  listarInstituicoes,
  listarInstituicoesPaginado,
  atualizarInstituicao,
  excluirInstituicao,
  reativarInstituicao,
} from "../../../api/administradorApi";
import { buscarDadosRelatorio } from "../../../api/relatorioApi";
import { gerarRelatorioPDF } from "../../../utils/gerarRelatorioPDF";
import { validarCnpj } from "../../../utils/validacaoDocumento";
import "./PainelAdministrador.css";

/* ── Ícones locais ── */
const IconePessoa = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const IconeIdoso = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    <path d="M9 17l-1 4M15 17l1 4" />
  </svg>
);

/* ── Helpers ── */
function formatarCnpj(v) {
  const n = v.replace(/\D/g, "").slice(0, 14);
  return n
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function formatarCep(v) {
  const n = v.replace(/\D/g, "").slice(0, 8);
  return n.replace(/(\d{5})(\d{0,3})/, "$1-$2").replace(/-$/, "");
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarSenhaForte(senha) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(senha);
}

function feedbackValido(texto) {
  return <span className="bc-form-modal__match" style={{ color: "#0d9e8a" }}>{texto}</span>;
}

function feedbackObrigatorio(valor, nomeCampo, ativo = true) {
  if (!ativo) return {};
  if (!String(valor || "").trim()) return { error: `${nomeCampo} obrigatório.` };
  return { hint: feedbackValido(`${nomeCampo} preenchido.`) };
}

function feedbackCnpj(cnpj) {
  const numeros = cnpj.replace(/\D/g, "");
  if (!numeros) return {};
  if (numeros.length < 14) return { error: "CNPJ incompleto." };
  if (!validarCnpj(cnpj)) return { error: "CNPJ inválido." };
  return { hint: feedbackValido("CNPJ válido.") };
}

function feedbackEmail(email) {
  const valor = email.trim();
  if (!valor) return {};
  if (!validarEmail(valor)) return { error: "E-mail inválido." };
  return { hint: feedbackValido("E-mail válido.") };
}

function feedbackCep(cep) {
  const numeros = cep.replace(/\D/g, "");
  if (!numeros) return {};
  if (numeros.length < 8) return { error: "CEP incompleto." };
  return { hint: feedbackValido("CEP válido.") };
}

function feedbackUf(uf) {
  if (!uf.trim()) return {};
  if (uf.trim().length !== 2) return { error: "UF deve ter 2 letras." };
  return { hint: feedbackValido("UF válida.") };
}

function feedbackSenha(senha) {
  if (!senha) return {};
  if (!validarSenhaForte(senha)) return { error: "Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial." };
  return {};
}

function feedbackConfirmarSenha(senha, confirmarSenha) {
  if (!confirmarSenha) return {};
  if (senha !== confirmarSenha) return { error: "As senhas não coincidem." };
  return { hint: feedbackValido("Senhas coincidem.") };
}

async function buscarEnderecoPorCep(cep) {
  const n = cep.replace(/\D/g, "");
  if (n.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${n}/json/`);
  const data = await res.json();
  if (data.erro) return null;
  return data;
}

function validarFormularioInstituicao(form, exigirSenha = false) {
  if (!form.nome.trim())                          return "Informe o nome.";
  if (!validarCnpj(form.cnpj))                    return "CNPJ inválido.";
  if (!validarEmail(form.email.trim()))           return "Informe um e-mail válido.";
  if (!form.rua.trim())                           return "Informe a rua.";
  if (!form.bairro.trim())                        return "Informe o bairro.";
  if (form.uf.trim().length !== 2)                return "UF deve ter 2 letras (ex: SC).";
  if (!form.numero.trim())                        return "Informe o número.";
  if (form.cep.replace(/\D/g, "").length < 8)    return "CEP inválido.";
  if (exigirSenha && !validarSenhaForte(form.senha)) {
    return "A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.";
  }
  if (exigirSenha && form.senha !== form.confirmarSenha) return "As senhas não coincidem.";
  return null;
}

const FORM_INICIAL = {
  nome: "", cnpj: "", email: "", rua: "", bairro: "", uf: "", numero: "", cep: "",
  senha: "", confirmarSenha: "",
};

/* ── Hook ViaCEP ── */
function useBuscaEnderecoPorCep(cep, setForm, onToast) {
  const [buscandoCEP, setBuscandoCEP] = useState(false);

  useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    const timer = setTimeout(async () => {
      setBuscandoCEP(true);
      try {
        const data = await buscarEnderecoPorCep(cep);
        if (data) {
          setForm(prev => ({
            ...prev,
            rua:    data.logradouro || prev.rua,
            bairro: data.bairro     || prev.bairro,
            uf:     data.uf         || prev.uf,
          }));
        } else {
          onToast?.("aviso", "CEP não encontrado", "Verifique o CEP e preencha o endereço manualmente.");
        }
      } catch {
        onToast?.("erro", "Erro ao buscar CEP", "Não foi possível consultar o ViaCEP.");
      } finally {
        setBuscandoCEP(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [cep]); // eslint-disable-line react-hooks/exhaustive-deps

  return { buscandoCEP };
}

/* ── Campos de endereço ── */
function CamposEndereco({ form, onChange, buscandoCEP, feedbacks = {} }) {
  return (
    <>
      <BcCampoTexto
        label={buscandoCEP ? "CEP * (buscando...)" : "CEP *"}
        name="cep" placeholder="00000-000"
        value={form.cep} onChange={onChange} maxLength={9}
        error={feedbacks.cep?.error}
        hint={feedbacks.cep?.hint}
      />
      <BcCampoTexto label="Rua *" name="rua" placeholder="Nome da rua" value={form.rua} onChange={onChange} error={feedbacks.rua?.error} hint={feedbacks.rua?.hint} />
      <BcFormularioModalLinha>
        <BcCampoTexto label="Número *" name="numero" placeholder="Ex: 123" value={form.numero} onChange={onChange} error={feedbacks.numero?.error} hint={feedbacks.numero?.hint} />
        <BcCampoTexto label="UF *" name="uf" placeholder="SC" value={form.uf} onChange={onChange} maxLength={2} error={feedbacks.uf?.error} hint={feedbacks.uf?.hint} />
      </BcFormularioModalLinha>
      <BcCampoTexto label="Bairro *" name="bairro" placeholder="Nome do bairro" value={form.bairro} onChange={onChange} error={feedbacks.bairro?.error} hint={feedbacks.bairro?.hint} />
    </>
  );
}

/* ── Modal de Cadastro ── */
function ModalCadastro({ onSucesso, onToast }) {
  const [form, setForm]                   = useState(FORM_INICIAL);
  const [showSenha, setShowSenha]         = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [erro, setErro]                   = useState("");

  const { buscandoCEP } = useBuscaEnderecoPorCep(form.cep, setForm, onToast);

  function aoAlterarCampoFormulario(e) {
    const { name, value } = e.target;
    let v = value;
    if (name === "cnpj") v = formatarCnpj(value);
    if (name === "cep")  v = formatarCep(value);
    if (name === "uf")   v = value.toUpperCase().slice(0, 2);
    setForm(prev => ({ ...prev, [name]: v }));
  }

  async function aoEnviarFormulario(e) {
    e.preventDefault();
    setErro("");
    const err = validarFormularioInstituicao(form, true);
    if (err) { setErro(err); return; }
    setLoading(true);
    try {
      await cadastrarInstituicao({
        nome:   form.nome,
        cnpj:   form.cnpj.replace(/\D/g, ""),
        email:  form.email,
        senha:  form.senha,
        rua:    form.rua,
        bairro: form.bairro,
        uf:     form.uf,
        numero: form.numero,
        cep:    form.cep.replace(/\D/g, ""),
      });
      onToast?.("sucesso", "Instituição cadastrada", `A instituição ${form.nome} foi cadastrada com sucesso.`);
      onSucesso();
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  const senhasCoincidem = form.confirmarSenha.length > 0 && form.senha === form.confirmarSenha;
  const cnpjFeedback = feedbackCnpj(form.cnpj);
  const emailFeedback = feedbackEmail(form.email);
  const senhaFeedback = feedbackSenha(form.senha);
  const confirmarSenhaFeedback = feedbackConfirmarSenha(form.senha, form.confirmarSenha);
  const formularioIniciado = Object.values(form).some((valor) => String(valor || "").trim());
  const nomeFeedback = feedbackObrigatorio(form.nome, "Nome", formularioIniciado);
  const enderecoFeedbacks = {
    cep: feedbackCep(form.cep),
    rua: feedbackObrigatorio(form.rua, "Rua", formularioIniciado),
    numero: feedbackObrigatorio(form.numero, "Número", formularioIniciado),
    uf: feedbackUf(form.uf),
    bairro: feedbackObrigatorio(form.bairro, "Bairro", formularioIniciado),
  };

  return (
    <BcFormularioModal
      title="Nova Instituição"
      subtitle="Preencha os dados para cadastrar"
      error={erro}
      onSubmit={aoEnviarFormulario}
    >
      <BcCampoTexto label="Nome *" name="nome" placeholder="Nome da instituição" value={form.nome} onChange={aoAlterarCampoFormulario} error={nomeFeedback.error} hint={nomeFeedback.hint} />
      <BcCampoTexto label="CNPJ *" name="cnpj" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={aoAlterarCampoFormulario} maxLength={18} error={cnpjFeedback.error} hint={cnpjFeedback.hint} />
      <BcCampoTexto label="Email *" name="email" type="email" placeholder="email@exemplo.com" value={form.email} onChange={aoAlterarCampoFormulario} error={emailFeedback.error} hint={emailFeedback.hint} />
      <CamposEndereco form={form} onChange={aoAlterarCampoFormulario} buscandoCEP={buscandoCEP} feedbacks={enderecoFeedbacks} />
      <BcCampoTexto
        label="Senha *" name="senha"
        type={showSenha ? "text" : "password"}
        placeholder="Crie uma senha"
        value={form.senha} onChange={aoAlterarCampoFormulario}
        autoComplete="new-password"
        suffix={
          <button type="button" className="bc-form-modal__icon-button" onClick={() => setShowSenha(v => !v)}>
            {showSenha ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
          </button>
        }
        error={senhaFeedback.error}
        hint={<BcForcaSenha password={form.senha} />}
      />
      <BcCampoTexto
        label="Confirmar Senha *" name="confirmarSenha"
        type={showConfirmar ? "text" : "password"}
        placeholder="Confirme sua senha"
        value={form.confirmarSenha} onChange={aoAlterarCampoFormulario}
        autoComplete="new-password"
        suffix={
          <button type="button" className="bc-form-modal__icon-button" onClick={() => setShowConfirmar(v => !v)}>
            {showConfirmar ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
          </button>
        }
        error={confirmarSenhaFeedback.error}
        hint={
          form.confirmarSenha.length > 0 ? (
            <span className="bc-form-modal__match" style={{ color: senhasCoincidem ? "#0d9e8a" : "#e05252" }}>
              {senhasCoincidem ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
            </span>
          ) : null
        }
      />
      <BcBotao type="submit" loading={loading}>Cadastrar</BcBotao>
    </BcFormularioModal>
  );
}

/* ── Modal de Edição ── */
function ModalEditar({ instituicao, onSucesso, onToast }) {
  const [form, setForm] = useState({
    nome:   instituicao.nome   || "",
    cnpj:   formatarCnpj(String(instituicao.cnpj || "")),
    email:  instituicao.email  || "",
    rua:    instituicao.rua    || "",
    bairro: instituicao.bairro || "",
    uf:     instituicao.uf     || "",
    numero: String(instituicao.numero || ""),
    cep:    formatarCep(String(instituicao.cep || "")),
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState("");

  const { buscandoCEP } = useBuscaEnderecoPorCep(form.cep, setForm, onToast);

  function aoAlterarCampoFormulario(e) {
    const { name, value } = e.target;
    let v = value;
    if (name === "cnpj") v = formatarCnpj(value);
    if (name === "cep")  v = formatarCep(value);
    if (name === "uf")   v = value.toUpperCase().slice(0, 2);
    setForm(prev => ({ ...prev, [name]: v }));
  }

  async function aoEnviarFormulario(e) {
    e.preventDefault();
    setErro("");
    const err = validarFormularioInstituicao(form);
    if (err) { setErro(err); return; }
    setLoading(true);
    try {
      await atualizarInstituicao(instituicao.id, {
        nome:   form.nome,
        cnpj:   form.cnpj.replace(/\D/g, ""),
        email:  form.email,
        rua:    form.rua,
        bairro: form.bairro,
        uf:     form.uf,
        numero: form.numero,
        cep:    form.cep.replace(/\D/g, ""),
      });
      onToast?.("sucesso", "Instituição atualizada", `Os dados de ${form.nome} foram salvos.`);
      onSucesso();
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  const cnpjFeedback = feedbackCnpj(form.cnpj);
  const emailFeedback = feedbackEmail(form.email);
  const nomeFeedback = feedbackObrigatorio(form.nome, "Nome");
  const enderecoFeedbacks = {
    cep: feedbackCep(form.cep),
    rua: feedbackObrigatorio(form.rua, "Rua"),
    numero: feedbackObrigatorio(form.numero, "Número"),
    uf: feedbackUf(form.uf),
    bairro: feedbackObrigatorio(form.bairro, "Bairro"),
  };

  return (
    <BcFormularioModal
      title="Editar Instituição"
      subtitle="Atualize os dados abaixo"
      error={erro}
      onSubmit={aoEnviarFormulario}
    >
      <BcCampoTexto label="Nome *" name="nome" placeholder="Nome da instituição" value={form.nome} onChange={aoAlterarCampoFormulario} error={nomeFeedback.error} hint={nomeFeedback.hint} />
      <BcCampoTexto label="CNPJ *" name="cnpj" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={aoAlterarCampoFormulario} maxLength={18} error={cnpjFeedback.error} hint={cnpjFeedback.hint} />
      <BcCampoTexto label="Email *" name="email" type="email" placeholder="email@exemplo.com" value={form.email} onChange={aoAlterarCampoFormulario} error={emailFeedback.error} hint={emailFeedback.hint} />
      <CamposEndereco form={form} onChange={aoAlterarCampoFormulario} buscandoCEP={buscandoCEP} feedbacks={enderecoFeedbacks} />
      <BcBotao type="submit" loading={loading}>Salvar alterações</BcBotao>
    </BcFormularioModal>
  );
}

/* ── Colunas ── */
const COLUNAS = [
  { chave: "nome",  titulo: "Nome",     className: "bc-listagem-tdNome" },
  { chave: "cnpj",  titulo: "CNPJ",     className: "bc-listagem-tdMuted bc-listagem-tdContato", render: (inst) => formatarCnpj(String(inst.cnpj || "")) },
  { chave: "email", titulo: "Email",    className: "bc-listagem-tdMuted bc-listagem-tdContato" },
  {
    chave: "bairro",
    titulo: "Endereço",
    className: "bc-listagem-tdMuted",
    render: (inst) => `${inst.bairro}, ${inst.numero} — ${inst.uf}`,
  },
  { chave: "cep", titulo: "CEP", className: "bc-listagem-tdMuted bc-listagem-tdContato", render: (inst) => formatarCep(String(inst.cep || "")) },
  {
    chave: "status",
    titulo: "Status",
    render: (inst) => (
      <span className={inst.status === "ATIVO" ? "bc-status bc-status--ativo" : "bc-status bc-status--inativo"}>
        {inst.status}
      </span>
    ),
  },
];

const OPCOES_STATUS = [
  { value: "ATIVO",   label: "Ativas" },
  { value: "INATIVO", label: "Inativas" },
  { value: "TODAS",   label: "Todas" },
];

const TAMANHO_PAGINA = 5;

const RELATORIO_INICIAL = {
  instituicoes: { total: 0, ativas: 0,  inativas: 0,  lista: [] },
  cuidadores:   { total: 0, ativos: 0,  inativos: 0,  lista: [] },
  idosos:       { total: 0, ativos: 0,  inativos: 0,  lista: [] },
};

/* ── Dashboard principal ── */
export default function PainelAdministrador({ onLogout }) {
  const { toastProps, mostrarToast } = useBcNotificacao();
  const [instituicoes, setInstituicoes]     = useState([]);
  const [busca, setBusca]                   = useState("");
  const [filtroStatus, setFiltroStatus]     = useState("ATIVO");
  const [paginaAtual, setPaginaAtual]       = useState(1);
  const [totalPaginas, setTotalPaginas]     = useState(1);
  const [totalItens, setTotalItens]         = useState(0);
  const [carregando, setCarregando]         = useState(false);
  const [excluindo, setExcluindo]           = useState(false);
  const [modalCadastro, setModalCadastro]   = useState(false);
  const [modalEditar, setModalEditar]       = useState(null);
  const [dadosRelatorio, setDadosRelatorio] = useState(RELATORIO_INICIAL);
  const [carregandoRel, setCarregandoRel]   = useState(false);
  const [erroRel, setErroRel]               = useState("");
  const [baixando, setBaixando]             = useState(false);

  const buscaAtiva = busca.trim() !== "";

  const recarregarLista = useCallback(async (pagina, comBuscaAtiva) => {
    setCarregando(true);
    try {
      if (comBuscaAtiva) {
        const data = await listarInstituicoes();
        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
          ? data.content
          : [];
        setInstituicoes(lista);
        setTotalPaginas(1);
        setTotalItens(lista.length);
      } else {
        const resultado = await listarInstituicoesPaginado(pagina - 1, TAMANHO_PAGINA, filtroStatus);
        setInstituicoes(resultado.itens);
        setTotalPaginas(resultado.totalPaginas);
        setTotalItens(resultado.totalItens);
      }
      setPaginaAtual(pagina);
    } catch (err) {
      mostrarToast("erro", "Erro ao carregar", err.message);
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus, mostrarToast]);

  // Carrega dados do relatório automaticamente ao montar
  const recarregarRelatorio = useCallback(async () => {
    setCarregandoRel(true);
    setErroRel("");
    try {
      const dados = await buscarDadosRelatorio();
      setDadosRelatorio(dados);
    } catch (err) {
      setErroRel(err.message || "Erro ao carregar dados do relatório.");
    } finally {
      setCarregandoRel(false);
    }
  }, []);

  useEffect(() => {
    recarregarLista(1, buscaAtiva);
  }, [buscaAtiva, recarregarLista]);

  useEffect(() => {
    recarregarRelatorio();
  }, [recarregarRelatorio]);

  const filtradas = instituicoes.filter(i => {
    const matchBusca =
      i.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      String(i.cnpj || "").includes(busca) ||
      String(i.email || "").toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "TODAS" ? true : i.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  async function aoAlternarStatusInstituicao(inst) {
    setExcluindo(true);
    try {
      if (inst.status === "ATIVO") {
        await excluirInstituicao(inst.id);
        mostrarToast("sucesso", "Instituição inativada", `${inst.nome} foi inativada.`);
      } else {
        await reativarInstituicao(inst.id);
        mostrarToast("sucesso", "Instituição reativada", `${inst.nome} foi reativada.`);
      }
      await recarregarLista(1, buscaAtiva);
      await recarregarRelatorio(); // atualiza os cards após toggle
    } catch (err) {
      mostrarToast("erro", "Erro ao atualizar status", err.message);
    } finally {
      setExcluindo(false);
    }
  }

  async function aoBaixarRelatorio() {
    setBaixando(true);
    try {
      const dados = await buscarDadosRelatorio();
      setDadosRelatorio(dados);
      gerarRelatorioPDF(dados);
    } catch (err) {
      mostrarToast("erro", "Erro ao gerar relatório", err.message);
    } finally {
      setBaixando(false);
    }
  }

  return (
    <div className="adm-page">
      <BcNotificacao {...toastProps} />

      <BcBarraSuperior
        title="Painel Administrativo"
        subtitle="Gestão de Instituições"
        actionLabel="Sair"
        actionIcon={<IconeSair />}
        onAction={onLogout}
      />

      <main className="adm-main">
        <BcListagem
          titulo="Instituições Cadastradas"
          iconeTitulo={<IconeEdificio />}
          colunas={COLUNAS}
          itens={filtradas}
          busca={busca}
          placeholderBusca="Buscar por nome, CNPJ ou email..."
          onBuscaChange={setBusca}
          textoBotao="Nova Instituição"
          onBotaoClick={() => setModalCadastro(true)}
          textoVazio={busca ? "Nenhuma instituição encontrada." : "Nenhuma instituição cadastrada ainda."}
          carregando={carregando}
          excluindo={excluindo}
          paginacaoServidor={!buscaAtiva}
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          totalItens={totalItens}
          onMudarPagina={(pagina) => recarregarLista(pagina, buscaAtiva)}
          onEditar={(inst) => setModalEditar(inst)}
          onExcluir={aoAlternarStatusInstituicao}
          tituloConfirmacao="Alterar status da instituição?"
          mensagemConfirmacao="Deseja alterar o status desta instituição?"
          textoConfirmar="Confirmar"
          textoCarregandoExcluir="Inativando..."
          filtrosToolbar={
            <BcSelecao
              value={filtroStatus}
              onChange={setFiltroStatus}
              options={OPCOES_STATUS}
            />
          }
        />

        <SecaoRelatorio
          titulo="Relatório Geral do Sistema"
          subtitulo="Visão consolidada de instituições, cuidadores e idosos cadastrados."
          carregando={carregandoRel}
          erro={erroRel}
          baixando={baixando}
          cards={[
            {
              icone:    <IconeEdificio />,
              titulo:   "Instituições",
              total:    dadosRelatorio.instituicoes.total,
              ativos:   dadosRelatorio.instituicoes.ativas,
              inativos: dadosRelatorio.instituicoes.inativas,
            },
            {
              icone:    <IconePessoa />,
              titulo:   "Cuidadores",
              total:    dadosRelatorio.cuidadores.total,
              ativos:   dadosRelatorio.cuidadores.ativos,
              inativos: dadosRelatorio.cuidadores.inativos,
            },
            {
              icone:    <IconeIdoso />,
              titulo:   "Idosos",
              total:    dadosRelatorio.idosos.total,
              ativos:   dadosRelatorio.idosos.ativos,
              inativos: dadosRelatorio.idosos.inativos,
            },
          ]}
          onBaixar={aoBaixarRelatorio}
        />
      </main>

      <BcModal aberto={modalCadastro} onFechar={() => setModalCadastro(false)}>
        <ModalCadastro
          onSucesso={() => { setModalCadastro(false); recarregarLista(1, buscaAtiva); recarregarRelatorio(); }}
          onToast={mostrarToast}
        />
      </BcModal>

      <BcModal aberto={!!modalEditar} onFechar={() => setModalEditar(null)}>
        {modalEditar && (
          <ModalEditar
            instituicao={modalEditar}
            onSucesso={() => { setModalEditar(null); recarregarLista(paginaAtual, buscaAtiva); recarregarRelatorio(); }}
            onToast={mostrarToast}
          />
        )}
      </BcModal>
    </div>
  );
}
