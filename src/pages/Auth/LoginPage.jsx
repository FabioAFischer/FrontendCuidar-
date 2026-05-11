import { useState } from "react";
import BcInput from "../../components/Bcinput/BcInput";
import BcLogo from "../../components/Bclogo/BcLogo";
import BcButton from "../../components/Bcbutton/BcButton";
import BcModal from "../../components/BcModal/BcModal";
import BcPasswordStrength from "../../components/BcPasswordStrength/BcPasswordStrength";
import BcToast from "../../components/BcToast/BcToast";
import { login as loginUsuario, verificar2fa } from "../../api/authApi";
import {
  enviarIdentificador,
  verificarCodigo,
  definirNovaSenha,
} from "../../api/recuperarSenhaApi";
import {
  formatarCpfCnpj,
} from "../../utils/validacaoDocumento";
import "./LoginPage.css";

/* ── Ícones ── */
const IconeEmail = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="m2 7 8.586 5.657a2 2 0 0 0 2.828 0L22 7" />
  </svg>
);
const IconeCodigo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <path d="M12 18h.01M8 6h8M8 10h8M8 14h4" />
  </svg>
);
const IconeCadeado = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="12" cy="16" r="1" fill="currentColor" />
  </svg>
);
const IconeSeguranca = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const IconeSucesso = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m8 12 3 3 5-5" />
  </svg>
);
const IconeOlhoAberto = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconeOlhoFechado = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ── Validação de senha ── */
function validarSenha(senha) {
  if (senha.length < 8)             return "Mínimo de 8 caracteres.";
  if (!/[A-Z]/.test(senha))        return "Deve conter ao menos uma letra maiúscula.";
  if (!/[a-z]/.test(senha))        return "Deve conter ao menos uma letra minúscula.";
  if (!/[0-9]/.test(senha))        return "Deve conter ao menos um número.";
  if (!/[^A-Za-z0-9]/.test(senha)) return "Deve conter ao menos um caractere especial.";
  return null;
}

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

/* ══════════════════════════════════════════
   Modal 2FA
   ══════════════════════════════════════════ */
function Modal2FA({ aberto, emailMascarado, rememberMe, perfil, onSucesso, onFechar }) {
  const [emailCompleto, setEmailCompleto] = useState("");
  const [codigo, setCodigo]               = useState("");
  const [loading, setLoading]             = useState(false);
  const [erro, setErro]                   = useState("");

  function handleFechar() {
    setEmailCompleto("");
    setCodigo("");
    setErro("");
    onFechar();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!emailCompleto.trim()) { setErro("Informe seu email completo."); return; }
    if (codigo.trim().length !== 6) { setErro("O código deve ter 6 dígitos."); return; }

    setLoading(true);
    try {
      const data = await verificar2fa({ email: emailCompleto, codigo, rememberMe });
      onSucesso(data, perfil);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <BcModal aberto={aberto} onFechar={handleFechar}>
      <div className="mrs-wrap">
        <div className="mrs-header">
          <div className="mrs-header__icone"><IconeSeguranca /></div>
          <h2>Verificação em duas etapas</h2>
          <p>
            Enviamos um código para{" "}
            <strong className="mrs-email-destaque">{emailMascarado}</strong>.
            Confirme seu email e insira o código recebido.
          </p>
        </div>
        <form className="mrs-form" onSubmit={handleSubmit} noValidate>
          <BcInput
            label="Seu email completo"
            name="twofa-email"
            type="email"
            placeholder="seuemail@exemplo.com"
            value={emailCompleto}
            onChange={e => { setEmailCompleto(e.target.value); setErro(""); }}
            autoComplete="email"
          />
          <BcInput
            label="Código de verificação"
            name="twofa-codigo"
            type="text"
            placeholder="000000"
            value={codigo}
            onChange={e => { setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6)); setErro(""); }}
            autoComplete="one-time-code"
            maxLength={6}
            error={erro}
          />
          <BcButton type="submit" loading={loading}>Confirmar acesso</BcButton>
          <BcButton variant="ghost" onClick={handleFechar}>Cancelar</BcButton>
        </form>
      </div>
    </BcModal>
  );
}

/* ══════════════════════════════════════════
   Modal Recuperar Senha — 3 passos
   ══════════════════════════════════════════ */
const PASSOS = ["identificador", "codigo", "nova-senha"];

