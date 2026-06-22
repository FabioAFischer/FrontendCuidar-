/**
 * ModalGerenciarCuidadores
 *
 * Props:
 *   aberto      : boolean
 *   onFechar    : fn
 *   idoso       : { id, nome }
 *   cuidadores  : Array  — lista de cuidadores da instituição
 */
import { useCallback, useEffect, useState } from "react";
import BcBotao from "../BcBotao/BcBotao";
import BcModal from "../BcModal/BcModal";
import BcNotificacao, { useBcNotificacao } from "../BcNotificacao/BcNotificacao";
import { listarVinculosPorIdoso, criarVinculo, excluirVinculo } from "../../api/instituicaoApi";
import "./ModalGerenciarCuidadores.css";

function gerarInicialNome(nome = "") {
  return String(nome).charAt(0).toUpperCase() || "?";
}

function formatarCpf(valor = "") {
  const n = String(valor).replace(/\D/g, "").slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefone(valor = "") {
  const n = String(valor).replace(/\D/g, "").slice(0, 9);
  return n.replace(/(\d{5})(\d{0,4})$/, "$1-$2").replace(/-$/, "");
}

export default function ModalGerenciarCuidadores({ aberto, onFechar, idoso, cuidadores = [] }) {
  const { toastProps, mostrarToast } = useBcNotificacao();
  const [carregando, setCarregando]     = useState(false);
  const [salvando, setSalvando]         = useState(false);
  // set de cuidadorId com vínculo ativo (do servidor)
  const [vinculados, setVinculados]     = useState(new Set());
  // mapa cuidadorId → vinculoId (para deletar)
  const [mapaVinculos, setMapaVinculos] = useState({});
  // seleções locais (estado local antes de confirmar)
  const [selecoesLocais, setSelecoesLocais] = useState(new Set());

  const carregarVinculos = useCallback(async () => {
    if (!idoso?.id) return;
    setCarregando(true);
    try {
      const lista = await listarVinculosPorIdoso(idoso.id);
      const ids = new Set(lista.map((v) => Number(v.cuidadorId)));
      const mapa = {};
      lista.forEach((v) => { mapa[Number(v.cuidadorId)] = v.id; });
      setVinculados(ids);
      setMapaVinculos(mapa);
      // Inicializa seleções locais com os vínculos atuais
      setSelecoesLocais(new Set(ids));
    } catch (err) {
      mostrarToast("erro", "Erro ao carregar vínculos", err.message);
    } finally {
      setCarregando(false);
    }
  }, [idoso?.id, mostrarToast]);

  useEffect(() => {
    if (aberto) carregarVinculos();
  }, [aberto, carregarVinculos]);

  function aoAlternarVinculoLocal(cuidador) {
    const cuidadorId = Number(cuidador.id);
    setSelecoesLocais((ant) => {
      const nova = new Set(ant);
      if (nova.has(cuidadorId)) {
        nova.delete(cuidadorId);
      } else {
        nova.add(cuidadorId);
      }
      return nova;
    });
  }

  async function aoConcluirGerenciamentoCuidadores() {
    setSalvando(true);
    try {
      // Calcula diferenças
      const adicionados = Array.from(selecoesLocais).filter((id) => !vinculados.has(id));
      const removidos = Array.from(vinculados).filter((id) => !selecoesLocais.has(id));

      // Se não há mudanças, apenas fecha
      if (adicionados.length === 0 && removidos.length === 0) {
        onFechar();
        return;
      }

      // Cria novos vínculos
      for (const cuidadorId of adicionados) {
        await criarVinculo({ cuidadorId, idosoId: idoso.id });
      }

      // Remove vínculos
      for (const cuidadorId of removidos) {
        const vinculoId = mapaVinculos[cuidadorId];
        if (vinculoId) {
          await excluirVinculo(vinculoId);
        }
      }

      // Recarrega os vínculos
      await carregarVinculos();

      // Mostra um único toast com o resumo
      let mensagem = "";
      if (adicionados.length > 0 && removidos.length > 0) {
        mensagem = `${adicionados.length} cuidador(es) vinculado(s) e ${removidos.length} desvinculado(s) com sucesso.`;
      } else if (adicionados.length > 0) {
        mensagem = `${adicionados.length} cuidador(es) vinculado(s) com sucesso.`;
      } else if (removidos.length > 0) {
        mensagem = `${removidos.length} cuidador(es) desvinculado(s) com sucesso.`;
      }

      if (mensagem) {
        mostrarToast("sucesso", "Vínculos atualizados", mensagem);
      }

      onFechar();
    } catch (err) {
      mostrarToast("erro", "Erro ao atualizar vínculos", err.message);
    } finally {
      setSalvando(false);
    }
  }

  const totalAutorizados = selecoesLocais.size;

  return (
    <>
      <BcNotificacao {...toastProps} />
      <BcModal aberto={aberto} onFechar={onFechar}>
        <div className="mgc-wrap">
          {/* Cabeçalho */}
          <div className="mgc-header">
            <div className="mgc-header__avatar">
              {gerarInicialNome(idoso?.nome)}
            </div>
            <div>
              <h2 className="mgc-header__titulo">Gerenciar Cuidadores</h2>
              <p className="mgc-header__subtitulo">{idoso?.nome}</p>
            </div>
          </div>

          {/* Instruções */}
          <div className="mgc-instrucoes">
            <strong>Instruções:</strong> Selecione os cuidadores que terão acesso às
            informações deste idoso. Os cuidadores marcados poderão visualizar dados
            e gerenciar medicamentos.
          </div>

          {/* Contador */}
          <p className="mgc-contador">
            Total de cuidadores: {cuidadores.length} | Autorizados: {totalAutorizados}
          </p>

          {/* Lista de cuidadores */}
          <div className="mgc-lista">
            {carregando ? (
              <p className="mgc-vazio">Carregando...</p>
            ) : cuidadores.length === 0 ? (
              <p className="mgc-vazio">Nenhum cuidador cadastrado na instituição.</p>
            ) : (
              cuidadores.map((c) => {
                const ativo = selecoesLocais.has(Number(c.id));
                return (
                  <label
                    key={c.id}
                    className={`mgc-item ${ativo ? "mgc-item--ativo" : ""}`}
                  >
                    <input
                      type="checkbox"
                      className="mgc-item__check"
                      checked={ativo}
                      disabled={salvando}
                      onChange={() => aoAlternarVinculoLocal(c)}
                    />
                    <div className="mgc-item__avatar">{gerarInicialNome(c.nome)}</div>
                    <div className="mgc-item__info">
                      <strong>{c.nome}</strong>
                      <span>CPF: {formatarCpf(c.cpf)}</span>
                      {c.contato && (
                        <span>
                          Tel: ({c.contato.ddd}) {formatarTelefone(c.contato.telefone)}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="mgc-footer">
            <p className="mgc-footer__info">
              {totalAutorizados} cuidador(es) autorizado(s)
            </p>
            <BcBotao onClick={aoConcluirGerenciamentoCuidadores} fullWidth={false} loading={salvando}>
              Concluir
            </BcBotao>
          </div>
        </div>
      </BcModal>
    </>
  );
}
