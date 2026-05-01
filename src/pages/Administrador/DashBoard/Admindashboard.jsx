import { useState, useEffect } from "react";
import BcLogo from "../../../components/Bclogo/BcLogo";
import BcButton from "../../../components/Bcbutton/BcButton";
import BcModal from "../../../components/BcModal/BcModal";
import BcInput from "../../../components/Bcinput/BcInput";
import BcPasswordStrength from "../../../components/BcPasswordStrength/BcPasswordStrength";
import BcTopbar from "../../../components/BcTopbar/BcTopbar";
import { IconeOlhoAberto, IconeOlhoFechado, IconeSucesso } from "../../../components/icons/Icons";
import { cadastrarInstituicao, listarInstituicoes, atualizarInstituicao, deletarInstituicao } from "../../../api/administradorApi";
import "./Admindashboard.css";

/* ── Ícones ── */
const IconeBusca = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const IconeEditar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconeLixeira = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
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
const IconeMais = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
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

function validar(form) {
  if (!form.nome.trim())                          return "Informe o nome.";
  if (form.cnpj.replace(/\D/g, "").length < 14)  return "CNPJ inválido.";
  if (!form.bairro.trim())                        return "Informe o bairro.";
  if (form.uf.trim().length !== 2)                return "UF deve ter 2 letras (ex: SC).";
  if (!form.numero.trim())                        return "Informe o número.";
  if (form.cep.replace(/\D/g, "").length < 8)    return "CEP inválido.";
  return null;
}

const FORM_INICIAL = {
  nome: "", cnpj: "", bairro: "", uf: "", numero: "", cep: "",
  senha: "", confirmarSenha: "",
};

