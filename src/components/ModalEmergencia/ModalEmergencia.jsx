/**
 * ModalEmergencia
 *
 * Props:
 *   aberto   : boolean
 *   onFechar : fn
 *   idoso    : { id, nome }
 */
import { useCallback, useEffect, useState } from "react";
import BcButton from "../Bcbutton/BcButton";
import BcModal from "../BcModal/BcModal";
import BcToast, { useBcToast } from "../BcToast/BcToast";
import { listarVinculosPorIdoso, definirVinculoEmergencia } from "../../api/instituicaoApi";
import "./ModalEmergencia.css";

function inicial(nome = "") {
  return String(nome).charAt(0).toUpperCase() || "?";
}

const IconeEmergencia = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" />
  </svg>
);

export default function ModalEmergencia({ aberto, onFechar, idoso }) {
  const { toastProps, mostrarToast } = useBcToast();
  const [vinculos, setVinculos]           = useState([]);
  const [carregando, setCarregando]       = useState(false);
  const [salvando, setSalvando]           = useState(false);
  // id do vínculo selecionado localmente (ainda não confirmado)
  const [selecionado, setSelecionado]     = useState(null);
  // id do vínculo atual de emergência (vindo do backend)
  const [emergenciaAtual, setEmergenciaAtual] = useState(null);

  const carregarVinculos = useCallback(async () => {
    if (!idoso?.id) return;
    setCarregando(true);
    try {
      const lista = await listarVinculosPorIdoso(idoso.id);
      setVinculos(lista);
      const atual = lista.find(v => v.tipoVinculo === "EMERGENCIA");
      setEmergenciaAtual(atual?.id ?? null);
      setSelecionado(atual?.id ?? null);
    } catch (err) {
      mostrarToast("erro", "Erro ao carregar vínculos", err.message);
    } finally {
      setCarregando(false);
    }
  }, [idoso?.id, mostrarToast]);

  useEffect(() => {
    if (aberto) carregarVinculos();
  }, [aberto, carregarVinculos]);

  async function handleConfirmar() {
    if (!selecionado || selecionado === emergenciaAtual) { onFechar(); return; }
    setSalvando(true);
    try {
      await definirVinculoEmergencia(selecionado);
      const nome = vinculos.find(v => v.id === selecionado)?.nomeCuidador || "";
      mostrarToast("sucesso", "Contato de emergência atualizado",
        `${nome} agora é o contato de emergência de ${idoso.nome}.`);
      onFechar();
    } catch (err) {
      mostrarToast("erro", "Erro ao definir emergência", err.message);
    } finally {
      setSalvando(false);
    }
  }

  const mudou = selecionado !== emergenciaAtual;

  return (
    <>
      <BcToast {...toastProps} />
      <BcModal aberto={aberto} onFechar={onFechar}>
        <div className="mem-wrap">

          {/* Cabeçalho */}
          <div className="mem-header">
            <div className="mem-header__icone"><IconeEmergencia /></div>
            <div>
              <h2 className="mem-header__titulo">Contato de Emergência</h2>
              <p className="mem-header__sub">{idoso?.nome}</p>
            </div>
          </div>

          {/* Instrução */}
          <div className="mem-instrucao">
            <strong>Selecione</strong> o cuidador que será acionado em caso de emergência
            e clique em <strong>Confirmar</strong> para salvar.
          </div>

          {/* Lista de vínculos */}
          <div className="mem-lista">
            {carregando ? (
              <p className="mem-vazio">Carregando cuidadores...</p>
            ) : vinculos.length === 0 ? (
              <p className="mem-vazio">Nenhum cuidador vinculado a este idoso.</p>
            ) : (
              vinculos.map((v) => {
                const isAtual      = v.id === emergenciaAtual;
                const isSelecionado = v.id === selecionado;
                return (
                  <label
                    key={v.id}
                    className={`mem-item ${isSelecionado ? "mem-item--selecionado" : ""}`}
                  >
                    <input
                      type="radio"
                      className="mem-item__radio"
                      name="emergencia"
                      value={v.id}
                      checked={isSelecionado}
                      onChange={() => setSelecionado(v.id)}
                    />
                    <div className={`mem-item__avatar ${isSelecionado ? "mem-item__avatar--sel" : ""}`}>
                      {inicial(v.nomeCuidador)}
                    </div>
                    <div className="mem-item__info">
                      <strong>{v.nomeCuidador}</strong>
                      {isAtual && <span className="mem-badge">Atual</span>}
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="mem-footer">
            <button type="button" className="mem-btn-cancelar" onClick={onFechar}>
              Cancelar
            </button>
            <BcButton
              onClick={handleConfirmar}
              loading={salvando}
              disabled={carregando || vinculos.length === 0}
              fullWidth={false}
            >
              {mudou ? "Confirmar" : "Fechar"}
            </BcButton>
          </div>
        </div>
      </BcModal>
    </>
  );
}