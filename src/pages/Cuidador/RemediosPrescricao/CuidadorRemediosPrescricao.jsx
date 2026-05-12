import { useEffect, useMemo, useState } from "react";
import BcButton from "../../../components/Bcbutton/BcButton";
import BcConfirmacao from "../../../components/BcConfirmacao/BcConfirmacao";
import BcFormModal, { BcFormModalTextarea } from "../../../components/BcFormModal/BcFormModal";
import BcInput from "../../../components/Bcinput/BcInput";
import BcModal from "../../../components/BcModal/BcModal";
import BcRemediosListagem from "../../../components/BcRemediosListagem/BcRemediosListagem";
import BcToast, { useBcToast } from "../../../components/BcToast/BcToast";
import BcTopbar from "../../../components/BcTopbar/BcTopbar";
import { IconeSair, IconeVoltar } from "../../../components/icons/Icons";
import { listarIdososDoCuidador } from "../../../api/instituicaoApi";
import { atualizarPrescricao as atualizarPrescricaoApi, cadastrarPrescricao, inativarPrescricao, listarPrescricoesPorIdoso } from "../../../api/prescricaoApi";
import { atualizarRemedio as atualizarRemedioApi, cadastrarRemedio, inativarRemedio, listarRemedios } from "../../../api/remedioApi";
import "./CuidadorRemediosPrescricao.css";

const agenda = [
];

function IconeRemedio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.24 4.24 0 0 0-6-6l-10 10a4.24 4.24 0 0 0 6 6Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}

function IconeUsuarios() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconeCalendario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
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

