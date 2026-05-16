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
import BcButton from "../Bcbutton/BcButton";
import BcModal from "../BcModal/BcModal";
import BcToast, { useBcToast } from "../BcToast/BcToast";
import { listarVinculosPorIdoso, criarVinculo, deletarVinculo } from "../../api/instituicaoApi";
import "./Modalgerenciarcuidadores.css";

function inicial(nome = "") {
  return String(nome).charAt(0).toUpperCase() || "?";
}

function formatarCPF(valor = "") {
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
  const { toastProps, mostrarToast } = useBcToast();
  const [vinculos, setVinculos]         = useState([]);
  const [carregando, setCarregando]     = useState(false);
  const [salvando, setSalvando]         = useState(false);
  // set de cuidadorId com vínculo ativo
  const [vinculados, setVinculados]     = useState(new Set());
  // mapa cuidadorId → vinculoId (para deletar)
  const [mapaVinculos, setMapaVinculos] = useState({});

  const carregarVinculos = useCallback(async () => {
    if (!idoso?.id) return;
    setCarregando(true);
    try {
      const lista = await listarVinculosPorIdoso(idoso.id);
      setVinculos(lista);
      const ids = new Set(lista.map((v) => Number(v.cuidadorId)));
      const mapa = {};
      lista.forEach((v) => { mapa[Number(v.cuidadorId)] = v.id; });
      setVinculados(ids);
      setMapaVinculos(mapa);
    } catch (err) {
      mostrarToast("erro", "Erro ao carregar vínculos", err.message);
    } finally {
      setCarregando(false);
    }
  }, [idoso?.id, mostrarToast]);

  useEffect(() => {
    if (aberto) carregarVinculos();
  }, [aberto, carregarVinculos]);

  async function handleToggle(cuidador) {
    const cuidadorId = Number(cuidador.id);
    setSalvando(true);
    try {
      if (vinculados.has(cuidadorId)) {
        const vinculoId = mapaVinculos[cuidadorId];
        await deletarVinculo(vinculoId);
        mostrarToast("sucesso", "Vínculo removido", `${cuidador.nome} foi desvinculado de ${idoso.nome}.`);
      } else {
        await criarVinculo({ cuidadorId, idosoId: idoso.id });
        mostrarToast("sucesso", "Vínculo criado", `${cuidador.nome} foi vinculado a ${idoso.nome}.`);
      }
      await carregarVinculos();
    } catch (err) {
      mostrarToast("erro", "Erro ao atualizar vínculo", err.message);
    } finally {
      setSalvando(false);
    }
  }

  const totalAutorizados = vinculados.size;

  return (
    <>
      <BcToast {...toastProps} />
      <BcModal aberto={aberto} onFechar={onFechar}>
        <div className="mgc-wrap">
          {/* Cabeçalho */}
          <div className="mgc-header">
            <div className="mgc-header__avatar">
              {inicial(idoso?.nome)}
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
                const ativo = vinculados.has(Number(c.id));
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
                      onChange={() => handleToggle(c)}
                    />
                    <div className="mgc-item__avatar">{inicial(c.nome)}</div>
                    <div className="mgc-item__info">
                      <strong>{c.nome}</strong>
                      <span>CPF: {formatarCPF(c.cpf)}</span>
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
            <BcButton onClick={onFechar} fullWidth={false}>
              Concluir
            </BcButton>
          </div>
        </div>
      </BcModal>
    </>
  );
}