/* ── Modal de Cadastro ── */
function ModalCadastro({ onFechar, onSucesso }) {
  const [form, setForm]                   = useState(FORM_INICIAL);
  const [showSenha, setShowSenha]         = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [erro, setErro]                   = useState("");
  const [sucesso, setSucesso]             = useState(false);

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
      await cadastrarInstituicao({
        nome:   form.nome,
        cnpj:   form.cnpj.replace(/\D/g, ""),
        bairro: form.bairro,
        uf:     form.uf,
        numero: form.numero,
        cep:    form.cep.replace(/\D/g, ""),
      });
      setSucesso(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  const senhasCoincidem = form.confirmarSenha.length > 0 && form.senha === form.confirmarSenha;

  if (sucesso) {
    return (
      <div className="mc-sucesso">
        <div className="mc-sucesso__icone"><IconeSucesso /></div>
        <h2>Cadastro realizado!</h2>
        <p>A instituição <strong>{form.nome}</strong> foi cadastrada com sucesso.</p>
        <BcButton onClick={onSucesso}>Concluir</BcButton>
      </div>
    );
  }

  return (
    <div className="mc-wrap">
      <div className="mc-header">
        <BcLogo size="md" />
        <h1>Nova Instituição</h1>
        <p>Preencha os dados para cadastrar</p>
      </div>
      <form className="mc-form" onSubmit={handleSubmit} noValidate>
        <BcInput label="Nome" name="nome" placeholder="Nome da instituição" value={form.nome} onChange={handleChange} />
        <BcInput label="CNPJ" name="cnpj" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={handleChange} maxLength={18} />
        <BcInput label="Bairro" name="bairro" placeholder="Nome do bairro" value={form.bairro} onChange={handleChange} />
        <div className="mc-row">
          <BcInput label="UF" name="uf" placeholder="SC" value={form.uf} onChange={handleChange} maxLength={2} />
          <BcInput label="Número" name="numero" placeholder="Ex: 123" value={form.numero} onChange={handleChange} />
        </div>
        <BcInput label="CEP" name="cep" placeholder="00000-000" value={form.cep} onChange={handleChange} maxLength={9} />
        <BcInput
          label="Senha" name="senha"
          type={showSenha ? "text" : "password"}
          placeholder="Crie uma senha"
          value={form.senha} onChange={handleChange}
          autoComplete="new-password"
          suffix={
            <button type="button" className="mc-olho" onClick={() => setShowSenha(v => !v)}>
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
            <button type="button" className="mc-olho" onClick={() => setShowConfirmar(v => !v)}>
              {showConfirmar ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
            </button>
          }
          hint={
            form.confirmarSenha.length > 0 ? (
              <span className="mc-match" style={{ color: senhasCoincidem ? "#0d9e8a" : "#e05252" }}>
                {senhasCoincidem ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
              </span>
            ) : null
          }
        />
        {erro && <div className="mc-erro" role="alert">{erro}</div>}
        <BcButton type="submit" loading={loading}>Cadastrar</BcButton>
      </form>
    </div>
  );
}

/* ── Modal de Edição ── */
function ModalEditar({ instituicao, onFechar, onSucesso }) {
  const [form, setForm] = useState({
    nome:   instituicao.nome   || "",
    cnpj:   formatarCNPJ(String(instituicao.cnpj || "")),
    bairro: instituicao.bairro || "",
    uf:     instituicao.uf     || "",
    numero: String(instituicao.numero || ""),
    cep:    formatarCEP(String(instituicao.cep || "")),
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState("");
  const [sucesso, setSucesso] = useState(false);

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
        bairro: form.bairro,
        uf:     form.uf,
        numero: form.numero,
        cep:    form.cep.replace(/\D/g, ""),
      });
      setSucesso(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sucesso) {
    return (
      <div className="mc-sucesso">
        <div className="mc-sucesso__icone"><IconeSucesso /></div>
        <h2>Atualizado com sucesso!</h2>
        <p>Os dados de <strong>{form.nome}</strong> foram salvos.</p>
        <BcButton onClick={onSucesso}>Concluir</BcButton>
      </div>
    );
  }

  return (
    <div className="mc-wrap">
      <div className="mc-header">
        <BcLogo size="md" />
        <h1>Editar Instituição</h1>
        <p>Atualize os dados abaixo</p>
      </div>
      <form className="mc-form" onSubmit={handleSubmit} noValidate>
        <BcInput label="Nome" name="nome" placeholder="Nome da instituição" value={form.nome} onChange={handleChange} />
        <BcInput label="CNPJ" name="cnpj" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={handleChange} maxLength={18} />
        <BcInput label="Bairro" name="bairro" placeholder="Nome do bairro" value={form.bairro} onChange={handleChange} />
        <div className="mc-row">
          <BcInput label="UF" name="uf" placeholder="SC" value={form.uf} onChange={handleChange} maxLength={2} />
          <BcInput label="Número" name="numero" placeholder="Ex: 123" value={form.numero} onChange={handleChange} />
        </div>
        <BcInput label="CEP" name="cep" placeholder="00000-000" value={form.cep} onChange={handleChange} maxLength={9} />
        {erro && <div className="mc-erro" role="alert">{erro}</div>}
        <BcButton type="submit" loading={loading}>Salvar alterações</BcButton>
      </form>
    </div>
  );
}

/* ── Dashboard principal ── */
export default function Admindashboard({ onLogout }) {
  const [instituicoes, setInstituicoes]     = useState([]);
  const [busca, setBusca]                   = useState("");
  const [modalCadastro, setModalCadastro]   = useState(false);
  const [modalEditar, setModalEditar]       = useState(null); // guarda a instituição a editar
  const [confirmDelete, setConfirmDelete]   = useState(null);
  const [deletando, setDeletando]           = useState(false);

  function recarregarLista() {
    listarInstituicoes()
      .then(data => setInstituicoes(Array.isArray(data) ? data : []))
      .catch(console.error);
  }

  // Carrega a lista ao montar a tela
  useEffect(() => {
    recarregarLista();
  }, []);

  const filtradas = instituicoes.filter(i =>
    i.nome.toLowerCase().includes(busca.toLowerCase()) ||
    String(i.cnpj).includes(busca)
  );

  async function handleDeletar(id) {
    setDeletando(true);
    try {
      await deletarInstituicao(id);
      setConfirmDelete(null);
      recarregarLista();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletando(false);
    }
  }

  return (
    <div className="adm-page">

      <BcTopbar
        title="Painel Administrativo"
        subtitle="Gestão de Instituições"
        actionLabel="Sair"
        actionIcon={<IconeSair />}
        onAction={onLogout}
      />
      {/* Conteúdo */}
      <main className="adm-main">
        <div className="adm-toolbar">
          <div className="adm-busca-wrap">
            <span className="adm-busca-icone"><IconeBusca /></span>
            <input
              className="adm-busca" type="text"
              placeholder="Buscar por nome ou CNPJ..."
              value={busca} onChange={e => setBusca(e.target.value)}
            />
          </div>
          <BcButton onClick={() => setModalCadastro(true)} fullWidth={false}>
            <IconeMais /> Nova Instituição
          </BcButton>
        </div>

        <div className="adm-tabela-card">
          <div className="adm-tabela-header">
            <span className="adm-tabela-titulo">
              <IconeEdificio />
              Instituições Cadastradas
              <span className="adm-badge">{filtradas.length}</span>
            </span>
          </div>

          {filtradas.length === 0 ? (
            <div className="adm-vazio">
              <div className="adm-vazio__icone"><IconeEdificio /></div>
              <p>{busca ? "Nenhuma instituição encontrada." : "Nenhuma instituição cadastrada ainda."}</p>
            </div>
          ) : (
            <div className="adm-tabela-wrap">
              <table className="adm-tabela">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CNPJ</th>
                    <th>Endereço</th>
                    <th>CEP</th>
                    <th className="adm-th-acoes">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(inst => (
                    <tr key={inst.id}>
                      <td className="adm-td-nome">{inst.nome}</td>
                      <td className="adm-td-muted">{inst.cnpj}</td>
                      <td className="adm-td-muted">{inst.bairro}, {inst.numero} — {inst.uf}</td>
                      <td className="adm-td-muted">{inst.cep}</td>
                      <td>
                        <div className="adm-acoes">
                          <button
                            className="adm-btn-icone adm-btn-editar"
                            title="Editar"
                            onClick={() => setModalEditar(inst)}
                          >
                            <IconeEditar />
                          </button>
                          <button
                            className="adm-btn-icone adm-btn-deletar"
                            title="Excluir"
                            onClick={() => setConfirmDelete(inst.id)}
                          >
                            <IconeLixeira />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal de cadastro */}
      <BcModal aberto={modalCadastro} onFechar={() => setModalCadastro(false)}>
        <ModalCadastro
          onFechar={() => setModalCadastro(false)}
          onSucesso={() => { setModalCadastro(false); recarregarLista(); }}
        />
      </BcModal>

      {/* Modal de edição */}
      <BcModal aberto={!!modalEditar} onFechar={() => setModalEditar(null)}>
        {modalEditar && (
          <ModalEditar
            instituicao={modalEditar}
            onFechar={() => setModalEditar(null)}
            onSucesso={() => { setModalEditar(null); recarregarLista(); }}
          />
        )}
      </BcModal>

      {/* Confirmação de exclusão */}
      {confirmDelete && (
        <div className="adm-confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="adm-confirm" onClick={e => e.stopPropagation()}>
            <div className="adm-confirm__icone"><IconeLixeira /></div>
            <h3>Excluir instituição?</h3>
            <p>Esta ação não pode ser desfeita.</p>
            <div className="adm-confirm__acoes">
              <button className="adm-confirm__cancelar" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button
                className="adm-confirm__confirmar"
                onClick={() => handleDeletar(confirmDelete)}
                disabled={deletando}
              >
                {deletando ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
