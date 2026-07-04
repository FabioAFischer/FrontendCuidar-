import { useMemo, useState } from "react";
import BcListagem from "../BcListagem/BcListagem";
import { IconeMais, IconeRemedio } from "../icones/Icones";
import "./BcListagemRemedios.css";

export default function BcListagemRemedios({
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
          aria-label="Cadastrar remédio"
          title="Cadastrar remédio"
        >
          <IconeMais />
        </button>
      </div>

      <BcListagem
        titulo="Remédios"
        iconeTitulo={<IconeRemedio />}
        itens={remediosFiltrados}
        colunas={[
          { chave: "nome", titulo: "Nome", className: "bc-listagem-tdNome" },
        ]}
        busca={busca}
        placeholderBusca="Buscar remédio..."
        onBuscaChange={setBusca}
        textoVazio={busca ? "Nenhum remédio encontrado." : "Nenhum remédio cadastrado ainda."}
        carregando={carregando}
        textoCarregando="Carregando remédios..."
        erro={erro}
        onVisualizar={onVisualizar}
        onEditar={onEditar}
        onExcluir={onInativar}
        tituloConfirmacao="Inativar remédio?"
        mensagemConfirmacao="O remédio será inativado e todas as prescrições vinculadas a ele também serão removidas da listagem."
        textoConfirmar="Sim, inativar"
        textoCarregandoExcluir="Inativando..."
        excluindo={inativando}
        itensPorPagina={100}
      />
    </div>
  );
}
