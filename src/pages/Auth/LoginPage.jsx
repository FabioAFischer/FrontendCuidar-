import { useState } from "react";
import BcButton from "../../components/Bcbutton/BcButton";
import BcInput from "../../components/Bcinput/BcInput";
import BcLogo from "../../components/Bclogo/BcLogo";
import "./LoginPage.css";

const profileDescriptions = {
  cuidador: "Acesse sua rotina, oportunidades e informações de atendimento.",
  instituicao: "Gerencie equipes, cadastros e demandas institucionais.",
  administrador: "Controle cadastros, indicadores e configurações da plataforma.",
};

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  function validateForm() {
    if (!email.trim()) {
      setError("Informe o seu email.");
      return false;
    }

    if (!password.trim()) {
      setError("Informe a sua senha.");
      return false;
    }

    setError("");
    return true;
  }

  function handleProfileLogin(profile) {
    if (!validateForm()) {
      return;
    }

    const profileName = {
      cuidador: "Cuidador",
      instituicao: "Instituição",
      administrador: "Administrador",
    }[profile];

    setFeedback(
      rememberMe
        ? `Login de ${profileName.toLowerCase()} preparado com opção de lembrar acesso.`
        : `Login de ${profileName.toLowerCase()} preparado para futura integração com o backend.`
    );

    if (onLogin) {
      onLogin(profile, { email, password, rememberMe });
    }
  }

  function handleForgotPassword(event) {
    event.preventDefault();
    setError("");
    setFeedback("Fluxo de recuperação de senha pronto para ser conectado ao backend ou à navegação futura.");
  }

  function handleSignup(event) {
    event.preventDefault();
    setError("");
    setFeedback("Link de cadastro preparado. Você pode conectá-lo a uma próxima tela quando o fluxo estiver disponível.");
  }

  return (
    <main className="login-page">
      <section className="login-page__hero">
        <div className="login-page__hero-content">
          <div className="login-page__eyebrow">Plataforma de cuidado e gestão</div>
          <BcLogo size="lg" />
          <h1>Acesso seguro para quem cuida, organiza e acompanha.</h1>
          <p>
            Entre com sua conta para acessar rotinas assistenciais, gestão
            institucional e painéis administrativos em um só ambiente.
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
                <strong>Gestão institucional</strong>
                <p>Organização de cadastros, equipes e processos de forma clara.</p>
              </div>
            </article>
            <article className="login-highlight">
              <span className="login-highlight__icon" aria-hidden="true">OK</span>
              <div>
                <strong>Acesso por perfil</strong>
                <p>Fluxo preparado para cuidador, instituição e administrador.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="login-page__panel" aria-label="Formulário de login">
        <div className="login-card">
          <div className="login-card__header">
            <span className="login-card__tag">Login</span>
            <h2>Bem-vindo de volta</h2>
            <p>Use seu email e senha para acessar a plataforma.</p>
          </div>

          <form
            className="login-form"
            onSubmit={(event) => event.preventDefault()}
            noValidate
          >
            <BcInput
              label="Email"
              name="email"
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              error={error && !email.trim() ? error : ""}
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

            {error && email.trim() && password.trim() ? (
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
                  onClick={() => handleProfileLogin(profile)}
                >
                  <span className="login-profile-button__title">
                    Entrar como
                    {" "}
                    {{
                      cuidador: "Cuidador",
                      instituicao: "Instituição",
                      administrador: "Administrador",
                    }[profile]}
                  </span>
                  <span className="login-profile-button__description">
                    {description}
                  </span>
                </button>
              ))}
            </div>

            <BcButton type="button" onClick={() => handleProfileLogin("administrador")}>
              Acessar com o perfil principal
            </BcButton>
          </form>

          <div className="login-card__footer">
            <span>Não tem uma conta?</span>
            <a href="#cadastro" className="login-form__link" onClick={handleSignup}>
              Cadastrar-se
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
