import { useEffect, useMemo, useState } from "react";
import BcButton from "../../../components/Bcbutton/BcButton";
import BcFormModal from "../../../components/BcFormModal/BcFormModal";
import BcInput from "../../../components/Bcinput/BcInput";
import BcModal from "../../../components/BcModal/BcModal";
import BcTopbar from "../../../components/BcTopbar/BcTopbar";
import {
  IconeBusca,
  IconeIdosos,
  IconeSair,
  IconeSetaEsquerda,
} from "../../../components/icons/Icons";
import { somenteNumeros, cpfValido } from "../../../utils/validacaoDocumento";
import { listarIdososDoCuidador, obterSenhaAcessoIdoso } from "../../../api/instituicaoApi";
import "./CuidadorIdososVinculados.css";

function formatarCPF(valor = "") {
  const numeros = String(valor).replace(/\D/g, "").slice(0, 11);
  return numeros
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefone(idoso) {
  const contato = idoso?.contato || {};
  const ddd = contato.ddd || idoso?.ddd;
  const telefone = contato.telefone || idoso?.telefone;

  if (!telefone) return "Nao informado";

  const numero = String(telefone).replace(/\D/g, "");
  const telefoneFormatado = numero.length > 8
    ? numero.replace(/(\d{5})(\d{4})$/, "$1-$2")
    : numero.replace(/(\d{4})(\d{4})$/, "$1-$2");

  return ddd ? `(${ddd}) ${telefoneFormatado}` : telefoneFormatado;
}

function normalizarBusca(valor = "") {
  return String(valor).toLowerCase().trim();
}

function IdosoCard({ idoso, onSenhaClick }) {
  const inicial = String(idoso.nome || "?").charAt(0).toUpperCase();

  return (
    <article className="cuidador-idosos-card">
      <span className="cuidador-idosos-card__avatar">{inicial}</span>
      <div className="cuidador-idosos-card__content">
        <h3>{idoso.nome || "Idoso sem nome"}</h3>
        <dl>
          <div>
            <dt>CPF</dt>
            <dd>{formatarCPF(idoso.cpf) || "Nao informado"}</dd>
          </div>
          <div>
            <dt>Telefone</dt>
            <dd>{formatarTelefone(idoso)}</dd>
          </div>
        </dl>
        <button
          className="cuidador-idosos-card__senha"
          type="button"
          onClick={() => onSenhaClick(idoso)}
        >
          {idoso.senhaAcessoGerada ? "Visualizar senha" : "Gerar senha"}
        </button>
      </div>
    </article>
  );
}

export default function CuidadorIdososVinculados({ onBack, onLogout }) {
  const [idosos, setIdosos] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [idosoSenha, setIdosoSenha] = useState(null);
  const [senhaCuidador, setSenhaCuidador] = useState("");
  const [senhaAcesso, setSenhaAcesso] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [carregandoSenha, setCarregandoSenha] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarIdosos() {
      try {
        setCarregando(true);
        setErro("");
        const lista = await listarIdososDoCuidador();

        if (ativo) {
          setIdosos(Array.isArray(lista) ? lista : []);
        }
      } catch {
        if (ativo) {
          setErro("Nao foi possivel carregar os usuarios vinculados.");
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarIdosos();

    return () => {
      ativo = false;
    };
  }, []);

  const idososFiltrados = useMemo(() => {
    const termo = normalizarBusca(busca);
    const cpfBusca = somenteNumeros(busca);

    if (!termo && !cpfBusca) return idosos;

    return idosos.filter((idoso) => {
      const nome = normalizarBusca(idoso.nome);
      const cpf = somenteNumeros(idoso.cpf);

      // If user typed a full CPF, validate it; if invalid, don't match by CPF
      if (cpfBusca.length === 11 && !cpfValido(cpfBusca)) return nome.includes(termo);

      return nome.includes(termo) || (cpfBusca && cpf.includes(cpfBusca));
    });
  }, [busca, idosos]);

  function abrirModalSenha(idoso) {
    setIdosoSenha(idoso);
    setSenhaCuidador("");
    setSenhaAcesso("");
    setErroSenha("");
  }

  function fecharModalSenha() {
    if (carregandoSenha) return;
    setIdosoSenha(null);
    setSenhaCuidador("");
    setSenhaAcesso("");
    setErroSenha("");
  }

  async function handleObterSenha(evento) {
    evento.preventDefault();

    if (!senhaCuidador.trim()) {
      setErroSenha("Informe sua senha para continuar.");
      return;
    }

    try {
      setCarregandoSenha(true);
      setErroSenha("");
      const resposta = await obterSenhaAcessoIdoso(idosoSenha.id, senhaCuidador);
      setSenhaAcesso(resposta?.senha || "");
      setIdosos((atuais) =>
        atuais.map((idoso) =>
          Number(idoso.id) === Number(idosoSenha.id)
            ? { ...idoso, senhaAcessoGerada: true }
            : idoso
        )
      );
    } catch (error) {
      setErroSenha(error.message || "Nao foi possivel obter a senha.");
    } finally {
      setCarregandoSenha(false);
    }
  }

  return (
    <div className="cuidador-idosos-page">
      <BcTopbar
        title="Idosos Vinculados"
        subtitle="Todos os idosos associados ao seu acompanhamento"
        actionLabel="Sair"
        actionIcon={<IconeSair />}
        onAction={onLogout}
      />

      <main className="cuidador-idosos-main">
        <button className="cuidador-idosos-voltar" type="button" onClick={onBack}>
          <IconeSetaEsquerda />
          Voltar ao painel
        </button>

        <section className="cuidador-idosos-header" aria-labelledby="usuarios-vinculados-titulo">
          <div>
            <span><IconeIdosos /></span>
            <div>
              <h1 id="usuarios-vinculados-titulo">Usuarios vinculados</h1>
              <p>{idosos.length} usuario(s) vinculado(s) ao cuidador.</p>
            </div>
          </div>

          <label className="cuidador-idosos-busca">
            <IconeBusca />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome ou CPF"
            />
          </label>
        </section>

        {erro && (
          <div className="cuidador-idosos-alerta" role="alert">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="cuidador-idosos-empty">
            <p>Carregando usuarios vinculados...</p>
          </div>
        ) : idososFiltrados.length > 0 ? (
          <section className="cuidador-idosos-lista" aria-label="Lista de usuarios vinculados">
            {idososFiltrados.map((idoso) => (
              <IdosoCard
                key={idoso.id || idoso.cpf || idoso.nome}
                idoso={idoso}
                onSenhaClick={abrirModalSenha}
              />
            ))}
          </section>
        ) : (
          <div className="cuidador-idosos-empty">
            <span><IconeIdosos /></span>
            <p>{busca ? "Nenhum usuario encontrado." : "Nenhum usuario vinculado ainda."}</p>
            <small>
              {busca
                ? "Tente buscar por outro nome ou CPF."
                : "Os usuarios vinculados pela instituicao aparecerao aqui."}
            </small>
          </div>
        )}
      </main>

      <BcModal aberto={!!idosoSenha} onFechar={fecharModalSenha}>
        <BcFormModal
          title={senhaAcesso ? "Senha de acesso" : idosoSenha?.senhaAcessoGerada ? "Visualizar senha" : "Gerar senha"}
          subtitle={idosoSenha ? `Confirme sua senha de cuidador para acessar a senha de ${idosoSenha.nome}.` : ""}
          error={erroSenha}
          onSubmit={handleObterSenha}
          className="cuidador-idosos-senha-modal"
        >
          {!senhaAcesso ? (
            <>
              <BcInput
                label="Senha do cuidador"
                name="senhaCuidador"
                type="password"
                value={senhaCuidador}
                onChange={(event) => setSenhaCuidador(event.target.value)}
                autoComplete="current-password"
              />
              <div className="cuidador-idosos-senha-modal__acoes">
                <BcButton type="button" variant="ghost" fullWidth={false} onClick={fecharModalSenha} disabled={carregandoSenha}>
                  Cancelar
                </BcButton>
                <BcButton type="submit" fullWidth={false} loading={carregandoSenha}>
                  Confirmar
                </BcButton>
              </div>
            </>
          ) : (
            <>
              <div className="cuidador-idosos-senha-modal__senha">
                <span>Senha de acesso</span>
                <strong>{senhaAcesso}</strong>
              </div>
              <BcButton type="button" variant="ghost" onClick={fecharModalSenha}>
                Fechar
              </BcButton>
            </>
          )}
        </BcFormModal>
      </BcModal>
    </div>
  );
}
