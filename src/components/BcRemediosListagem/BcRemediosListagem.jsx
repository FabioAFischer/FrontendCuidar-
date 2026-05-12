import { useMemo, useState } from "react";
import BcListagem from "../BcListagem/BcListagem";
import "./BcRemediosListagem.css";

function IconeRemedio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.24 4.24 0 0 0-6-6l-10 10a4.24 4.24 0 0 0 6 6Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}

function IconeMais() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function BcRemediosListagem({
  remedios,
  carregando,
  erro,
  inativando,
  onCadastrar,
  onVisualizar,
  onEditar,
  onInativar,
}) {
  const [busca, setBusca] = useState("");

  const remediosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();

    return remedios.filter((remedio) =>
      String(remedio.nome || "").toLowerCase().includes(termo) ||
      String(remedio.observacao || "").toLowerCase().includes(termo)
    );
  }, [busca, remedios]);

  return (
    <div className="bc-remedios-listagem">
      <div className="bc-remedios-listagem__addWrap">
        <button
          className="bc-remedios-listagem__add"
          type="button"
          onClick={onCadastrar}
          aria-label="Cadastrar remedio"
          title="Cadastrar remedio"
        >
          <IconeMais />
        </button>
      </div>

      <BcListagem
        titulo="Remedios"
        iconeTitulo={<IconeRemedio />}
        itens={remediosFiltrados}
        colunas={[
          { chave: "nome", titulo: "Nome", className: "bc-listagem-tdNome" },
        ]}
        busca={busca}
        placeholderBusca="Buscar remedio..."
        onBuscaChange={setBusca}
        textoVazio={busca ? "Nenhum remedio encontrado." : "Nenhum remedio cadastrado ainda."}
        carregando={carregando}
        textoCarregando="Carregando remedios..."
        erro={erro}
        onVisualizar={onVisualizar}
        onEditar={onEditar}
        onExcluir={onInativar}
        tituloConfirmacao="Inativar remedio?"
        mensagemConfirmacao="O remedio sera inativado e todas as prescricoes vinculadas a ele tambem serao removidas da listagem."
        textoConfirmar="Sim, inativar"
        textoCarregandoExcluir="Inativando..."
        excluindo={inativando}
        itensPorPagina={100}
      />
    </div>
  );
}
