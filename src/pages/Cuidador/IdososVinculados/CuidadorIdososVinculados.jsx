import { useEffect, useMemo, useState } from "react";
import BcTopbar from "../../../components/BcTopbar/BcTopbar";
import {
  IconeBusca,
  IconeIdosos,
  IconeSair,
  IconeSetaEsquerda,
} from "../../../components/icons/Icons";
import { listarIdososDoCuidador } from "../../../api/instituicaoApi";
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

function IdosoCard({ idoso }) {
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
      </div>
    </article>
  );
}

export default function CuidadorIdososVinculados({ onBack, onLogout }) {
  const [idosos, setIdosos] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

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
    const cpfBusca = busca.replace(/\D/g, "");

    if (!termo && !cpfBusca) return idosos;

    return idosos.filter((idoso) => {
      const nome = normalizarBusca(idoso.nome);
      const cpf = String(idoso.cpf || "").replace(/\D/g, "");
      return nome.includes(termo) || (cpfBusca && cpf.includes(cpfBusca));
    });
  }, [busca, idosos]);

  return (
    <div className="cuidador-idosos-page">
      <BcTopbar
        title="Usuarios Vinculados"
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
              <IdosoCard key={idoso.id || idoso.cpf || idoso.nome} idoso={idoso} />
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
    </div>
  );
}
