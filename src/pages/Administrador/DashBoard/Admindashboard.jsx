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
import { IconeOlhoAberto, IconeOlhoFechado } from "../../../components/icons/Icons";
import {
  cadastrarInstituicao,
  listarInstituicoes,
  atualizarInstituicao,
  deletarInstituicao,
} from "../../../api/administradorApi";
import { cnpjValido } from "../../../utils/validacaoDocumento";
import "./Admindashboard.css";

/* ── Ícones ── */
const IconeSair = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconeEdificio = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18M3 9h6M3 15h6M15 9h3M15 13h3M15 17h3" />
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
  if (!form.nome.trim()) return "Informe o nome.";
  if (!cnpjValido(form.cnpj)) return "CNPJ inválido.";
  if (!form.email.trim()) return "Informe o email.";
  if (!form.bairro.trim()) return "Informe o bairro.";
  if (form.uf.trim().length !== 2) return "UF deve ter 2 letras (ex: SC).";
  if (!form.numero.trim()) return "Informe o número.";
  if (form.cep.replace(/\D/g, "").length < 8) return "CEP inválido.";

  if (
    exigirSenha &&
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(form.senha)
  ) {
    return "A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.";
  }

  if (exigirSenha && form.senha !== form.confirmarSenha) {
    return "As senhas não coincidem.";
  }

  return null;
}

const FORM_INICIAL = {
  nome: "",
  cnpj: "",
  email: "",
  bairro: "",
  uf: "",
  numero: "",
  cep: "",
  senha: "",
  confirmarSenha: "",
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
          setForm((prev) => ({
            ...prev,
            bairro: data.bairro || prev.bairro,
            uf: data.uf || prev.uf,
          }));
        } else {
          onToast?.(
            "aviso",
            "CEP não encontrado",
            "Verifique o CEP e preencha o endereço manualmente."
          );
        }
      } catch {
        onToast?.(
          "erro",
          "Erro ao buscar CEP",
          "Não foi possível consultar o ViaCEP."
        );
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
        name="cep"
        placeholder="00000-000"
        value={form.cep}
        onChange={onChange}
        maxLength={9}
      />

      <BcFormModalRow>
        <BcInput
          label="UF"
          name="uf"
          placeholder="SC"
          value={form.uf}
          onChange={onChange}
          maxLength={2}
        />

        <BcInput
          label="Número"
          name="numero"
          placeholder="Ex: 123"
          value={form.numero}
          onChange={onChange}
        />
      </BcFormModalRow>

      <BcInput
        label="Bairro"
        name="bairro"
        placeholder="Nome do bairro"
        value={form.bairro}
        onChange={onChange}
      />
    </>
  );
}