function ModalRecuperarSenha({ aberto, onFechar }) {
  const [passo, setPasso]                     = useState("identificador");
  const [loading, setLoading]                 = useState(false);
  const [erro, setErro]                       = useState("");
  const [identificador, setIdentificador]     = useState("");
  const [emailMascarado, setEmailMascarado]   = useState("");
  const [emailCompleto, setEmailCompleto]     = useState("");
  const [codigo, setCodigo]                   = useState("");
  const [emailVerificado, setEmailVerificado] = useState("");
  const [novaSenha, setNovaSenha]             = useState("");
  const [confirmar, setConfirmar]             = useState("");
  const [showNova, setShowNova]               = useState(false);
  const [showConfirmar, setShowConfirmar]     = useState(false);

  function resetar() {
    setPasso("identificador"); setLoading(false); setErro("");
    setIdentificador(""); setEmailMascarado(""); setEmailCompleto("");
    setCodigo(""); setEmailVerificado(""); setNovaSenha("");
    setConfirmar(""); setShowNova(false); setShowConfirmar(false);
  }

  function handleFechar() { resetar(); onFechar(); }

  async function handleEnviarIdentificador(e) {
    e.preventDefault();
    setErro("");
    if (!identificador.trim()) { setErro("Informe seu CPF ou CNPJ cadastrado."); return; }
    setLoading(true);
    try {
      const data = await enviarIdentificador(identificador);
      setEmailMascarado(data.email);
      setPasso("codigo");
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerificarCodigo(e) {
    e.preventDefault();
    setErro("");
    if (!emailCompleto.trim()) { setErro("Informe seu email completo."); return; }
    if (codigo.trim().length !== 6) { setErro("O código deve ter 6 dígitos."); return; }
    setLoading(true);
    try {
      const data = await verificarCodigo(emailCompleto, codigo);
      setEmailVerificado(data.email);
      setPasso("nova-senha");
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDefinirSenha(e) {
    e.preventDefault();
    setErro("");
    const erroSenha = validarSenha(novaSenha);
    if (erroSenha) { setErro(erroSenha); return; }
    if (novaSenha !== confirmar) { setErro("As senhas não coincidem."); return; }
    setLoading(true);
    try {
      await definirNovaSenha(emailVerificado, novaSenha);
      setPasso("sucesso");
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (passo === "sucesso") {
    return (
      <BcModal aberto={aberto} onFechar={handleFechar}>
        <div className="mrs-sucesso">
          <div className="mrs-sucesso__icone"><IconeSucesso /></div>
          <h2>Senha alterada!</h2>
          <p>Sua senha foi redefinida com sucesso. Você já pode fazer login com a nova senha.</p>
          <BcButton onClick={handleFechar}>Ir para o login</BcButton>
        </div>
      </BcModal>
    );
  }

  const passoAtual = PASSOS.indexOf(passo);

  return (
    <BcModal aberto={aberto} onFechar={handleFechar}>
      <div className="mrs-wrap">
        <div className="mrs-passos">
          {PASSOS.map((_, i) => (
            <div key={i} className={`mrs-passo-dot ${i <= passoAtual ? "mrs-passo-dot--ativo" : ""}`} />
          ))}
        </div>

        {passo === "identificador" && (
          <>
            <div className="mrs-header">
              <div className="mrs-header__icone"><IconeEmail /></div>
              <h2>Recuperar senha</h2>
              <p>Informe o CPF ou CNPJ cadastrado para receber o código de recuperação.</p>
            </div>
            <form className="mrs-form" onSubmit={handleEnviarIdentificador} noValidate>
              <BcInput
                label="CPF ou CNPJ" name="mrs-identificador" type="text"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={identificador}
                onChange={e => { setIdentificador(e.target.value); setErro(""); }}
                autoComplete="off" error={erro}
              />
              <BcButton type="submit" loading={loading}>Enviar código</BcButton>
              <BcButton variant="ghost" onClick={handleFechar}>Cancelar</BcButton>
            </form>
          </>
        )}

        {passo === "codigo" && (
          <>
            <div className="mrs-header">
              <div className="mrs-header__icone"><IconeCodigo /></div>
              <h2>Digite o código</h2>
              <p>
                Enviamos um código para{" "}
                <strong className="mrs-email-destaque">{emailMascarado}</strong>.
                Confirme seu email e insira o código recebido.
              </p>
            </div>
            <form className="mrs-form" onSubmit={handleVerificarCodigo} noValidate>
              <BcInput
                label="Seu email completo" name="mrs-email-completo" type="email"
                placeholder="seuemail@exemplo.com"
                value={emailCompleto}
                onChange={e => { setEmailCompleto(e.target.value); setErro(""); }}
                autoComplete="email"
              />
              <BcInput
                label="Código de verificação" name="mrs-codigo" type="text"
                placeholder="000000" value={codigo}
                onChange={e => { setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6)); setErro(""); }}
                autoComplete="one-time-code" maxLength={6} error={erro}
              />
              <BcButton type="submit" loading={loading}>Verificar código</BcButton>
              <BcButton variant="ghost" onClick={() => { setPasso("identificador"); setErro(""); setCodigo(""); setEmailCompleto(""); }}>
                Voltar
              </BcButton>
            </form>
          </>
        )}

        {passo === "nova-senha" && (
          <>
            <div className="mrs-header">
              <div className="mrs-header__icone"><IconeCadeado /></div>
              <h2>Nova senha</h2>
              <p>Crie uma senha forte com pelo menos 8 caracteres, maiúscula, minúscula, número e símbolo.</p>
            </div>
            <form className="mrs-form" onSubmit={handleDefinirSenha} noValidate>
              <BcInput
                label="Nova senha" name="mrs-nova-senha"
                type={showNova ? "text" : "password"} placeholder="Crie uma senha forte"
                value={novaSenha}
                onChange={e => { setNovaSenha(e.target.value); setErro(""); }}
                autoComplete="new-password"
                suffix={
                  <button type="button" className="mrs-olho" onClick={() => setShowNova(v => !v)}>
                    {showNova ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
                  </button>
                }
                hint={<BcPasswordStrength password={novaSenha} />}
              />
              <BcInput
                label="Confirmar nova senha" name="mrs-confirmar"
                type={showConfirmar ? "text" : "password"} placeholder="Repita a senha"
                value={confirmar}
                onChange={e => { setConfirmar(e.target.value); setErro(""); }}
                autoComplete="new-password"
                suffix={
                  <button type="button" className="mrs-olho" onClick={() => setShowConfirmar(v => !v)}>
                    {showConfirmar ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
                  </button>
                }
                hint={
                  confirmar.length > 0 ? (
                    <span style={{ fontSize: 12, fontWeight: 500, color: novaSenha === confirmar ? "#0d9e8a" : "#e05252" }}>
                      {novaSenha === confirmar ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
                    </span>
                  ) : null
                }
              />
              {erro && <div className="mrs-erro" role="alert">{erro}</div>}
              <BcButton type="submit" loading={loading}>Salvar nova senha</BcButton>
            </form>
          </>
        )}
      </div>
    </BcModal>
  );
}

/* ══════════════════════════════════
   Login Page
   ══════════════════════════════════ */
export default function LoginPage({ onLogin }) {
  const [cpfCnpj, setCpfCnpj]               = useState("");
  const [password, setPassword]             = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [rememberMe, setRememberMe]         = useState(true);
  const [error, setError]                   = useState("");
  const [loadingProfile, setLoadingProfile] = useState("");
  const [modalRecuperar, setModalRecuperar] = useState(false);

  // estado 2FA
  const [modal2FA, setModal2FA]             = useState(false);
  const [twoFaEmail, setTwoFaEmail]         = useState("");
  const [twoFaPerfil, setTwoFaPerfil]       = useState("");
  const [twoFaRemember, setTwoFaRemember]   = useState(true);

  const [toast, setToast] = useState({
    aberto: false, tipo: "info", titulo: "", mensagem: "",
  });

  function mostrarToast(tipo, titulo, mensagem) {
    setToast({ aberto: true, tipo, titulo, mensagem });
  }

  function fecharToast() {
    setToast(atual => ({ ...atual, aberto: false }));
  }

  function handleCpfCnpjChange(event) {
    const valorFormatado = formatarCpfCnpj(event.target.value);
    setCpfCnpj(valorFormatado);

    if (error) {
      setError("");
    }
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

      // Backend pediu 2FA — abre modal
      if (data.requer2fa) {
        setTwoFaEmail(data.email);
        setTwoFaPerfil(profile);
        setTwoFaRemember(rememberMe);
        setModal2FA(true);
        return;
      }

      // Login direto (sem 2FA)
      mostrarToast("sucesso", "Login realizado", `Login de ${profileNames[profile].toLowerCase()} realizado com sucesso.`);
      if (onLogin) onLogin(profile, data);
    } catch (err) {
      mostrarToast("erro", "Falha no login", err.message || "Nao foi possivel fazer login.");
    } finally {
      setLoadingProfile("");
    }
  }

  function handle2FASucesso(data, profile) {
    setModal2FA(false);
    mostrarToast("sucesso", "Login realizado", `Login de ${profileNames[profile].toLowerCase()} realizado com sucesso.`);
    if (onLogin) onLogin(profile, data);
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

      <Modal2FA
        aberto={modal2FA}
        emailMascarado={twoFaEmail}
        rememberMe={twoFaRemember}
        perfil={twoFaPerfil}
        onSucesso={handle2FASucesso}
        onFechar={() => setModal2FA(false)}
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
              label="CPF ou CNPJ" name="cpfCnpj" type="text"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              value={cpfCnpj} onChange={handleCpfCnpjChange}
              autoComplete="off" inputMode="numeric" maxLength={18}
              error={error && !cpfCnpj.trim() ? error : ""}
            />
            <BcInput
              label="Senha" name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              error={error && !password.trim() ? error : ""}
              suffix={
                <button type="button" className="login-form__password-toggle"
                  onClick={() => setShowPassword(c => !c)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}>
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              }
            />
            <div className="login-form__row">
              <label className="login-form__checkbox">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                <span>Lembrar de mim</span>
              </label>
              <button type="button" className="login-form__link" onClick={() => setModalRecuperar(true)}>
                Esqueceu a senha?
              </button>
            </div>

            <div className="login-form__profiles">
              {Object.entries(profileDescriptions).map(([profile, description]) => (
                <button
                  key={profile} type="button" className="login-profile-button"
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
                  <span className="login-profile-button__description">{description}</span>
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
