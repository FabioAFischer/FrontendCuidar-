import { useState, useEffect } from "react";
import BcButton from "../Bcbutton/BcButton";
import BcModal from "../BcModal/BcModal";
import BcInput from "../Bcinput/BcInput";
import BcPasswordStrength from "../BcPasswordStrength/BcPasswordStrength";
import { buscarPerfilUsuario } from "../../api/perfilApi";
import {
  enviarIdentificador,
  verificarCodigo,
  definirNovaSenha,
} from "../../api/recuperarSenhaApi";
import {
  IconeCadeado,
  IconeCodigo,
  IconeSucesso,
  IconeOlhoAberto,
  IconeOlhoFechado,
} from "../icons/Icons";
import "./BcPerfilModal.css";

/* ── Ícone chave (local, não existe em Icons.js) ── */
const IconeChave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
);

/* ── Helpers ── */
function formatarCnpj(v = "") {
  const n = String(v).replace(/\D/g, "").slice(0, 14);
  return n
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function formatarCpf(v = "") {
  const n = String(v).replace(/\D/g, "").slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarCep(v = "") {
  const n = String(v).replace(/\D/g, "").slice(0, 8);
  return n.replace(/(\d{5})(\d{0,3})/, "$1-$2").replace(/-$/, "");
}

function formatarTelefone(ddd = "", tel = "") {
  const t = String(tel).replace(/\D/g, "").slice(0, 9);
  const formatted = t.replace(/(\d{5})(\d{0,4})$/, "$1-$2").replace(/-$/, "");
  return ddd ? `(${ddd}) ${formatted}` : formatted;
}

function formatarLabelPerfil(perfil) {
  const map = { INSTITUICAO: "Instituição", CUIDADOR: "Cuidador", ADMINISTRADOR: "Administrador" };
  return map[perfil] || perfil;
}

function gerarInicialNome(nome = "") {
  return String(nome).charAt(0).toUpperCase() || "?";
}

function validarSenha(senha) {
  if (senha.length < 8)             return "Mínimo de 8 caracteres.";
  if (!/[A-Z]/.test(senha))        return "Deve conter ao menos uma letra maiúscula.";
  if (!/[a-z]/.test(senha))        return "Deve conter ao menos uma letra minúscula.";
  if (!/[0-9]/.test(senha))        return "Deve conter ao menos um número.";
  if (!/[^A-Za-z0-9]/.test(senha)) return "Deve conter ao menos um caractere especial.";
  return null;
}

function CampoInfo({ label, valor }) {
  if (!valor) return null;
  return (
    <div className="bcp-campo">
      <span className="bcp-campo__label">{label}</span>
      <span className="bcp-campo__valor">{valor}</span>
    </div>
  );
}

/* ══════════════════════════════════════════
   Fluxo de redefinição de senha (3 passos)
   ══════════════════════════════════════════ */
const PASSOS_SENHA = ["nova-senha", "codigo"];

function RedefinirSenha({ onVoltar, onConcluir }) {
  const [passo, setPasso]               = useState("nova-senha");
  const [loading, setLoading]           = useState(false);
  const [erro, setErro]                 = useState("");
  const [novaSenha, setNovaSenha]       = useState("");
  const [confirmar, setConfirmar]       = useState("");
  const [showNova, setShowNova]         = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [codigo, setCodigo]             = useState("");
  const [emailMascarado, setEmailMascarado] = useState("");

  const identificador = localStorage.getItem("usuarioIdentificador")
    || sessionStorage.getItem("usuarioIdentificador") || "";
  const email = localStorage.getItem("usuarioEmail")
    || sessionStorage.getItem("usuarioEmail") || "";

  async function aoSolicitarCodigoRedefinicaoSenha(e) {
    e.preventDefault();
    setErro("");
    const erroSenha = validarSenha(novaSenha);
    if (erroSenha) { setErro(erroSenha); return; }
    if (novaSenha !== confirmar) { setErro("As senhas não coincidem."); return; }
    setLoading(true);
    try {
      const data = await enviarIdentificador(identificador);
      setEmailMascarado(data.email);
      setPasso("codigo");
    } catch (err) { setErro(err.message); }
    finally { setLoading(false); }
  }

  async function aoConfirmarCodigoRedefinicaoSenha(e) {
    e.preventDefault();
    setErro("");
    if (codigo.trim().length !== 6) { setErro("O código deve ter 6 dígitos."); return; }
    setLoading(true);
    try {
      await verificarCodigo(email, codigo);
      await definirNovaSenha(email, novaSenha);
      setPasso("sucesso");
    } catch (err) { setErro(err.message); }
    finally { setLoading(false); }
  }

  if (passo === "sucesso") {
    return (
      <div className="bcp-redefinir">
        <div className="bcp-redefinir__sucesso">
          <div className="bcp-redefinir__sucesso-icone"><IconeSucesso /></div>
          <h3>Senha alterada!</h3>
          <p>Sua senha foi redefinida com sucesso.</p>
          <BcButton onClick={onConcluir}>Fechar</BcButton>
        </div>
      </div>
    );
  }

  const passoAtual = PASSOS_SENHA.indexOf(passo);

  return (
    <div className="bcp-redefinir">

      <div className="bcp-redefinir__passos">
        {PASSOS_SENHA.map((_, i) => (
          <div key={i} className={`bcp-redefinir__dot ${i <= passoAtual ? "bcp-redefinir__dot--ativo" : ""}`} />
        ))}
      </div>

      {passo === "nova-senha" && (
        <>
          <div className="bcp-redefinir__header">
            <div className="bcp-redefinir__header-icone"><IconeCadeado /></div>
            <h3>Nova senha</h3>
            <p className="bcp-redefinir__desc">
              Crie uma senha forte com pelo menos 8 caracteres, maiúscula, minúscula, número e símbolo.
            </p>
          </div>
          <form className="bcp-redefinir__form" onSubmit={aoSolicitarCodigoRedefinicaoSenha} noValidate>
            <BcInput
              label="Nova senha" name="rp-nova"
              type={showNova ? "text" : "password"} placeholder="Crie uma senha forte"
              value={novaSenha} onChange={e => { setNovaSenha(e.target.value); setErro(""); }}
              autoComplete="new-password"
              suffix={
                <button type="button" className="bcp-olho" onClick={() => setShowNova(v => !v)}>
                  {showNova ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
                </button>
              }
              hint={<BcPasswordStrength password={novaSenha} />}
            />
            <BcInput
              label="Confirmar nova senha" name="rp-confirmar"
              type={showConfirmar ? "text" : "password"} placeholder="Repita a senha"
              value={confirmar} onChange={e => { setConfirmar(e.target.value); setErro(""); }}
              autoComplete="new-password"
              suffix={
                <button type="button" className="bcp-olho" onClick={() => setShowConfirmar(v => !v)}>
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
            {erro && <div className="bcp-erro" role="alert">{erro}</div>}
            <div className="bcp-redefinir__acoes">
              <BcButton variant="ghost" onClick={onVoltar}>Voltar</BcButton>
              <BcButton type="submit" loading={loading} fullWidth={false}>Continuar</BcButton>
            </div>
          </form>
        </>
      )}

      {passo === "codigo" && (
        <>
          <div className="bcp-redefinir__header">
            <div className="bcp-redefinir__header-icone"><IconeCodigo /></div>
            <h3>Confirmar alteração</h3>
            <p className="bcp-redefinir__desc">
              Enviamos um código para{" "}
              <strong className="bcp-email-destaque">{emailMascarado}</strong>.
              Insira o código para confirmar a troca de senha.
            </p>
          </div>
          <form className="bcp-redefinir__form" onSubmit={aoConfirmarCodigoRedefinicaoSenha} noValidate>
            <BcInput
              label="Código de verificação" name="rp-codigo" type="text"
              placeholder="000000" value={codigo}
              onChange={e => { setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6)); setErro(""); }}
              autoComplete="one-time-code" maxLength={6} error={erro}
            />
            <div className="bcp-redefinir__acoes">
              <BcButton variant="ghost" onClick={() => { setPasso("nova-senha"); setErro(""); setCodigo(""); }}>
                Voltar
              </BcButton>
              <BcButton type="submit" loading={loading} fullWidth={false}>Salvar senha</BcButton>
            </div>
          </form>
        </>
      )}

    </div>
  );
}

/* ══════════════════════════════════════════
   BcPerfilModal
   ══════════════════════════════════════════ */
export default function BcPerfilModal({ aberto, onFechar }) {
  const [dados, setDados]             = useState(null);
  const [carregando, setCarregando]   = useState(false);
  const [erro, setErro]               = useState("");
  const [redefinindo, setRedefinindo] = useState(false);

  const perfil = localStorage.getItem("perfil") || sessionStorage.getItem("perfil");
  const nome   = localStorage.getItem("usuarioNome") || sessionStorage.getItem("usuarioNome") || "";

  useEffect(() => {
    if (!aberto) return;
    setRedefinindo(false);
    setErro("");
    setDados(null);
    setCarregando(true);
    buscarPerfilUsuario()
      .then(setDados)
      .catch(err => setErro(err.message))
      .finally(() => setCarregando(false));
  }, [aberto]);

  function aoFecharModal() {
    setRedefinindo(false);
    onFechar();
  }

  return (
    <BcModal aberto={aberto} onFechar={aoFecharModal}>
      <div className="bcp-wrap">

        <div className="bcp-header">
          <div className="bcp-header__avatar">{gerarInicialNome(nome)}</div>
          <div className="bcp-header__info">
            <strong className="bcp-header__nome">{nome}</strong>
            <span className="bcp-header__perfil">{formatarLabelPerfil(perfil)}</span>
          </div>
        </div>

        {carregando && <p className="bcp-carregando">Carregando dados...</p>}
        {erro && <div className="bcp-erro" role="alert">{erro}</div>}

        {!carregando && !redefinindo && dados && (
          <>
            <div className="bcp-campos">
              <CampoInfo label="Nome"  valor={dados.nome} />
              <CampoInfo label="Email" valor={dados.email} />
              {perfil === "INSTITUICAO" && (
                <>
                  <CampoInfo label="CNPJ"   valor={formatarCnpj(dados.cnpj)} />
                  <CampoInfo label="Rua"    valor={dados.rua} />
                  <CampoInfo label="Bairro" valor={dados.bairro} />
                  <CampoInfo label="UF"     valor={dados.uf} />
                  <CampoInfo label="CEP"    valor={formatarCep(dados.cep)} />
                </>
              )}
              {perfil === "CUIDADOR" && (
                <>
                  <CampoInfo label="CPF"      valor={formatarCpf(dados.cpf)} />
                  <CampoInfo label="Telefone" valor={dados.contato ? formatarTelefone(dados.contato.ddd, dados.contato.telefone) : ""} />
                </>
              )}
              {perfil === "ADMINISTRADOR" && (
                <CampoInfo label="CPF" valor={formatarCpf(dados.cpf)} />
              )}
              <CampoInfo label="Status" valor={dados.status} />
            </div>

            <button type="button" className="bcp-btn-redefinir" onClick={() => setRedefinindo(true)}>
              <IconeChave />
              Redefinir senha
            </button>
          </>
        )}

        {!carregando && redefinindo && (
          <RedefinirSenha
            onVoltar={() => setRedefinindo(false)}
            onConcluir={aoFecharModal}
          />
        )}

      </div>
    </BcModal>
  );
}