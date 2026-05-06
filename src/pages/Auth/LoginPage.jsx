import { useState } from "react";
import BcInput from "../../components/Bcinput/BcInput";
import BcLogo from "../../components/Bclogo/BcLogo";
import { login as loginUsuario } from "../../api/authApi";
import "./LoginPage.css";

const profileDescriptions = {
  cuidador: "Acesse sua rotina, oportunidades e informacoes de atendimento.",
  instituicao: "Gerencie equipes, cadastros e demandas institucionais.",
  administrador: "Controle cadastros, indicadores e configuracoes da plataforma.",
};

const profileNames = {
  cuidador: "Cuidador",
  instituicao: "Instituicao",
  administrador: "Administrador",
};

export default function LoginPage({ onLogin }) {
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState("");

  function validateForm() {
    if (!cpfCnpj.trim()) {
      setError("Informe seu CPF ou CNPJ.");
      return false;
    }

    if (!password.trim()) {
      setError("Informe a sua senha.");
      return false;
    }

    setError("");
    return true;
  }

  async function handleProfileLogin(profile) {
    if (!validateForm()) {
      return;
    }

    const profileName = profileNames[profile];

    setError("");
    setFeedback("");
    setLoadingProfile(profile);

    try {
      const data = await loginUsuario({
        identificador: cpfCnpj,
        senha: password,
        perfil: profile,
        rememberMe,
      });

      setFeedback(`Login de ${profileName.toLowerCase()} realizado com sucesso.`);

      if (onLogin) {
        onLogin(profile, data);
      }
    } catch (err) {
      setError(err.message || "Nao foi possivel fazer login.");
    } finally {
      setLoadingProfile("");
    }
  }

  function handleForgotPassword(event) {
    event.preventDefault();
    setError("");
    setFeedback("Fluxo de recuperacao de senha pronto para ser conectado ao backend ou a navegacao futura.");
  }

  return (
    <main className="login-page">
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

          <form
            className="login-form"
            onSubmit={(event) => event.preventDefault()}
            noValidate
          >
            <BcInput
              label="CPF ou CNPJ"
              name="cpfCnpj"
              type="text"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              value={cpfCnpj}
              onChange={(event) => setCpfCnpj(event.target.value)}
              autoComplete="off"
              error={error && !cpfCnpj.trim() ? error : ""}
            />

            <BcInput
              label="Senha"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              error={error && !password.trim() ? error : ""}
              suffix={
                <button
                  type="button"
                  className="login-form__password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
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
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>Lembrar de mim</span>
              </label>

              <a href="#recuperar" className="login-form__link" onClick={handleForgotPassword}>
                Esqueceu a senha?
              </a>
            </div>

            {error && cpfCnpj.trim() && password.trim() ? (
              <div className="login-form__message login-form__message--error" role="alert">
                {error}
              </div>
            ) : null}

            {feedback ? (
              <div className="login-form__message login-form__message--info" role="status">
                {feedback}
              </div>
            ) : null}

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
