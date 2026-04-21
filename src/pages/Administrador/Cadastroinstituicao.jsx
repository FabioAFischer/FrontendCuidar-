import { useState } from "react";
import BcInput from "../../components/Bcinput/BcInput";
import BcButton from "../../components/Bcbutton/BcButton";
import BcLogo from "../../components/Bclogo/BcLogo";
import BcPasswordStrength from "../../components/BcPasswordStrength/BcPasswordStrength";
import { IconeVoltar, IconeOlhoAberto, IconeOlhoFechado, IconeSucesso } from "../../components/icons/Icons";
import { cadastrarInstituicao } from "../../api/administradorApi";
import "./Cadastroinstituicao.css";

/* ── Helpers de formatação ── */
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

/* ── Validação ── */
function validar(form) {
  if (!form.nome.trim())                           return "Informe o nome.";
  if (form.cnpj.replace(/\D/g, "").length < 14)   return "CNPJ inválido.";
  if (!form.bairro.trim())                         return "Informe o bairro.";
  if (form.uf.trim().length !== 2)                 return "UF deve ter 2 letras (ex: SC).";
  if (!form.numero.trim())                         return "Informe o número.";
  if (form.cep.replace(/\D/g, "").length < 8)      return "CEP inválido.";
  return null;
}

/* ── Tela de sucesso ── */
function TelaSucesso({ nome, onContinuar }) {
  return (
    <div className="cad-sucesso">
      <div className="cad-sucesso__icone">
        <IconeSucesso />
      </div>
      <h2>Cadastro realizado!</h2>
      <p>A instituição <strong>{nome}</strong> foi cadastrada com sucesso.</p>
      <BcButton onClick={onContinuar}>Ir para o início</BcButton>
    </div>
  );
}

/* ── Tela principal ── */
export default function CadastroUsuario({ onVoltar, onSucesso }) {
  const [form, setForm] = useState({
    nome:   "",
    cnpj:   "",
    bairro: "",
    uf:     "",
    numero: "",
    cep:    "",
    senha:         "",
    confirmarSenha: "",
  });
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

  const senhasCoincidem =
    form.confirmarSenha.length > 0 && form.senha === form.confirmarSenha;

  if (sucesso) {
    return (
      <div className="cad-page">
        <div className="cad-card">
          <TelaSucesso nome={form.nome} onContinuar={onSucesso} />
        </div>
      </div>
    );
  }

  return (
    <div className="cad-page">
      <div className="cad-card">

        {/* Voltar */}
        <button className="cad-voltar" onClick={onVoltar} type="button">
          <IconeVoltar />
          Voltar
        </button>

        {/* Logo */}
        <div className="cad-logo-wrap">
          <BcLogo size="md" />
        </div>

        {/* Cabeçalho */}
        <div className="cad-header">
          <h1>Criar Conta</h1>
          <p>Preencha seus dados para começar</p>
        </div>

        {/* Formulário */}
        <form className="cad-form" onSubmit={handleSubmit} noValidate>

          <BcInput
            label="Nome"
            name="nome"
            placeholder="Nome completo ou da instituição"
            value={form.nome}
            onChange={handleChange}
            autoComplete="name"
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
            label="Bairro"
            name="bairro"
            placeholder="Nome do bairro"
            value={form.bairro}
            onChange={handleChange}
          />

          {/* UF + Número lado a lado */}
          <div className="cad-row">
            <BcInput
              label="UF"
              name="uf"
              placeholder="SC"
              value={form.uf}
              onChange={handleChange}
              maxLength={2}
            />
            <BcInput
              label="Número"
              name="numero"
              placeholder="Ex: 123"
              value={form.numero}
              onChange={handleChange}
            />
          </div>

          <BcInput
            label="CEP"
            name="cep"
            placeholder="00000-000"
            value={form.cep}
            onChange={handleChange}
            maxLength={9}
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
                className="cad-olho"
                onClick={() => setShowSenha(v => !v)}
                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
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
                className="cad-olho"
                onClick={() => setShowConfirmar(v => !v)}
                aria-label={showConfirmar ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirmar ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
              </button>
            }
            hint={
              form.confirmarSenha.length > 0 ? (
                <span
                  className="cad-match"
                  style={{ color: senhasCoincidem ? "#0d9e8a" : "#e05252" }}
                >
                  {senhasCoincidem ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
                </span>
              ) : null
            }
          />

          {erro && <div className="cad-erro" role="alert">{erro}</div>}

          <BcButton type="submit" loading={loading}>
            Cadastrar
          </BcButton>

          <p className="cad-link-login">
            Já tem uma conta? <a href="/login">Entrar</a>
          </p>

        </form>
      </div>
    </div>
  );
}