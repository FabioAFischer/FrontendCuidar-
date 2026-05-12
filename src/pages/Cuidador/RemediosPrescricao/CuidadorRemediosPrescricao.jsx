import { useEffect, useState } from "react";
import BcButton from "../../../components/Bcbutton/BcButton";
import BcFormModal, { BcFormModalTextarea } from "../../../components/BcFormModal/BcFormModal";
import BcInput from "../../../components/Bcinput/BcInput";
import BcModal from "../../../components/BcModal/BcModal";
import BcRemediosListagem from "../../../components/BcRemediosListagem/BcRemediosListagem";
import BcTopbar from "../../../components/BcTopbar/BcTopbar";
import { IconeSair, IconeVoltar } from "../../../components/icons/Icons";
import { listarIdososDoCuidador } from "../../../api/instituicaoApi";
import { atualizarRemedio as atualizarRemedioApi, cadastrarRemedio, inativarRemedio, listarRemedios } from "../../../api/remedioApi";
import "./CuidadorRemediosPrescricao.css";

const prescricoes = [
];

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

export default function CuidadorRemediosPrescricao({ onBack, onLogout }) {
  const [remedios, setRemedios] = useState([]);
  const [idosos, setIdosos] = useState([]);
  const [idosoSelecionadoId, setIdosoSelecionadoId] = useState(null);
  const [carregandoIdosos, setCarregandoIdosos] = useState(true);
  const [erroIdosos, setErroIdosos] = useState("");
  const [carregandoRemedios, setCarregandoRemedios] = useState(true);
  const [erroRemedios, setErroRemedios] = useState("");
  const [salvandoRemedio, setSalvandoRemedio] = useState(false);
  const [inativandoRemedio, setInativandoRemedio] = useState(false);
  const [modalRemedioAberto, setModalRemedioAberto] = useState(false);
  const [modalPrescricaoAberto, setModalPrescricaoAberto] = useState(false);
  const [remedioEmEdicao, setRemedioEmEdicao] = useState(null);
  const [remedioEmVisualizacao, setRemedioEmVisualizacao] = useState(null);
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

  useEffect(() => {
    carregarRemedios();
    carregarIdosos();
  }, []);

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

  function abrirCadastroPrescricao() {
    setErroPrescricao("");
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
    setErroPrescricao("");
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

  function handleSalvarPrescricao(evento) {
    evento.preventDefault();

    if (!idosoSelecionado) {
      setErroPrescricao("Selecione um idoso para criar a prescricao.");
      return;
    }

    if (!formPrescricao.remedioId) {
      setErroPrescricao("Selecione um remedio.");
      return;
    }

    setErroPrescricao("A integracao de salvar prescricao ainda sera conectada ao backend.");
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

      if (remedioEmEdicao) {
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
    } catch (erro) {
      setErroCadastroRemedio(erro.message);
    } finally {
      setSalvandoRemedio(false);
    }
  }

  async function handleInativarRemedio(remedio) {
    try {
      setInativandoRemedio(true);
      setErroRemedios("");
      await inativarRemedio(remedio.id);
      setRemedios((anteriores) => anteriores.filter((item) => Number(item.id) !== Number(remedio.id)));
    } catch (erro) {
      setErroRemedios(erro.message);
    } finally {
      setInativandoRemedio(false);
    }
  }

  return (
    <div className="cuidador-remedios-page">
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
              onInativar={handleInativarRemedio}
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

              <div className="cuidador-remedios-lista">
                {prescricoes.length > 0 ? (
                  prescricoes.map((prescricao) => (
                    <article className="cuidador-remedios-prescricao" key={prescricao.remedio}>
                      <div>
                        <h3>{prescricao.remedio}</h3>
                        <dl>
                          <div>
                            <dt>Dosagem</dt>
                            <dd>{prescricao.dosagem}</dd>
                          </div>
                          <div>
                            <dt>Intervalo</dt>
                            <dd>{prescricao.intervalo}</dd>
                          </div>
                          <div>
                            <dt>Fim</dt>
                            <dd>{prescricao.fim}</dd>
                          </div>
                        </dl>
                        <span>{prescricao.etiqueta}</span>
                        <p>{prescricao.instrucao}</p>
                      </div>
                      <div className="cuidador-remedios-item__acoes">
                        <BotaoIcone label="Editar prescricao"><IconeEditar /></BotaoIcone>
                        <BotaoIcone tipo="perigo" label="Remover prescricao"><IconeLixeira /></BotaoIcone>
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

      <BcModal aberto={modalPrescricaoAberto} onFechar={fecharCadastroPrescricao}>
        <BcFormModal
          title="Nova Prescricao"
          subtitle="Preencha os dados para criar uma prescricao para o idoso selecionado"
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
            <select
              id="prescricao-remedio"
              name="remedioId"
              className="cuidador-remedios-select"
              value={formPrescricao.remedioId}
              onChange={atualizarPrescricao}
            >
              <option value="">Selecione um remedio</option>
              {remedios.map((remedio) => (
                <option key={remedio.id} value={remedio.id}>{remedio.nome}</option>
              ))}
            </select>
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
            type="datetime-local"
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

          <BcButton type="submit">
            Criar prescricao
          </BcButton>
        </BcFormModal>
      </BcModal>
    </div>
  );
}
