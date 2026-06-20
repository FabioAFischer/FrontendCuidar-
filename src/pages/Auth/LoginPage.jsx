import { useState, useEffect, useRef } from "react";
import BcInput from "../../components/Bcinput/BcInput";
import BcLogo from "../../components/Bclogo/BcLogo";
import BcButton from "../../components/Bcbutton/BcButton";
import BcModal from "../../components/BcModal/BcModal";
import BcPasswordStrength from "../../components/BcPasswordStrength/BcPasswordStrength";
import BcToast, { useBcToast } from "../../components/BcToast/BcToast";
import {
  IconeCadeado,
  IconeCodigo,
  IconeEmail,
  IconeOlhoAberto,
  IconeOlhoFechado,
  IconeSeguranca,
  IconeSucesso,
} from "../../components/icons/Icons";
import { autenticarUsuario as autenticarUsuarioNoSistema, validarCodigoDoisFatores } from "../../api/authApi";
import {
  enviarIdentificador,
  verificarCodigo,
  definirNovaSenha,
  reenviarCodigoDoisFatores,
} from "../../api/recuperarSenhaApi";
import { formatarCpfCnpj } from "../../utils/validacaoDocumento";
import "./LoginPage.css";

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
  cuidador:      "Acesse sua rotina, oportunidades e informações de atendimento.",
  instituicao:   "Gerencie equipes, cadastros e demandas institucionais.",
  administrador: "Controle cadastros, indicadores e configurações da plataforma.",
};

const profileNames = {
  cuidador:      "Cuidador",
  instituicao:   "Instituição",
  administrador: "Administrador",
};

const TIMER_SEGUNDOS = 30;

/* ══════════════════════════════════════════
   Modal 2FA
   ══════════════════════════════════════════ */