function IconeEditar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function IconeVisualizar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconeLixeira() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function IconeCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function BotaoIcone({ children, tipo = "padrao", label, onClick }) {
  return (
    <button
      className={`cuidador-remedios-acao cuidador-remedios-acao--${tipo}`}
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TituloSecao({ icone, children }) {
  return (
    <h2 className="cuidador-remedios-titulo">
      <span>{icone}</span>
      {children}
    </h2>
  );
}

function formatarCpf(valor = "") {
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

  if (!telefone) return "Telefone nao informado";

  const numero = String(telefone).replace(/\D/g, "");
  const telefoneFormatado = numero.length > 8
    ? numero.replace(/(\d{5})(\d{4})$/, "$1-$2")
    : numero.replace(/(\d{4})(\d{4})$/, "$1-$2");

  return ddd ? `(${ddd}) ${telefoneFormatado}` : telefoneFormatado;
}

function formatarData(valor) {
  if (!valor) return "Sem data";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Sem data";

  return data.toLocaleDateString("pt-BR");
}

function valorInputData(valor) {
  if (!valor) return "";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";

  const offsetMs = data.getTimezoneOffset() * 60000;
  return new Date(data.getTime() - offsetMs).toISOString().slice(0, 10);
}

function fimDoDia(valor) {
  if (!valor) return null;
  return `${valor}T23:59:59`;
}

export default function CuidadorRemediosPrescricao({ onBack, onLogout }) {
  const { toastProps, mostrarToast } = useBcToast();
  const [remedios, setRemedios] = useState([]);
  const [idosos, setIdosos] = useState([]);
  const [prescricoes, setPrescricoes] = useState([]);
  const [idosoSelecionadoId, setIdosoSelecionadoId] = useState(null);
  const [carregandoIdosos, setCarregandoIdosos] = useState(true);
  const [erroIdosos, setErroIdosos] = useState("");
  const [carregandoRemedios, setCarregandoRemedios] = useState(true);
  const [erroRemedios, setErroRemedios] = useState("");
  const [carregandoPrescricoes, setCarregandoPrescricoes] = useState(false);
  const [erroListagemPrescricao, setErroListagemPrescricao] = useState("");
  const [salvandoRemedio, setSalvandoRemedio] = useState(false);
  const [salvandoPrescricao, setSalvandoPrescricao] = useState(false);
  const [inativandoRemedio, setInativandoRemedio] = useState(false);
  const [inativandoPrescricao, setInativandoPrescricao] = useState(false);
  const [modalRemedioAberto, setModalRemedioAberto] = useState(false);
  const [modalPrescricaoAberto, setModalPrescricaoAberto] = useState(false);
  const [buscaRemedioPrescricao, setBuscaRemedioPrescricao] = useState("");
  const [sugestoesRemedioAbertas, setSugestoesRemedioAbertas] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);
  const [remedioEmEdicao, setRemedioEmEdicao] = useState(null);
  const [prescricaoEmEdicao, setPrescricaoEmEdicao] = useState(null);
  const [remedioEmVisualizacao, setRemedioEmVisualizacao] = useState(null);
  const [prescricaoEmVisualizacao, setPrescricaoEmVisualizacao] = useState(null);
  const [erroCadastroRemedio, setErroCadastroRemedio] = useState("");
  const [erroPrescricao, setErroPrescricao] = useState("");
  const [formRemedio, setFormRemedio] = useState({
    nome: "",
    observacao: "",
  });
  const [formPrescricao, setFormPrescricao] = useState({
    remedioId: "",
    dosagem: "",
    intervalo: "",
    dataFim: "",
    necessarioJejum: "false",
    instrucao: "",
  });

  const idosoSelecionado = idosos.find((idoso) => Number(idoso.id) === Number(idosoSelecionadoId));
  const remediosFiltradosPrescricao = useMemo(() => {
    const termo = buscaRemedioPrescricao.trim().toLowerCase();

    if (!termo) {
      return remedios;
    }

    return remedios.filter((remedio) =>
      String(remedio.nome || "").toLowerCase().startsWith(termo)
    );
  }, [buscaRemedioPrescricao, remedios]);

  useEffect(() => {
    carregarRemedios();
    carregarIdosos();
  }, []);

  useEffect(() => {
    async function carregarPrescricoesDoIdoso() {
      if (!idosoSelecionadoId) {
        setPrescricoes([]);
        return;
      }

      try {
        setCarregandoPrescricoes(true);
        setErroListagemPrescricao("");
        const lista = await listarPrescricoesPorIdoso(idosoSelecionadoId);
        setPrescricoes(Array.isArray(lista) ? lista : []);
      } catch (erro) {
        setErroListagemPrescricao(erro.message);
        setPrescricoes([]);
      } finally {
        setCarregandoPrescricoes(false);
      }
    }

    carregarPrescricoesDoIdoso();
  }, [idosoSelecionadoId]);

  async function carregarIdosos() {
    try {
      setCarregandoIdosos(true);
      setErroIdosos("");
      const lista = await listarIdososDoCuidador();
      const idososVinculados = Array.isArray(lista) ? lista : [];

      setIdosos(idososVinculados);
      setIdosoSelecionadoId(idososVinculados[0]?.id || null);
    } catch (erro) {
      setErroIdosos(erro.message);
      setIdosos([]);
      setIdosoSelecionadoId(null);
    } finally {
      setCarregandoIdosos(false);
    }
  }

  async function carregarRemedios() {
    try {
      setCarregandoRemedios(true);
      setErroRemedios("");
      const lista = await listarRemedios();
      setRemedios(Array.isArray(lista) ? lista : []);
    } catch (erro) {
      setErroRemedios(erro.message);
      setRemedios([]);
    } finally {
      setCarregandoRemedios(false);
    }
  }

  function abrirCadastroRemedio() {
    setErroCadastroRemedio("");
    setRemedioEmEdicao(null);
    setFormRemedio({
      nome: "",
      observacao: "",
    });
    setModalRemedioAberto(true);
  }

  function fecharCadastroRemedio() {
    setModalRemedioAberto(false);
    setRemedioEmEdicao(null);
    setErroCadastroRemedio("");
    setFormRemedio({
      nome: "",
      observacao: "",
    });
  }

  function atualizarRemedio(evento) {
    const { name, value } = evento.target;
    setFormRemedio((anterior) => ({ ...anterior, [name]: value }));
  }

  function abrirEdicaoRemedio(remedio) {
    setErroCadastroRemedio("");
    setRemedioEmEdicao(remedio);
    setFormRemedio({
      nome: remedio.nome || "",
      observacao: remedio.observacao || "",
    });
    setModalRemedioAberto(true);
  }

  function abrirVisualizacaoRemedio(remedio) {
    setRemedioEmVisualizacao(remedio);
  }

  function fecharVisualizacaoRemedio() {
    setRemedioEmVisualizacao(null);
  }

  function abrirVisualizacaoPrescricao(prescricao) {
    setPrescricaoEmVisualizacao(prescricao);
  }

  function fecharVisualizacaoPrescricao() {
    setPrescricaoEmVisualizacao(null);
  }

  function abrirCadastroPrescricao() {
    setErroPrescricao("");
    setPrescricaoEmEdicao(null);
    setBuscaRemedioPrescricao("");
    setSugestoesRemedioAbertas(false);
    setFormPrescricao({
      remedioId: "",
      dosagem: "",
      intervalo: "",
      dataFim: "",
      necessarioJejum: "false",
      instrucao: "",
    });
    setModalPrescricaoAberto(true);
  }

  function fecharCadastroPrescricao() {
    setModalPrescricaoAberto(false);
    setPrescricaoEmEdicao(null);
    setErroPrescricao("");
    setBuscaRemedioPrescricao("");
    setSugestoesRemedioAbertas(false);
    setFormPrescricao({
      remedioId: "",
      dosagem: "",
      intervalo: "",
      dataFim: "",
      necessarioJejum: "false",
      instrucao: "",
    });
  }

  function atualizarPrescricao(evento) {
    const { name, value } = evento.target;
    setFormPrescricao((anterior) => ({ ...anterior, [name]: value }));
  }

  function abrirEdicaoPrescricao(prescricao) {
    setErroPrescricao("");
    setPrescricaoEmEdicao(prescricao);
    setBuscaRemedioPrescricao(prescricao.remedioNome || "");
    setSugestoesRemedioAbertas(false);
    setFormPrescricao({
      remedioId: prescricao.remedioId ? String(prescricao.remedioId) : "",
      dosagem: prescricao.dosagem || "",
      intervalo: prescricao.intervalo ? String(prescricao.intervalo) : "",
      dataFim: valorInputData(prescricao.dataFim),
      necessarioJejum: prescricao.necessarioJejum ? "true" : "false",
      instrucao: prescricao.instrucao || "",
    });
    setModalPrescricaoAberto(true);
  }

  function atualizarBuscaRemedioPrescricao(evento) {
    const valor = evento.target.value;

    setBuscaRemedioPrescricao(valor);
    setSugestoesRemedioAbertas(true);
    setFormPrescricao((anterior) => ({ ...anterior, remedioId: "" }));
  }

  function selecionarRemedioPrescricao(remedio) {
    setBuscaRemedioPrescricao(remedio.nome || "");
    setSugestoesRemedioAbertas(false);
    setFormPrescricao((anterior) => ({ ...anterior, remedioId: String(remedio.id) }));
  }

  async function handleSalvarPrescricao(evento) {
    evento.preventDefault();

    if (!idosoSelecionado) {
      setErroPrescricao("Selecione um idoso para criar a prescricao.");
      return;
    }

    if (!formPrescricao.remedioId) {
      setErroPrescricao("Selecione um remedio.");
      return;
    }

    if (!formPrescricao.dosagem.trim()) {
      setErroPrescricao("Informe a dosagem.");
      return;
    }

    if (!formPrescricao.intervalo || Number(formPrescricao.intervalo) <= 0) {
      setErroPrescricao("Informe um intervalo maior que zero.");
      return;
    }

    const remedioSelecionado = remedios.find((remedio) => Number(remedio.id) === Number(formPrescricao.remedioId));
    const dados = {
      remedioId: Number(formPrescricao.remedioId),
      idosoId: Number(idosoSelecionado.id),
      remedioNome: remedioSelecionado?.nome || "",
      idosoNome: idosoSelecionado.nome || "",
      dosagem: formPrescricao.dosagem,
      intervalo: Number(formPrescricao.intervalo),
      dataFim: fimDoDia(formPrescricao.dataFim),
      necessarioJejum: formPrescricao.necessarioJejum === "true",
      instrucao: formPrescricao.instrucao,
    };

    try {
      setSalvandoPrescricao(true);
      setErroPrescricao("");
      const editandoPrescricao = Boolean(prescricaoEmEdicao);

      if (editandoPrescricao) {
        const prescricaoAtualizada = await atualizarPrescricaoApi(prescricaoEmEdicao.id, dados);
        setPrescricoes((anteriores) =>
          anteriores.map((prescricao) =>
            Number(prescricao.id) === Number(prescricaoEmEdicao.id) ? prescricaoAtualizada : prescricao
          )
        );
      } else {
        const prescricaoCriada = await cadastrarPrescricao(dados);
        setPrescricoes((anteriores) => [prescricaoCriada, ...anteriores]);
      }

      fecharCadastroPrescricao();
      mostrarToast(
        "sucesso",
        editandoPrescricao ? "Prescricao atualizada" : "Prescricao cadastrada",
        editandoPrescricao
          ? "As alteracoes da prescricao foram salvas."
          : "A prescricao foi criada para o idoso selecionado."
      );
    } catch (erro) {
      setErroPrescricao(erro.message);
      mostrarToast("erro", "Erro ao salvar prescricao", erro.message);
    } finally {
      setSalvandoPrescricao(false);
    }
  }

  async function handleSalvarRemedio(evento) {
    evento.preventDefault();

    if (!formRemedio.nome.trim()) {
      setErroCadastroRemedio("Informe o nome do remedio.");
      return;
    }

    try {
      setSalvandoRemedio(true);
      setErroCadastroRemedio("");
      const editandoRemedio = Boolean(remedioEmEdicao);

      if (editandoRemedio) {
        const remedioAtualizado = await atualizarRemedioApi(remedioEmEdicao.id, formRemedio);

        if (remedioAtualizado) {
          setRemedios((anteriores) =>
            anteriores.map((remedio) =>
              Number(remedio.id) === Number(remedioEmEdicao.id) ? remedioAtualizado : remedio
            )
          );
        } else {
          await carregarRemedios();
        }
      } else {
        const remedioCadastrado = await cadastrarRemedio(formRemedio);

        if (remedioCadastrado) {
          setRemedios((anteriores) => [remedioCadastrado, ...anteriores]);
        } else {
          await carregarRemedios();
        }
      }

      fecharCadastroRemedio();
      mostrarToast(
        "sucesso",
        editandoRemedio ? "Remedio atualizado" : "Remedio cadastrado",
        editandoRemedio
          ? "As alteracoes do remedio foram salvas."
          : "O remedio foi adicionado a listagem."
      );
    } catch (erro) {
      setErroCadastroRemedio(erro.message);
      mostrarToast("erro", "Erro ao salvar remedio", erro.message);
    } finally {
      setSalvandoRemedio(false);
    }
  }

  async function confirmarInativacaoRemedio(remedio) {
    try {
      setInativandoRemedio(true);
      setErroRemedios("");
      await inativarRemedio(remedio.id);
      setRemedios((anteriores) => anteriores.filter((item) => Number(item.id) !== Number(remedio.id)));
      setPrescricoes((anteriores) => anteriores.filter((item) => Number(item.remedioId) !== Number(remedio.id)));
      mostrarToast("sucesso", "Remedio inativado", "As prescricoes vinculadas tambem foram removidas da listagem.");
    } catch (erro) {
      setErroRemedios(erro.message);
      mostrarToast("erro", "Erro ao inativar remedio", erro.message);
    } finally {
      setInativandoRemedio(false);
    }
  }

  function solicitarInativacaoPrescricao(prescricao) {
    setConfirmacao({
      tipo: "prescricao",
      item: prescricao,
      titulo: "Remover prescricao?",
      mensagem: "A prescricao sera removida da listagem deste idoso.",
      textoConfirmar: "Remover",
      textoCarregando: "Removendo...",
    });
  }

  async function confirmarInativacaoPrescricao(prescricao) {
    try {
      setInativandoPrescricao(true);
      setErroListagemPrescricao("");
      await inativarPrescricao(prescricao.id);
      setPrescricoes((anteriores) => anteriores.filter((item) => Number(item.id) !== Number(prescricao.id)));
      setConfirmacao(null);
      mostrarToast("sucesso", "Prescricao removida", "A prescricao foi removida da listagem deste idoso.");
    } catch (erro) {
      setErroListagemPrescricao(erro.message);
      mostrarToast("erro", "Erro ao remover prescricao", erro.message);
    } finally {
      setInativandoPrescricao(false);
    }
  }

  function confirmarAcaoPendente() {
    if (!confirmacao) return;
    confirmarInativacaoPrescricao(confirmacao.item);
  }

  return (
    <div className="cuidador-remedios-page">
      <BcToast {...toastProps} />

      <BcTopbar
        title="Gerenciamento de Prescricoes"
        subtitle="Remedios, prescricoes e agenda"
        actionLabel="Sair"
        actionIcon={<IconeSair />}
        onAction={onLogout}
      />

      <main className="cuidador-remedios-main">
        <button className="cuidador-remedios-voltar" type="button" onClick={onBack}>
          <IconeVoltar />
          Voltar ao painel
        </button>

        <section className="cuidador-remedios-grid" aria-label="Remedios e prescricoes">
          <aside className="cuidador-remedios-listagem">
            <BcRemediosListagem
              remedios={remedios}
              carregando={carregandoRemedios}
              erro={erroRemedios}
              inativando={inativandoRemedio}
              onCadastrar={abrirCadastroRemedio}
              onVisualizar={abrirVisualizacaoRemedio}
              onEditar={abrirEdicaoRemedio}
              onInativar={confirmarInativacaoRemedio}
            />
          </aside>

          <section className="cuidador-remedios-centro">
            <div className="cuidador-remedios-card">
              <div className="cuidador-remedios-card__header">
                <TituloSecao icone={<IconeUsuarios />}>Selecione um Idoso</TituloSecao>
              </div>

              {carregandoIdosos ? (
                <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                  <p>Carregando idosos vinculados...</p>
                </div>
              ) : erroIdosos ? (
                <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                  <p>{erroIdosos}</p>
                  <small>Nao foi possivel carregar os idosos vinculados ao cuidador.</small>
                </div>
              ) : idosos.length > 0 ? (
                <div className="cuidador-remedios-idosos">
                  {idosos.map((idoso) => (
                    <button
                      className={`cuidador-remedios-idoso ${Number(idosoSelecionadoId) === Number(idoso.id) ? "cuidador-remedios-idoso--selecionado" : ""}`}
                      type="button"
                      key={idoso.id || idoso.cpf}
                      onClick={() => setIdosoSelecionadoId(idoso.id)}
                    >
                      <strong>{idoso.nome}</strong>
                      <span>CPF: {formatarCpf(idoso.cpf) || "Nao informado"}</span>
                      <span>{formatarTelefone(idoso)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                  <p>Nenhum idoso vinculado.</p>
                  <small>Quando houver idosos disponiveis, eles aparecerao aqui para selecao.</small>
                </div>
              )}
            </div>

            <div className="cuidador-remedios-card">
              <div className="cuidador-remedios-card__header">
                <TituloSecao icone={<IconeRemedio />}>Prescricoes</TituloSecao>
                <button className="cuidador-remedios-prescrever" type="button" onClick={abrirCadastroPrescricao}>
                  <IconeMais />
                  Prescrever
                </button>
              </div>

              <div className="cuidador-remedios-lista cuidador-remedios-prescricoes-lista">
                {carregandoPrescricoes ? (
                  <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                    <p>Carregando prescricoes...</p>
                  </div>
                ) : erroListagemPrescricao ? (
                  <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                    <p>{erroListagemPrescricao}</p>
                    <small>Nao foi possivel carregar as prescricoes deste idoso.</small>
                  </div>
                ) : prescricoes.length > 0 ? (
                  prescricoes.map((prescricao) => (
                    <article className="cuidador-remedios-prescricao" key={prescricao.id}>
                      <div>
                        <div className="cuidador-remedios-prescricao__topo">
                          <h3>{prescricao.remedioNome || "Remedio nao identificado"}</h3>
                          <span>{prescricao.necessarioJejum ? "Necessario jejum" : "Sem jejum"}</span>
                        </div>
                        <dl>
                          <div>
                            <dt>Dosagem</dt>
                            <dd>{prescricao.dosagem}</dd>
                          </div>
                          <div>
                            <dt>Intervalo</dt>
                            <dd>{prescricao.intervalo}h</dd>
                          </div>
                          <div>
                            <dt>Fim</dt>
                            <dd>{formatarData(prescricao.dataFim)}</dd>
                          </div>
                        </dl>
                      </div>
                      <div className="cuidador-remedios-item__acoes">
                        <BotaoIcone label="Visualizar prescricao" onClick={() => abrirVisualizacaoPrescricao(prescricao)}><IconeVisualizar /></BotaoIcone>
                        <BotaoIcone label="Editar prescricao" onClick={() => abrirEdicaoPrescricao(prescricao)}><IconeEditar /></BotaoIcone>
                        <BotaoIcone tipo="perigo" label="Remover prescricao" onClick={() => solicitarInativacaoPrescricao(prescricao)}><IconeLixeira /></BotaoIcone>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                    <p>Nenhuma prescricao registrada.</p>
                    <small>Cadastre um remedio e selecione um idoso para iniciar uma prescricao.</small>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="cuidador-remedios-card cuidador-remedios-card--fixo">
            <div className="cuidador-remedios-card__header">
              <TituloSecao icone={<IconeCalendario />}>Agenda</TituloSecao>
              <BotaoIcone label="Adicionar evento"><IconeMais /></BotaoIcone>
            </div>

            <div className="cuidador-remedios-lista">
              {agenda.length > 0 ? (
                agenda.map((evento) => (
                  <article className={`cuidador-remedios-agenda ${evento.status === "REALIZADO" ? "cuidador-remedios-agenda--realizado" : ""}`} key={`${evento.horario}-${evento.descricao}`}>
                    <div>
                      <div className="cuidador-remedios-agenda__badges">
                        <span>{evento.tipo}</span>
                        <span>{evento.status}</span>
                      </div>
                      <time>{evento.horario}</time>
                      <p>{evento.descricao}</p>
                    </div>
                    <div className="cuidador-remedios-item__acoes">
                      {evento.status === "AGENDADO" ? (
                        <BotaoIcone tipo="sucesso" label="Marcar como realizado"><IconeCheck /></BotaoIcone>
                      ) : null}
                      <BotaoIcone label="Editar evento"><IconeEditar /></BotaoIcone>
                      <BotaoIcone tipo="perigo" label="Excluir evento"><IconeLixeira /></BotaoIcone>
                    </div>
                  </article>
                ))
              ) : (
                <div className="cuidador-remedios-vazio cuidador-remedios-vazio--alto">
                  <p>Nenhum evento agendado.</p>
                  <small>Os lembretes de medicacao aparecerao aqui depois das prescricoes.</small>
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>

      <BcModal aberto={modalRemedioAberto} onFechar={fecharCadastroRemedio}>
        <BcFormModal
          title={remedioEmEdicao ? "Editar Remedio" : "Novo Remedio"}
          subtitle={remedioEmEdicao ? "Atualize os dados abaixo" : "Preencha os dados para cadastrar"}
          error={erroCadastroRemedio}
          onSubmit={handleSalvarRemedio}
        >
          <BcInput
            label="Nome *"
            name="nome"
            placeholder="Insira o nome do remedio"
            value={formRemedio.nome}
            onChange={atualizarRemedio}
          />

          <BcFormModalTextarea
            id="observacao"
            label="Observacao"
            name="observacao"
            placeholder="Observacoes importantes sobre o remedio..."
            value={formRemedio.observacao}
            onChange={atualizarRemedio}
          />

          <BcButton type="submit" loading={salvandoRemedio}>
            {remedioEmEdicao ? "Salvar alteracoes" : "Cadastrar"}
          </BcButton>
        </BcFormModal>
      </BcModal>

      <BcModal aberto={Boolean(remedioEmVisualizacao)} onFechar={fecharVisualizacaoRemedio}>
        <section className="cuidador-remedios-detalhes" aria-label="Dados do remedio">
          <header className="cuidador-remedios-detalhes__header">
            <span className="cuidador-remedios-detalhes__icone"><IconeRemedio /></span>
            <div>
              <h2>Dados do Remedio</h2>
              <p>Informacoes cadastradas para consulta.</p>
            </div>
          </header>

          <dl className="cuidador-remedios-detalhes__lista">
            <div>
              <dt>Nome</dt>
              <dd>{remedioEmVisualizacao?.nome || "-"}</dd>
            </div>
            <div>
              <dt>Observacao</dt>
              <dd>{remedioEmVisualizacao?.observacao || "-"}</dd>
            </div>
          </dl>

          <BcButton type="button" onClick={fecharVisualizacaoRemedio}>
            Fechar
          </BcButton>
        </section>
      </BcModal>

      <BcModal aberto={Boolean(prescricaoEmVisualizacao)} onFechar={fecharVisualizacaoPrescricao}>
        <section className="cuidador-remedios-detalhes" aria-label="Dados da prescricao">
          <header className="cuidador-remedios-detalhes__header">
            <span className="cuidador-remedios-detalhes__icone"><IconeRemedio /></span>
            <div>
              <h2>Dados da Prescricao</h2>
              <p>Informacoes cadastradas para consulta.</p>
            </div>
          </header>

          <dl className="cuidador-remedios-detalhes__lista">
            <div>
              <dt>Idoso</dt>
              <dd>{prescricaoEmVisualizacao?.idosoNome || idosoSelecionado?.nome || "-"}</dd>
            </div>
            <div>
              <dt>Remedio</dt>
              <dd>{prescricaoEmVisualizacao?.remedioNome || "-"}</dd>
            </div>
            <div>
              <dt>Dosagem</dt>
              <dd>{prescricaoEmVisualizacao?.dosagem || "-"}</dd>
            </div>
            <div>
              <dt>Intervalo</dt>
              <dd>{prescricaoEmVisualizacao?.intervalo ? `${prescricaoEmVisualizacao.intervalo}h` : "-"}</dd>
            </div>
            <div>
              <dt>Fim</dt>
              <dd>{formatarData(prescricaoEmVisualizacao?.dataFim)}</dd>
            </div>
            <div>
              <dt>Jejum</dt>
              <dd>{prescricaoEmVisualizacao?.necessarioJejum ? "Necessario" : "Nao necessario"}</dd>
            </div>
            <div>
              <dt>Instrucao</dt>
              <dd>{prescricaoEmVisualizacao?.instrucao || "-"}</dd>
            </div>
          </dl>

          <BcButton type="button" onClick={fecharVisualizacaoPrescricao}>
            Fechar
          </BcButton>
        </section>
      </BcModal>

      <BcModal aberto={modalPrescricaoAberto} onFechar={fecharCadastroPrescricao}>
        <BcFormModal
          title={prescricaoEmEdicao ? "Editar Prescricao" : "Nova Prescricao"}
          subtitle={prescricaoEmEdicao ? "Atualize os dados da prescricao" : "Preencha os dados para criar uma prescricao para o idoso selecionado"}
          error={erroPrescricao}
          onSubmit={handleSalvarPrescricao}
          className="cuidador-remedios-prescricao-modal"
        >
          <div className="cuidador-remedios-prescricao-paciente">
            <span>Idoso selecionado</span>
            <strong>{idosoSelecionado?.nome || "Nenhum idoso selecionado"}</strong>
            {idosoSelecionado ? <small>CPF: {formatarCpf(idosoSelecionado.cpf) || "Nao informado"}</small> : null}
          </div>

          <div className="cuidador-remedios-campo">
            <label htmlFor="prescricao-remedio" className="bc-form-modal__label">Remedio *</label>
            <div className="cuidador-remedios-combobox">
              <input
                id="prescricao-remedio"
                className="cuidador-remedios-select cuidador-remedios-combobox__input"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={sugestoesRemedioAbertas}
                aria-controls="prescricao-remedio-opcoes"
                placeholder="Digite o nome do remedio"
                value={buscaRemedioPrescricao}
                onChange={atualizarBuscaRemedioPrescricao}
                onFocus={() => setSugestoesRemedioAbertas(true)}
                onBlur={() => window.setTimeout(() => setSugestoesRemedioAbertas(false), 120)}
              />

              {sugestoesRemedioAbertas ? (
                <div className="cuidador-remedios-combobox__lista" id="prescricao-remedio-opcoes" role="listbox">
                  {remediosFiltradosPrescricao.length > 0 ? (
                    remediosFiltradosPrescricao.map((remedio) => (
                      <button
                        className={`cuidador-remedios-combobox__opcao ${Number(formPrescricao.remedioId) === Number(remedio.id) ? "cuidador-remedios-combobox__opcao--selecionada" : ""}`}
                        type="button"
                        role="option"
                        aria-selected={Number(formPrescricao.remedioId) === Number(remedio.id)}
                        key={remedio.id}
                        onMouseDown={(evento) => evento.preventDefault()}
                        onClick={() => selecionarRemedioPrescricao(remedio)}
                      >
                        {remedio.nome}
                      </button>
                    ))
                  ) : (
                    <span className="cuidador-remedios-combobox__vazio">Nenhum remedio encontrado.</span>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <BcInput
            label="Dosagem *"
            name="dosagem"
            placeholder="Ex: 1 comprimido"
            value={formPrescricao.dosagem}
            onChange={atualizarPrescricao}
          />

          <BcInput
            label="Intervalo em horas *"
            name="intervalo"
            type="number"
            placeholder="Ex: 8"
            value={formPrescricao.intervalo}
            onChange={atualizarPrescricao}
            inputMode="decimal"
          />

          <BcInput
            label="Data final"
            name="dataFim"
            type="date"
            value={formPrescricao.dataFim}
            onChange={atualizarPrescricao}
          />

          <div className="cuidador-remedios-campo">
            <label htmlFor="prescricao-jejum" className="bc-form-modal__label">Necessario jejum?</label>
            <select
              id="prescricao-jejum"
              name="necessarioJejum"
              className="cuidador-remedios-select"
              value={formPrescricao.necessarioJejum}
              onChange={atualizarPrescricao}
            >
              <option value="false">Nao</option>
              <option value="true">Sim</option>
            </select>
          </div>

          <BcFormModalTextarea
            id="prescricao-instrucao"
            label="Instrucao"
            name="instrucao"
            placeholder="Orientacoes importantes sobre a administracao..."
            value={formPrescricao.instrucao}
            onChange={atualizarPrescricao}
          />

          <BcButton type="submit" loading={salvandoPrescricao} disabled={inativandoPrescricao}>
            {prescricaoEmEdicao ? "Salvar alteracoes" : "Criar prescricao"}
          </BcButton>
        </BcFormModal>
      </BcModal>

      <BcConfirmacao
        aberto={Boolean(confirmacao)}
        titulo={confirmacao?.titulo}
        mensagem={confirmacao?.mensagem}
        textoConfirmar={confirmacao?.textoConfirmar}
        textoCarregando={confirmacao?.textoCarregando}
        carregando={inativandoRemedio || inativandoPrescricao}
        icone={<IconeLixeira />}
        onCancelar={() => setConfirmacao(null)}
        onConfirmar={confirmarAcaoPendente}
      />
    </div>
  );
}