/* ── Modal Cadastro ── */
function ModalCadastro({ onSucesso, onToast }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const { buscandoCEP } = useViaCEP(form.cep, setForm, onToast);

  function handleChange(e) {
    const { name, value } = e.target;

    let v = value;

    if (name === "cnpj") v = formatarCNPJ(value);
    if (name === "cep") v = formatarCEP(value);
    if (name === "uf") v = value.toUpperCase().slice(0, 2);

    setForm((prev) => ({ ...prev, [name]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setErro("");

    const err = validar(form, true);

    if (err) {
      setErro(err);
      return;
    }

    setLoading(true);

    try {
      await cadastrarInstituicao({
        nome: form.nome,
        cnpj: form.cnpj.replace(/\D/g, ""),
        email: form.email,
        senha: form.senha,
        bairro: form.bairro,
        uf: form.uf,
        numero: form.numero,
        cep: form.cep.replace(/\D/g, ""),
      });

      onToast?.(
        "sucesso",
        "Instituição cadastrada",
        `A instituição ${form.nome} foi cadastrada com sucesso.`
      );

      onSucesso();
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  const senhasCoincidem =
    form.confirmarSenha.length > 0 &&
    form.senha === form.confirmarSenha;

  return (
    <BcFormModal
      title="Nova Instituição"
      subtitle="Preencha os dados para cadastrar"
      error={erro}
      onSubmit={handleSubmit}
    >
      <BcInput
        label="Nome"
        name="nome"
        placeholder="Nome da instituição"
        value={form.nome}
        onChange={handleChange}
      />

      <BcInput
        label="CNPJ"
        name="cnpj"
        placeholder="00.000.000/0000-00"
        value={form.cnpj}
        onChange={handleChange}
        maxLength={18}
      />

      <BcInput
        label="Email"
        name="email"
        type="email"
        placeholder="email@exemplo.com"
        value={form.email}
        onChange={handleChange}
      />

      <CamposEndereco
        form={form}
        onChange={handleChange}
        buscandoCEP={buscandoCEP}
      />

      <BcInput
        label="Senha"
        name="senha"
        type={showSenha ? "text" : "password"}
        placeholder="Crie uma senha"
        value={form.senha}
        onChange={handleChange}
        autoComplete="new-password"
        suffix={
          <button
            type="button"
            className="bc-form-modal__icon-button"
            onClick={() => setShowSenha((v) => !v)}
          >
            {showSenha ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
          </button>
        }
        hint={<BcPasswordStrength password={form.senha} />}
      />

      <BcInput
        label="Confirmar Senha"
        name="confirmarSenha"
        type={showConfirmar ? "text" : "password"}
        placeholder="Confirme sua senha"
        value={form.confirmarSenha}
        onChange={handleChange}
        autoComplete="new-password"
        suffix={
          <button
            type="button"
            className="bc-form-modal__icon-button"
            onClick={() => setShowConfirmar((v) => !v)}
          >
            {showConfirmar ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
          </button>
        }
        hint={
          form.confirmarSenha.length > 0 ? (
            <span
              className="bc-form-modal__match"
              style={{
                color: senhasCoincidem ? "#0d9e8a" : "#e05252",
              }}
            >
              {senhasCoincidem
                ? "✓ Senhas coincidem"
                : "✗ Senhas não coincidem"}
            </span>
          ) : null
        }
      />

      <BcButton type="submit" loading={loading}>
        Cadastrar
      </BcButton>
    </BcFormModal>
  );
}

/* ── Modal Edição ── */
function ModalEditar({ instituicao, onSucesso, onToast }) {
  const [form, setForm] = useState({
    nome: instituicao.nome || "",
    cnpj: formatarCNPJ(String(instituicao.cnpj || "")),
    email: instituicao.email || "",
    bairro: instituicao.bairro || "",
    uf: instituicao.uf || "",
    numero: String(instituicao.numero || ""),
    cep: formatarCEP(String(instituicao.cep || "")),
  });

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const { buscandoCEP } = useViaCEP(form.cep, setForm, onToast);

  function handleChange(e) {
    const { name, value } = e.target;

    let v = value;

    if (name === "cnpj") v = formatarCNPJ(value);
    if (name === "cep") v = formatarCEP(value);
    if (name === "uf") v = value.toUpperCase().slice(0, 2);

    setForm((prev) => ({ ...prev, [name]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setErro("");

    const err = validar(form);

    if (err) {
      setErro(err);
      return;
    }

    setLoading(true);

    try {
      await atualizarInstituicao(instituicao.id, {
        nome: form.nome,
        cnpj: form.cnpj.replace(/\D/g, ""),
        email: form.email,
        bairro: form.bairro,
        uf: form.uf,
        numero: form.numero,
        cep: form.cep.replace(/\D/g, ""),
      });

      onToast?.(
        "sucesso",
        "Instituição atualizada",
        `Os dados de ${form.nome} foram salvos.`
      );

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
      <BcInput
        label="Nome"
        name="nome"
        placeholder="Nome da instituição"
        value={form.nome}
        onChange={handleChange}
      />

      <BcInput
        label="CNPJ"
        name="cnpj"
        placeholder="00.000.000/0000-00"
        value={form.cnpj}
        onChange={handleChange}
        maxLength={18}
      />

      <BcInput
        label="Email"
        name="email"
        type="email"
        placeholder="email@exemplo.com"
        value={form.email}
        onChange={handleChange}
      />

      <CamposEndereco
        form={form}
        onChange={handleChange}
        buscandoCEP={buscandoCEP}
      />

      <BcButton type="submit" loading={loading}>
        Salvar alterações
      </BcButton>
    </BcFormModal>
  );
}

/* ── Colunas ── */
const COLUNAS = [
  {
    chave: "nome",
    titulo: "Nome",
    className: "bc-listagem-tdNome",
  },
  {
    chave: "cnpj",
    titulo: "CNPJ",
    className: "bc-listagem-tdMuted",
  },
  {
    chave: "email",
    titulo: "Email",
    className: "bc-listagem-tdMuted",
  },
  {
    chave: "bairro",
    titulo: "Endereço",
    className: "bc-listagem-tdMuted",
    render: (inst) => `${inst.bairro}, ${inst.numero} — ${inst.uf}`,
  },
  {
    chave: "cep",
    titulo: "CEP",
    className: "bc-listagem-tdMuted",
  },
  {
    chave: "status",
    titulo: "Status",
    className: "bc-listagem-tdMuted",
    render: (inst) => (
      <span
        style={{
          color: inst.status === "ATIVO" ? "#0d9e8a" : "#e05252",
          fontWeight: 600,
        }}
      >
        {inst.status}
      </span>
    ),
  },
];

/* ── Dashboard ── */
export default function Admindashboard({ onLogout }) {
  const { toastProps, mostrarToast } = useBcToast();

  const [instituicoes, setInstituicoes] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("ATIVO");

  const [carregando, setCarregando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [modalCadastro, setModalCadastro] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);

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

  useEffect(() => {
    recarregarLista();
  }, [recarregarLista]);

  const filtradas = instituicoes.filter((i) => {
    const matchBusca =
      i.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      String(i.cnpj || "").includes(busca) ||
      String(i.email || "")
        .toLowerCase()
        .includes(busca.toLowerCase());

    const matchStatus =
      filtroStatus === "TODAS"
        ? true
        : i.status === filtroStatus;

    return matchBusca && matchStatus;
  });

  async function handleInativar(inst) {
    setExcluindo(true);

    try {
      await deletarInstituicao(inst.id);

      mostrarToast(
        "sucesso",
        "Instituição inativada",
        `${inst.nome} foi inativada.`
      );

      recarregarLista();
    } catch (err) {
      mostrarToast("erro", "Erro ao inativar", err.message);
    } finally {
      setExcluindo(false);
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
          textoVazio={
            busca
              ? "Nenhuma instituição encontrada."
              : "Nenhuma instituição cadastrada ainda."
          }
          carregando={carregando}
          excluindo={excluindo}
          onEditar={(inst) => setModalEditar(inst)}
          onExcluir={handleInativar}
          tituloConfirmacao="Inativar instituição?"
          mensagemConfirmacao="A instituição deixará de aparecer como ativa na listagem."
          textoConfirmar="Sim, inativar"
          textoCarregandoExcluir="Inativando..."
          toolbarExtra={
            <BcSelect
              value={filtroStatus}
              onChange={setFiltroStatus}
              options={[
                { value: "ATIVO", label: "Ativas" },
                { value: "INATIVO", label: "Inativas" },
                { value: "TODAS", label: "Todas" },
              ]}
            />
          }
        />
      </main>

      {/* Modal Cadastro */}
      <BcModal
        aberto={modalCadastro}
        onFechar={() => setModalCadastro(false)}
      >
        <ModalCadastro
          onSucesso={() => {
            setModalCadastro(false);
            recarregarLista();
          }}
          onToast={mostrarToast}
        />
      </BcModal>

      {/* Modal Edição */}
      <BcModal
        aberto={!!modalEditar}
        onFechar={() => setModalEditar(null)}
      >
        {modalEditar && (
          <ModalEditar
            instituicao={modalEditar}
            onSucesso={() => {
              setModalEditar(null);
              recarregarLista();
            }}
            onToast={mostrarToast}
          />
        )}
      </BcModal>
    </div>
  );
}