function ModalDoisFatores({ aberto, emailMascarado, identificador, rememberMe, perfil, onSucesso, onFechar }) {
  const [codigo, setCodigo]           = useState("");
  const [loading, setLoading]         = useState(false);
  const [reenviando, setReenviando]   = useState(false);
  const [erro, setErro]               = useState("");
  const [sucesso, setSucesso]         = useState("");
  const [timer, setTimer]             = useState(TIMER_SEGUNDOS);
  const intervalRef                   = useRef(null);

  // Inicia o timer quando o modal abre
  useEffect(() => {
    if (!aberto) return;

    setTimer(TIMER_SEGUNDOS);
    setCodigo("");
    setErro("");
    setSucesso("");

    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [aberto]);

  function reiniciarTemporizadorCodigo() {
    clearInterval(intervalRef.current);
    setTimer(TIMER_SEGUNDOS);
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function aoFecharModal() {
    clearInterval(intervalRef.current);
    setCodigo("");
    setErro("");
    setSucesso("");
    onFechar();
  }

  async function aoEnviarFormulario(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    if (codigo.trim().length !== 6) { setErro("O código deve ter 6 dígitos."); return; }
    setLoading(true);
    try {
      const data = await validarCodigoDoisFatores({ identificador, codigo, perfil, rememberMe });
      onSucesso(data, perfil);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function aoReenviarCodigo() {
    setErro("");
    setSucesso("");
    setReenviando(true);
    try {
      await reenviarCodigoDoisFatores({ identificador, perfil });
      setSucesso("Código reenviado!");
      reiniciarTemporizadorCodigo();
    } catch (err) {
      setErro(err.message);
    } finally {
      setReenviando(false);
    }
  }

  const podeReenviar = timer === 0 && !reenviando;

  return (
    <BcModal aberto={aberto} onFechar={aoFecharModal}>
      <div className="mrs-wrap">
        <div className="mrs-header">
          <div className="mrs-header__icone"><IconeSeguranca /></div>
          <h2>Verificação em duas etapas</h2>
          <p>
            Enviamos um código para{" "}
            <strong className="mrs-email-destaque">{emailMascarado}</strong>.
            Insira o código recebido.
          </p>
        </div>
        <form className="mrs-form" onSubmit={aoEnviarFormulario} noValidate>
          <BcInput
            label="Código de verificação"
            name="twofa-codigo"
            type="text"
            placeholder="000000"
            value={codigo}
            onChange={e => { setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6)); setErro(""); setSucesso(""); }}
            autoComplete="one-time-code"
            maxLength={6}
            error={erro}
          />

          {sucesso && (
            <p className="mrs-sucesso-inline">{sucesso}</p>
          )}

          <BcButton type="submit" loading={loading}>Confirmar acesso</BcButton>

          <BcButton
            type="button"
            variant="ghost"
            onClick={aoReenviarCodigo}
            loading={reenviando}
            disabled={!podeReenviar}
          >
            {timer > 0
              ? `Reenviar código em ${timer}s`
              : reenviando
              ? "Reenviando..."
              : "Reenviar código"}
          </BcButton>

          <BcButton variant="ghost" onClick={aoFecharModal}>Cancelar</BcButton>
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

  function limparFluxoRecuperacaoSenha() {
    setPasso("identificador"); setLoading(false); setErro("");
    setIdentificador(""); setEmailMascarado(""); setEmailCompleto("");
    setCodigo(""); setEmailVerificado(""); setNovaSenha("");
    setConfirmar(""); setShowNova(false); setShowConfirmar(false);
  }

  function aoFecharModal() { limparFluxoRecuperacaoSenha(); onFechar(); }

  async function aoEnviarIdentificadorRecuperacao(e) {
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

  async function aoVerificarCodigoRecuperacao(e) {
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

  async function aoDefinirNovaSenhaRecuperacao(e) {
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
      <BcModal aberto={aberto} onFechar={aoFecharModal}>
        <div className="mrs-sucesso">
          <div className="mrs-sucesso__icone"><IconeSucesso /></div>
          <h2>Senha alterada!</h2>
          <p>Sua senha foi redefinida com sucesso. Você já pode fazer login com a nova senha.</p>
          <BcButton onClick={aoFecharModal}>Ir para o login</BcButton>
        </div>
      </BcModal>
    );
  }

  const passoAtual = PASSOS.indexOf(passo);

  return (
    <BcModal aberto={aberto} onFechar={aoFecharModal}>
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
            <form className="mrs-form" onSubmit={aoEnviarIdentificadorRecuperacao} noValidate>
              <BcInput
                label="CPF ou CNPJ" name="mrs-identificador" type="text"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={identificador}
                onChange={e => { setIdentificador(e.target.value); setErro(""); }}
                autoComplete="off" error={erro}
              />
              <BcButton type="submit" loading={loading}>Enviar código</BcButton>
              <BcButton variant="ghost" onClick={aoFecharModal}>Cancelar</BcButton>
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
            <form className="mrs-form" onSubmit={aoVerificarCodigoRecuperacao} noValidate>
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
            <form className="mrs-form" onSubmit={aoDefinirNovaSenhaRecuperacao} noValidate>
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
  const { toastProps, mostrarToast, fecharToast } = useBcToast();
  const [cpfCnpj, setCpfCnpj]               = useState("");
  const [password, setPassword]             = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [rememberMe, setRememberMe]         = useState(false);
  const [error, setError]                   = useState("");
  const [loadingProfile, setLoadingProfile] = useState("");
  const [modalRecuperar, setModalRecuperar] = useState(false);

  // estado 2FA
  const [modal2FA, setModal2FA]                     = useState(false);
  const [twoFaEmail, setTwoFaEmail]                 = useState("");
  const [twoFaIdentificador, setTwoFaIdentificador] = useState("");
  const [twoFaPerfil, setTwoFaPerfil]               = useState("");
  const [twoFaRemember, setTwoFaRemember]           = useState(false);

  function aoAlterarCpfCnpjLogin(event) {
    const valorFormatado = formatarCpfCnpj(event.target.value);
    setCpfCnpj(valorFormatado);
    if (error) setError("");
  }

  function validarFormularioLogin() {
    if (!cpfCnpj.trim()) { setError("Informe seu CPF ou CNPJ."); return false; }
    if (!password.trim()) { setError("Informe a sua senha."); return false; }
    setError("");
    return true;
  }

  async function aoSelecionarPerfilLogin(profile) {
    if (loadingProfile) return;
    if (!validarFormularioLogin()) return;
    setError("");
    fecharToast();
    setLoadingProfile(profile);
    try {
      const data = await autenticarUsuarioNoSistema({
        identificador: cpfCnpj,
        senha: password,
        perfil: profile,
        rememberMe,
      });

      if (data.requer2fa) {
        setTwoFaEmail(data.email);
        setTwoFaIdentificador(cpfCnpj);
        setTwoFaPerfil(profile);
        setTwoFaRemember(rememberMe);
        setModal2FA(true);
        return;
      }

      mostrarToast("sucesso", "Login realizado", `Login de ${profileNames[profile].toLowerCase()} realizado com sucesso.`);
      if (onLogin) onLogin(profile, data);
    } catch (err) {
      mostrarToast("erro", "Falha no login", err.message || "Não foi possível fazer login.");
    } finally {
      setLoadingProfile("");
    }
  }

  function aoConfirmarSucessoDoisFatores(data, profile) {
    setModal2FA(false);
    mostrarToast("sucesso", "Login realizado", `Login de ${profileNames[profile].toLowerCase()} realizado com sucesso.`);
    if (onLogin) onLogin(profile, data);
  }

  return (
    <main className="login-page">
      <BcToast {...toastProps} />

      <ModalDoisFatores
        aberto={modal2FA}
        emailMascarado={twoFaEmail}
        identificador={twoFaIdentificador}
        rememberMe={twoFaRemember}
        perfil={twoFaPerfil}
        onSucesso={aoConfirmarSucessoDoisFatores}
        onFechar={() => setModal2FA(false)}
      />

      <ModalRecuperarSenha
        aberto={modalRecuperar}
        onFechar={() => setModalRecuperar(false)}
      />

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
              value={cpfCnpj} onChange={aoAlterarCpfCnpjLogin}
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
                  onClick={() => aoSelecionarPerfilLogin(profile)}
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