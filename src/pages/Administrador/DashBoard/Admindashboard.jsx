import { useCallback, useState, useEffect } from "react";
import BcButton from "../../../components/Bcbutton/BcButton";
import BcModal from "../../../components/BcModal/BcModal";
import BcInput from "../../../components/Bcinput/BcInput";
import BcPasswordStrength from "../../../components/BcPasswordStrength/BcPasswordStrength";
import BcTopbar from "../../../components/BcTopbar/BcTopbar";
import BcToast, { useBcToast } from "../../../components/BcToast/BcToast";
import BcListagem from "../../../components/BcListagem/BcListagem";
import BcSelect from "../../../components/BcSelect/BcSelect";
import BcFormModal, { BcFormModalRow } from "../../../components/BcFormModal/BcFormModal";
import SecaoRelatorio from "../../../components/SecaoRelatorio/Secaorelatorio";
import {
  IconeEdificio,
  IconeOlhoAberto,
  IconeOlhoFechado,
  IconeSair,
} from "../../../components/icons/Icons";
import {
  cadastrarInstituicao,
  listarInstituicoes,
  atualizarInstituicao,
  deletarInstituicao,
  reativarInstituicao,
} from "../../../api/administradorApi";
import { buscarDadosRelatorio } from "../../../api/relatorioApi";
import { gerarRelatorioPDF } from "../../../utils/gerarRelatorioPDF";
import { cnpjValido } from "../../../utils/validacaoDocumento";
import "./Admindashboard.css";

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
function formatarCNPJ(v) {
  const n = v.replace(/\D/g, "").slice(0, 14);
  return n
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function formatarCEP(v) {
  const n = v.replace(/\D/g, "").slice(0, 8);
  return n.replace(/(\d{5})(\d{0,3})/, "$1-$2").replace(/-$/, "");
}

async function buscarCEP(cep) {
  const n = cep.replace(/\D/g, "");
  if (n.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${n}/json/`);
  const data = await res.json();
  if (data.erro) return null;
  return data;
}

function validar(form, exigirSenha = false) {
  if (!form.nome.trim())                          return "Informe o nome.";
  if (!cnpjValido(form.cnpj))                    return "CNPJ inválido.";
  if (!form.email.trim())                         return "Informe o email.";
  if (!form.bairro.trim())                        return "Informe o bairro.";
  if (form.uf.trim().length !== 2)                return "UF deve ter 2 letras (ex: SC).";
  if (!form.numero.trim())                        return "Informe o número.";
  if (form.cep.replace(/\D/g, "").length < 8)    return "CEP inválido.";
  if (exigirSenha && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(form.senha)) {
    return "A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.";
  }
  if (exigirSenha && form.senha !== form.confirmarSenha) return "As senhas não coincidem.";
  return null;
}

const FORM_INICIAL = {
  nome: "", cnpj: "", email: "", bairro: "", uf: "", numero: "", cep: "",
  senha: "", confirmarSenha: "",
};

/* ── Hook ViaCEP ── */
function useViaCEP(cep, setForm, onToast) {
  const [buscandoCEP, setBuscandoCEP] = useState(false);

  useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    const timer = setTimeout(async () => {
      setBuscandoCEP(true);
      try {
        const data = await buscarCEP(cep);
        if (data) {
          setForm(prev => ({
            ...prev,
            bairro: data.bairro || prev.bairro,
            uf:     data.uf     || prev.uf,
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
function CamposEndereco({ form, onChange, buscandoCEP }) {
  return (
    <>
      <BcInput
        label={buscandoCEP ? "CEP (buscando...)" : "CEP"}
        name="cep" placeholder="00000-000"
        value={form.cep} onChange={onChange} maxLength={9}
      />
      <BcFormModalRow>
        <BcInput label="UF" name="uf" placeholder="SC" value={form.uf} onChange={onChange} maxLength={2} />
        <BcInput label="Número" name="numero" placeholder="Ex: 123" value={form.numero} onChange={onChange} />
      </BcFormModalRow>
      <BcInput label="Bairro" name="bairro" placeholder="Nome do bairro" value={form.bairro} onChange={onChange} />
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

  const { buscandoCEP } = useViaCEP(form.cep, setForm, onToast);

  function handleChange(e) {
    const { name, value } = e.target;
    let v = value;
    if (name === "cnpj") v = formatarCNPJ(value);
    if (name === "cep")  v = formatarCEP(value);
    if (name === "uf")   v = value.toUpperCase().slice(0, 2);
    setForm(prev => ({ ...prev, [name]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    const err = validar(form, true);
    if (err) { setErro(err); return; }
    setLoading(true);
    try {
      await cadastrarInstituicao({
        nome:   form.nome,
        cnpj:   form.cnpj.replace(/\D/g, ""),
        email:  form.email,
        senha:  form.senha,
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

  return (
    <BcFormModal
      title="Nova Instituição"
      subtitle="Preencha os dados para cadastrar"
      error={erro}
      onSubmit={handleSubmit}
    >
      <BcInput label="Nome" name="nome" placeholder="Nome da instituição" value={form.nome} onChange={handleChange} />
      <BcInput label="CNPJ" name="cnpj" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={handleChange} maxLength={18} />
      <BcInput label="Email" name="email" type="email" placeholder="email@exemplo.com" value={form.email} onChange={handleChange} />
      <CamposEndereco form={form} onChange={handleChange} buscandoCEP={buscandoCEP} />
      <BcInput
        label="Senha" name="senha"
        type={showSenha ? "text" : "password"}
        placeholder="Crie uma senha"
        value={form.senha} onChange={handleChange}
        autoComplete="new-password"
        suffix={
          <button type="button" className="bc-form-modal__icon-button" onClick={() => setShowSenha(v => !v)}>
            {showSenha ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
          </button>
        }
        hint={<BcPasswordStrength password={form.senha} />}
      />
      <BcInput
        label="Confirmar Senha" name="confirmarSenha"
        type={showConfirmar ? "text" : "password"}
        placeholder="Confirme sua senha"
        value={form.confirmarSenha} onChange={handleChange}
        autoComplete="new-password"
        suffix={
          <button type="button" className="bc-form-modal__icon-button" onClick={() => setShowConfirmar(v => !v)}>
            {showConfirmar ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
          </button>
        }
        hint={
          form.confirmarSenha.length > 0 ? (
            <span className="bc-form-modal__match" style={{ color: senhasCoincidem ? "#0d9e8a" : "#e05252" }}>
              {senhasCoincidem ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
            </span>
          ) : null
        }
      />
      <BcButton type="submit" loading={loading}>Cadastrar</BcButton>
    </BcFormModal>
  );
}

/* ── Modal de Edição ── */
function ModalEditar({ instituicao, onSucesso, onToast }) {
  const [form, setForm] = useState({
    nome:   instituicao.nome   || "",
    cnpj:   formatarCNPJ(String(instituicao.cnpj || "")),
    email:  instituicao.email  || "",
    bairro: instituicao.bairro || "",
    uf:     instituicao.uf     || "",
    numero: String(instituicao.numero || ""),
    cep:    formatarCEP(String(instituicao.cep || "")),
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState("");

  const { buscandoCEP } = useViaCEP(form.cep, setForm, onToast);

  function handleChange(e) {
    const { name, value } = e.target;
    let v = value;
    if (name === "cnpj") v = formatarCNPJ(value);
    if (name === "cep")  v = formatarCEP(value);
    if (name === "uf")   v = value.toUpperCase().slice(0, 2);
    setForm(prev => ({ ...prev, [name]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    const err = validar(form);
    if (err) { setErro(err); return; }
    setLoading(true);
    try {
      await atualizarInstituicao(instituicao.id, {
        nome:   form.nome,
        cnpj:   form.cnpj.replace(/\D/g, ""),
        email:  form.email,
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

  return (
    <BcFormModal
      title="Editar Instituição"
      subtitle="Atualize os dados abaixo"
      error={erro}
      onSubmit={handleSubmit}
    >
      <BcInput label="Nome" name="nome" placeholder="Nome da instituição" value={form.nome} onChange={handleChange} />
      <BcInput label="CNPJ" name="cnpj" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={handleChange} maxLength={18} />
      <BcInput label="Email" name="email" type="email" placeholder="email@exemplo.com" value={form.email} onChange={handleChange} />
      <CamposEndereco form={form} onChange={handleChange} buscandoCEP={buscandoCEP} />
      <BcButton type="submit" loading={loading}>Salvar alterações</BcButton>
    </BcFormModal>
  );
}

/* ── Colunas ── */
const COLUNAS = [
  { chave: "nome",  titulo: "Nome",     className: "bc-listagem-tdNome" },
  { chave: "cnpj",  titulo: "CNPJ",     className: "bc-listagem-tdMuted" },
  { chave: "email", titulo: "Email",    className: "bc-listagem-tdMuted" },
  {
    chave: "bairro",
    titulo: "Endereço",
    className: "bc-listagem-tdMuted",
    render: (inst) => `${inst.bairro}, ${inst.numero} — ${inst.uf}`,
  },
  { chave: "cep", titulo: "CEP", className: "bc-listagem-tdMuted" },
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

const RELATORIO_INICIAL = {
  instituicoes: { total: 0, ativas: 0,  inativas: 0,  lista: [] },
  cuidadores:   { total: 0, ativos: 0,  inativos: 0,  lista: [] },
  idosos:       { total: 0, ativos: 0,  inativos: 0,  lista: [] },
};

/* ── Dashboard principal ── */
export default function Admindashboard({ onLogout }) {
  const { toastProps, mostrarToast } = useBcToast();
  const [instituicoes, setInstituicoes]     = useState([]);
  const [busca, setBusca]                   = useState("");
  const [filtroStatus, setFiltroStatus]     = useState("ATIVO");
  const [carregando, setCarregando]         = useState(false);
  const [excluindo, setExcluindo]           = useState(false);
  const [modalCadastro, setModalCadastro]   = useState(false);
  const [modalEditar, setModalEditar]       = useState(null);
  const [dadosRelatorio, setDadosRelatorio] = useState(RELATORIO_INICIAL);
  const [carregandoRel, setCarregandoRel]   = useState(false);
  const [erroRel, setErroRel]               = useState("");
  const [baixando, setBaixando]             = useState(false);

  const recarregarLista = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await listarInstituicoes();
      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : [];
      setInstituicoes(lista);
    } catch (err) {
      mostrarToast("erro", "Erro ao carregar", err.message);
    } finally {
      setCarregando(false);
    }
  }, [mostrarToast]);

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
    recarregarLista();
    recarregarRelatorio();
  }, [recarregarLista, recarregarRelatorio]);

  const filtradas = instituicoes.filter(i => {
    const matchBusca =
      i.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      String(i.cnpj || "").includes(busca) ||
      String(i.email || "").toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "TODAS" ? true : i.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  async function handleToggleStatus(inst) {
    setExcluindo(true);
    try {
      if (inst.status === "ATIVO") {
        await deletarInstituicao(inst.id);
        mostrarToast("sucesso", "Instituição inativada", `${inst.nome} foi inativada.`);
      } else {
        await reativarInstituicao(inst.id);
        mostrarToast("sucesso", "Instituição reativada", `${inst.nome} foi reativada.`);
      }
      await recarregarLista();
      await recarregarRelatorio(); // atualiza os cards após toggle
    } catch (err) {
      mostrarToast("erro", "Erro ao atualizar status", err.message);
    } finally {
      setExcluindo(false);
    }
  }

  async function handleBaixarRelatorio() {
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
      <BcToast {...toastProps} />

      <BcTopbar
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
          onEditar={(inst) => setModalEditar(inst)}
          onExcluir={handleToggleStatus}
          tituloConfirmacao="Alterar status da instituição?"
          mensagemConfirmacao="Deseja alterar o status desta instituição?"
          textoConfirmar="Confirmar"
          textoCarregandoExcluir="Inativando..."
          filtrosToolbar={
            <BcSelect
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
          onBaixar={handleBaixarRelatorio}
        />
      </main>

      <BcModal aberto={modalCadastro} onFechar={() => setModalCadastro(false)}>
        <ModalCadastro
          onSucesso={() => { setModalCadastro(false); recarregarLista(); recarregarRelatorio(); }}
          onToast={mostrarToast}
        />
      </BcModal>

      <BcModal aberto={!!modalEditar} onFechar={() => setModalEditar(null)}>
        {modalEditar && (
          <ModalEditar
            instituicao={modalEditar}
            onSucesso={() => { setModalEditar(null); recarregarLista(); recarregarRelatorio(); }}
            onToast={mostrarToast}
          />
        )}
      </BcModal>
    </div>
  );
}