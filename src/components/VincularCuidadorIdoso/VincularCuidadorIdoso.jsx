import { useCallback, useEffect, useMemo, useState } from "react";
import BcButton from "../../../components/Bcbutton/BcButton";
import BcModal from "../../../components/BcModal/BcModal";
import BcToast, { useBcToast } from "../../../components/BcToast/BcToast";
import {
  IconeBusca,
  IconeCheck,
  IconeCuidadores,
  IconeIdosos,
  IconeLixeira,
  IconeMais,
} from "../../../components/icons/Icons";
import {
  listarCuidadores,
  listarIdosos,
  listarVinculos,
  criarVinculo,
  deletarVinculo,
} from "../../../api/instituicaoApi";
import "./VincularCuidadorIdoso.css";

/* ─── Ícone local de vínculo ─────────────────────────────────────── */
const IconeVinculo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

/* ─── Helpers ─────────────────────────────────────────────────────── */
function formatarCPF(valor = "") {
  const n = String(valor).replace(/\D/g, "").slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function inicial(nome = "") {
  return String(nome).charAt(0).toUpperCase() || "?";
}

/* ─── Sub-componentes ─────────────────────────────────────────────── */
function BuscaInput({ value, onChange, placeholder }) {
  return (
    <div className="vincular-busca-wrap">
      <span className="vincular-busca-icone"><IconeBusca /></span>
      <input
        className="vincular-busca"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PessoaItem({ pessoa, selecionado, onSelecionar, tipo }) {
  return (
    <button
      type="button"
      className={`vincular-pessoa-item ${selecionado ? "vincular-pessoa-item--selecionado" : ""}`}
      onClick={() => onSelecionar(pessoa)}
    >
      <span className={`vincular-pessoa-avatar vincular-pessoa-avatar--${tipo}`}>
        {inicial(pessoa.nome)}
      </span>
      <span className="vincular-pessoa-info">
        <strong>{pessoa.nome || "Sem nome"}</strong>
        <small>{formatarCPF(pessoa.cpf) || "CPF não informado"}</small>
      </span>
      {selecionado && (
        <span className="vincular-pessoa-check"><IconeCheck /></span>
      )}
    </button>
  );
}

function PainelSelecao({ titulo, icone, tipo, itens, carregando, busca, onBuscaChange, selecionado, onSelecionar, placeholderBusca }) {
  return (
    <div className="vincular-painel">
      <div className="vincular-painel-header">
        <span className={`vincular-painel-icone vincular-painel-icone--${tipo}`}>{icone}</span>
        <h3>{titulo}</h3>
      </div>

      <BuscaInput value={busca} onChange={onBuscaChange} placeholder={placeholderBusca} />

      <div className="vincular-painel-lista">
        {carregando ? (
          <div className="vincular-vazio"><p>Carregando...</p></div>
        ) : itens.length === 0 ? (
          <div className="vincular-vazio">
            <p>Nenhum resultado encontrado.</p>
          </div>
        ) : (
          itens.map((item) => (
            <PessoaItem
              key={item.id}
              pessoa={item}
              tipo={tipo}
              selecionado={selecionado?.id === item.id}
              onSelecionar={onSelecionar}
            />
          ))
        )}
      </div>
    </div>
  );
}

function VinculoItem({ vinculo, onRemover, removendo }) {
  return (
    <div className="vincular-vinculo-item">
      <div className="vincular-vinculo-pares">
        <span className="vincular-vinculo-avatar vincular-vinculo-avatar--cuidador">
          {inicial(vinculo.cuidadorNome)}
        </span>
        <div className="vincular-vinculo-nomes">
          <span>{vinculo.cuidadorNome}</span>
        </div>
        <span className="vincular-vinculo-seta">
          <IconeVinculo />
        </span>
        <span className="vincular-vinculo-avatar vincular-vinculo-avatar--idoso">
          {inicial(vinculo.idosoNome)}
        </span>
        <div className="vincular-vinculo-nomes">
          <span>{vinculo.idosoNome}</span>
        </div>
      </div>

      <button
        type="button"
        className="vincular-vinculo-remover"
        onClick={() => onRemover(vinculo)}
        disabled={removendo}
        title="Remover vínculo"
      >
        <IconeLixeira />
      </button>
    </div>
  );
}

/* ─── Modal principal ─────────────────────────────────────────────── */
function ModalVincular({ aberto, onFechar, onVinculoCriado }) {
  const { toastProps, mostrarToast } = useBcToast();

  const [cuidadores, setCuidadores] = useState([]);
  const [idosos, setIdosos] = useState([]);
  const [buscaCuidador, setBuscaCuidador] = useState("");
  const [buscaIdoso, setBuscaIdoso] = useState("");
  const [cuidadorSelecionado, setCuidadorSelecionado] = useState(null);
  const [idosoSelecionado, setIdosoSelecionado] = useState(null);
  const [carregandoCuidadores, setCarregandoCuidadores] = useState(true);
  const [carregandoIdosos, setCarregandoIdosos] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarDados = useCallback(async () => {
    try {
      setCarregandoCuidadores(true);
      setCarregandoIdosos(true);
      const [listaCuidadores, listaIdosos] = await Promise.all([
        listarCuidadores(),
        listarIdosos(),
      ]);
      setCuidadores(Array.isArray(listaCuidadores) ? listaCuidadores : []);
      setIdosos(Array.isArray(listaIdosos) ? listaIdosos : []);
    } catch {
      mostrarToast("erro", "Erro ao carregar dados", "Tente novamente.");
    } finally {
      setCarregandoCuidadores(false);
      setCarregandoIdosos(false);
    }
  }, [mostrarToast]);

  useEffect(() => {
    if (aberto) {
      carregarDados();
      setCuidadorSelecionado(null);
      setIdosoSelecionado(null);
      setErro("");
    }
  }, [aberto, carregarDados]);

  const cuidadoresFiltrados = useMemo(() =>
    cuidadores.filter((c) =>
      String(c.nome || "").toLowerCase().includes(buscaCuidador.toLowerCase()) ||
      String(c.cpf || "").includes(buscaCuidador.replace(/\D/g, ""))
    ), [cuidadores, buscaCuidador]);

  const idososFiltrados = useMemo(() =>
    idosos.filter((i) =>
      String(i.nome || "").toLowerCase().includes(buscaIdoso.toLowerCase()) ||
      String(i.cpf || "").includes(buscaIdoso.replace(/\D/g, ""))
    ), [idosos, buscaIdoso]);

  async function handleVincular() {
    if (!cuidadorSelecionado || !idosoSelecionado) {
      setErro("Selecione um cuidador e um idoso para criar o vínculo.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      await criarVinculo({ cuidadorId: cuidadorSelecionado.id, idosoId: idosoSelecionado.id });
      mostrarToast("sucesso", "Vínculo criado", `${cuidadorSelecionado.nome} foi vinculado(a) a ${idosoSelecionado.nome}.`);
      onVinculoCriado?.();
      onFechar();
    } catch (e) {
      setErro(e.message || "Erro ao criar vínculo.");
    } finally {
      setSalvando(false);
    }
  }

  const podeSalvar = cuidadorSelecionado && idosoSelecionado;

  return (
    <>
      <BcToast {...toastProps} />
      <BcModal aberto={aberto} onFechar={onFechar}>
        <section className="vincular-modal">
          <div className="vincular-modal-header">
            <span className="vincular-modal-icone"><IconeVinculo /></span>
            <div>
              <h2>Vincular Cuidador a Idoso</h2>
              <p>Selecione um cuidador e um idoso para criar o vínculo.</p>
            </div>
          </div>

          {erro && (
            <div className="vincular-erro" role="alert">{erro}</div>
          )}

          {podeSalvar && (
            <div className="vincular-preview">
              <span className="vincular-preview-avatar vincular-preview-avatar--cuidador">
                {inicial(cuidadorSelecionado.nome)}
              </span>
              <span className="vincular-preview-nome">{cuidadorSelecionado.nome}</span>
              <span className="vincular-preview-seta"><IconeVinculo /></span>
              <span className="vincular-preview-avatar vincular-preview-avatar--idoso">
                {inicial(idosoSelecionado.nome)}
              </span>
              <span className="vincular-preview-nome">{idosoSelecionado.nome}</span>
            </div>
          )}

          <div className="vincular-paineis">
            <PainelSelecao
              titulo="Cuidador"
              icone={<IconeCuidadores />}
              tipo="cuidador"
              itens={cuidadoresFiltrados}
              carregando={carregandoCuidadores}
              busca={buscaCuidador}
              onBuscaChange={setBuscaCuidador}
              selecionado={cuidadorSelecionado}
              onSelecionar={(c) => {
                setCuidadorSelecionado((prev) => prev?.id === c.id ? null : c);
                setErro("");
              }}
              placeholderBusca="Buscar cuidador..."
            />

            <div className="vincular-divisor">
              <span><IconeVinculo /></span>
            </div>

            <PainelSelecao
              titulo="Idoso"
              icone={<IconeIdosos />}
              tipo="idoso"
              itens={idososFiltrados}
              carregando={carregandoIdosos}
              busca={buscaIdoso}
              onBuscaChange={setBuscaIdoso}
              selecionado={idosoSelecionado}
              onSelecionar={(i) => {
                setIdosoSelecionado((prev) => prev?.id === i.id ? null : i);
                setErro("");
              }}
              placeholderBusca="Buscar idoso..."
            />
          </div>

          <div className="vincular-modal-footer">
            <button type="button" className="vincular-btn-cancelar" onClick={onFechar}>
              Cancelar
            </button>
            <BcButton
              onClick={handleVincular}
              loading={salvando}
              disabled={!podeSalvar}
              fullWidth={false}
            >
              <IconeVinculo />
              Criar Vínculo
            </BcButton>
          </div>
        </section>
      </BcModal>
    </>
  );
}

/* ─── Componente exportado: listagem + botão + modal ─────────────── */
export default function VincularCuidadorIdoso() {
  const { toastProps, mostrarToast } = useBcToast();
  const [modalAberto, setModalAberto] = useState(false);
  const [vinculos, setVinculos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [removendo, setRemovendo] = useState(false);
  const [busca, setBusca] = useState("");

  const carregarVinculos = useCallback(async () => {
    try {
      setCarregando(true);
      const lista = await listarVinculos();
      setVinculos(Array.isArray(lista) ? lista : []);
    } catch {
      mostrarToast("erro", "Erro ao carregar vínculos", "Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, [mostrarToast]);

  useEffect(() => {
    carregarVinculos();
  }, [carregarVinculos]);

  async function handleRemover(vinculo) {
    try {
      setRemovendo(true);
      await deletarVinculo(vinculo.id);
      await carregarVinculos();
      mostrarToast("sucesso", "Vínculo removido", `Vínculo entre ${vinculo.cuidadorNome} e ${vinculo.idosoNome} foi removido.`);
    } catch (e) {
      mostrarToast("erro", "Erro ao remover vínculo", e.message);
    } finally {
      setRemovendo(false);
    }
  }

  const vinculosFiltrados = useMemo(() =>
    vinculos.filter((v) =>
      String(v.cuidadorNome || "").toLowerCase().includes(busca.toLowerCase()) ||
      String(v.idosoNome || "").toLowerCase().includes(busca.toLowerCase())
    ), [vinculos, busca]);

  return (
    <>
      <BcToast {...toastProps} />

      {/* Toolbar */}
      <div className="bc-listagem-toolbar">
        <div className="bc-listagem-buscaWrap">
          <span className="bc-listagem-buscaIcone"><IconeBusca /></span>
          <input
            className="bc-listagem-busca"
            type="text"
            placeholder="Buscar por cuidador ou idoso..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <BcButton onClick={() => setModalAberto(true)} fullWidth={false}>
          <IconeMais /> Novo Vínculo
        </BcButton>
      </div>

      {/* Card de listagem */}
      <div className="bc-listagem-card">
        <div className="bc-listagem-header">
          <span className="bc-listagem-titulo">
            <IconeVinculo />
            Vínculos Cadastrados
            <span className="bc-listagem-badge">{vinculos.length}</span>
          </span>
        </div>

        {carregando ? (
          <div className="bc-listagem-vazio">
            <div className="bc-listagem-vazioIcone"><IconeVinculo /></div>
            <p>Carregando vínculos...</p>
          </div>
        ) : vinculosFiltrados.length === 0 ? (
          <div className="bc-listagem-vazio">
            <div className="bc-listagem-vazioIcone"><IconeVinculo /></div>
            <p>{busca ? "Nenhum vínculo encontrado." : "Nenhum vínculo cadastrado ainda."}</p>
          </div>
        ) : (
          <div className="vincular-lista">
            {vinculosFiltrados.map((v) => (
              <VinculoItem
                key={v.id}
                vinculo={v}
                onRemover={handleRemover}
                removendo={removendo}
              />
            ))}
          </div>
        )}
      </div>

      <ModalVincular
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onVinculoCriado={carregarVinculos}
      />
    </>
  );
}