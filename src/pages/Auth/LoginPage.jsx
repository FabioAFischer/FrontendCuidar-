import { useState } from "react";
import BcInput from "../../components/Bcinput/BcInput";
import BcLogo from "../../components/Bclogo/BcLogo";
import BcButton from "../../components/Bcbutton/BcButton";
import BcModal from "../../components/BcModal/BcModal";
import BcToast from "../../components/BcToast/BcToast";
import { login as loginUsuario } from "../../api/authApi";
import "./LoginPage.css";

/* ── Ícones ── */
const IconeEmail = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="m2 7 8.586 5.657a2 2 0 0 0 2.828 0L22 7" />
  </svg>
);

const IconeSucesso = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m8 12 3 3 5-5" />
  </svg>
);

/* ── Dados de perfil ── */
const profileDescriptions = {
  cuidador:      "Acesse sua rotina, oportunidades e informacoes de atendimento.",
  instituicao:   "Gerencie equipes, cadastros e demandas institucionais.",
  administrador: "Controle cadastros, indicadores e configuracoes da plataforma.",
};

const profileNames = {
  cuidador:      "Cuidador",
  instituicao:   "Instituicao",
  administrador: "Administrador",
};

/* ── Modal de Recuperação de Senha ── */
function ModalRecuperarSenha({ aberto, onFechar }) {
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState("");
  const [sucesso, setSucesso] = useState(false);

  function handleFechar() {
    setCpfCnpj("");
    setErro("");
    setSucesso(false);
    setLoading(false);
    onFechar();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!cpfCnpj.trim()) {
      setErro("Informe seu CPF ou CNPJ cadastrado.");
      return;
    }

    setLoading(true);
    try {
      // TODO: conectar ao endpoint real de recuperação de senha
      await new Promise(r => setTimeout(r, 1200));
      setSucesso(true);
    } catch {
      setErro("Não foi possível enviar a solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BcModal aberto={aberto} onFechar={handleFechar}>
      {sucesso ? (
        <div className="mrs-sucesso">
          <div className="mrs-sucesso__icone"><IconeSucesso /></div>
          <h2>Solicitação enviada!</h2>
          <p>
            Se o CPF ou CNPJ informado estiver cadastrado, você receberá as
            instruções para redefinir sua senha em breve.
          </p>
          <BcButton onClick={handleFechar}>Fechar</BcButton>
        </div>
      ) : (
        <div className="mrs-wrap">
          <div className="mrs-header">
            <div className="mrs-header__icone"><IconeEmail /></div>
            <h2>Recuperar senha</h2>
            <p>
              Informe o CPF ou CNPJ cadastrado. Enviaremos as instruções
              para redefinir sua senha.
            </p>
          </div>
          <form className="mrs-form" onSubmit={handleSubmit} noValidate>
            <BcInput
              label="CPF ou CNPJ"
              name="cpfCnpjRecuperar"
              type="text"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              value={cpfCnpj}
              onChange={e => setCpfCnpj(e.target.value)}
              autoComplete="off"
              error={erro}
            />
            <BcButton type="submit" loading={loading}>
              Enviar instruções
            </BcButton>
            <BcButton variant="ghost" onClick={handleFechar}>
              Cancelar
            </BcButton>
          </form>
        </div>
      )}
    </BcModal>
  );
}

/* ── Login Page ── */
export default function LoginPage({ onLogin }) {
  const [cpfCnpj, setCpfCnpj]               = useState("");
  const [password, setPassword]             = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [rememberMe, setRememberMe]         = useState(true);
  const [error, setError]                   = useState("");
  const [loadingProfile, setLoadingProfile] = useState("");
  const [modalRecuperar, setModalRecuperar] = useState(false);
  const [toast, setToast] = useState({
    aberto: false, tipo: "info", titulo: "", mensagem: "",
  });

  function mostrarToast(tipo, titulo, mensagem) {
    setToast({ aberto: true, tipo, titulo, mensagem });
  }

  function fecharToast() {
    setToast(atual => ({ ...atual, aberto: false }));
  }

  function validateForm() {
    if (!cpfCnpj.trim()) { setError("Informe seu CPF ou CNPJ."); return false; }
    if (!password.trim()) { setError("Informe a sua senha."); return false; }
    setError("");
    return true;
  }

  async function handleProfileLogin(profile) {
    if (loadingProfile) return;
    if (!validateForm()) return;

    setError("");
    fecharToast();
    setLoadingProfile(profile);

    try {
      const data = await loginUsuario({
        identificador: cpfCnpj,
        senha: password,
        perfil: profile,
        rememberMe,
      });

      mostrarToast(
        "sucesso",
        "Login realizado",
        `Login de ${profileNames[profile].toLowerCase()} realizado com sucesso.`
      );

      if (onLogin) onLogin(profile, data);
    } catch (err) {
      mostrarToast("erro", "Falha no login", err.message || "Nao foi possivel fazer login.");
    } finally {
      setLoadingProfile("");
    }
  }

  return (
    <main className="login-page">
      <BcToast
        aberto={toast.aberto}
        tipo={toast.tipo}
        titulo={toast.titulo}
        mensagem={toast.mensagem}
        onFechar={fecharToast}
      />

      <ModalRecuperarSenha
        aberto={modalRecuperar}
        onFechar={() => setModalRecuperar(false)}
      />

      <section className="login-page__hero">
        <div className="login-page__hero-content">
          <div className="login-page__eyebrow">Plataforma de cuidado e gestao</div>
          <BcLogo size="lg" />
          <h1>Acesso seguro para quem cuida, organiza e acompanha.</h1>
          <p>
            Entre com sua conta para acessar rotinas assistenciais, gestao
            institucional e paineis administrativos em um so ambiente.
          </p>

          <div className="login-page__highlights" aria-label="Diferenciais da plataforma">
            <article className="login-highlight">
              <span className="login-highlight__icon" aria-hidden="true">+</span>
              <div>
                <strong>Cuidado humanizado</strong>
                <p>Ferramentas pensadas para a jornada de quem atende e acolhe.</p>
              </div>
            </article>
            <article className="login-highlight">
              <span className="login-highlight__icon" aria-hidden="true">[]</span>
              <div>
                <strong>Gestao institucional</strong>
                <p>Organizacao de cadastros, equipes e processos de forma clara.</p>
              </div>
            </article>
            <article className="login-highlight">
              <span className="login-highlight__icon" aria-hidden="true">OK</span>
              <div>
                <strong>Acesso por perfil</strong>
                <p>Fluxo preparado para cuidador, instituicao e administrador.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="login-page__panel" aria-label="Formulario de login">
        <div className="login-card">
          <div className="login-card__header">
            <span className="login-card__tag">Login</span>
            <h2>Bem-vindo de volta</h2>
            <p>Use seu CPF ou CNPJ e senha para acessar a plataforma.</p>
          </div>

          <form className="login-form" onSubmit={e => e.preventDefault()} noValidate>
            <BcInput
              label="CPF ou CNPJ"
              name="cpfCnpj"
              type="text"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              value={cpfCnpj}
              onChange={e => setCpfCnpj(e.target.value)}
              autoComplete="off"
              maxLength={14}
              error={error && !cpfCnpj.trim() ? error : ""}
            />

            <BcInput
              label="Senha"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              error={error && !password.trim() ? error : ""}
              suffix={
                <button
                  type="button"
                  className="login-form__password-toggle"
                  onClick={() => setShowPassword(c => !c)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              }
            />

            <div className="login-form__row">
              <label className="login-form__checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <span>Lembrar de mim</span>
              </label>

              <button
                type="button"
                className="login-form__link"
                onClick={() => setModalRecuperar(true)}
              >
                Esqueceu a senha?
              </button>
            </div>

            <div className="login-form__profiles">
              {Object.entries(profileDescriptions).map(([profile, description]) => (
                <button
                  key={profile}
                  type="button"
                  className="login-profile-button"
                  disabled={Boolean(loadingProfile)}
                  onClick={() => handleProfileLogin(profile)}
                >
                  <span className="login-profile-button__title">
                    {loadingProfile === profile && (
                      <span className="login-profile-button__spinner" aria-hidden="true" />
                    )}
                    {loadingProfile === profile ? "Entrando como" : "Entrar como"}{" "}
                    {profileNames[profile]}
                  </span>
                  <span className="login-profile-button__description">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}