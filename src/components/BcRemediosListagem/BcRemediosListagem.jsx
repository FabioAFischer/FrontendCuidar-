import { useMemo, useState } from "react";
import BcListagem from "../BcListagem/BcListagem";
import { IconeMais, IconeRemedio } from "../icons/Icons";
import "./BcRemediosListagem.css";

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
