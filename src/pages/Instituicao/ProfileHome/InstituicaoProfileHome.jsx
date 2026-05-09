import { useCallback, useEffect, useState } from "react";
import BcButton from "../../../components/Bcbutton/BcButton";
import BcInput from "../../../components/Bcinput/BcInput";
import BcEmptySection from "../../../components/BcEmptySection/BcEmptySection";
import BcListagem from "../../../components/BcListagem/BcListagem";
import BcModal from "../../../components/BcModal/BcModal";
import BcTopbar from "../../../components/BcTopbar/BcTopbar";
import BcToast from "../../../components/BcToast/BcToast";
import {
  atualizarIdoso as atualizarIdosoApi,
  cadastrarCuidador,
  cadastrarIdoso,
  deletarIdoso,
  listarIdosos,
} from "../../../api/instituicaoApi";
import {
  IconeCuidadores,
  IconeCuidadoresVazio,
  IconeIdosos,
  IconeSair,
} from "../../../components/icons/Icons";
import { cpfValido } from "../../../utils/validacaoDocumento";
import "./InstituicaoProfileHome.css";

export default function InstituicaoProfileHome({ onLogout }) {
  const [modalCuidadorAberto, setModalCuidadorAberto] = useState(false);
  const [modalIdosoAberto, setModalIdosoAberto] = useState(false);
  const [idosoEmEdicao, setIdosoEmEdicao] = useState(null);
  const [idosos, setIdosos] = useState([]);
  const [buscaIdoso, setBuscaIdoso] = useState("");
  const [carregandoIdosos, setCarregandoIdosos] = useState(true);
  const [salvandoCuidador, setSalvandoCuidador] = useState(false);
  const [salvandoIdoso, setSalvandoIdoso] = useState(false);
  const [excluindoIdoso, setExcluindoIdoso] = useState(false);
  const [erroCuidador, setErroCuidador] = useState("");
  const [erroIdoso, setErroIdoso] = useState("");
  const [toast, setToast] = useState({
    aberto: false,
    tipo: "info",
    titulo: "",
    mensagem: "",
  });
  const [formCuidador, setFormCuidador] = useState({
    cpf: "",
    nome: "",
    email: "",
    senha: "",
    ddd: "",
    telefone: "",
  });
  const [formIdoso, setFormIdoso] = useState({
    nome: "",
    cpf: "",
    observacoes: "",
    ddd: "",
    telefone: "",
    contatoId: null,
  });

  const carregarIdosos = useCallback(async () => {
    try {
      setCarregandoIdosos(true);
      setErroIdoso("");
      const lista = await listarIdosos();
      setIdosos(lista);
    } catch (erro) {
      setErroIdoso(erro.message);
      mostrarToast("erro", "Erro ao carregar idosos", erro.message);
    } finally {
      setCarregandoIdosos(false);
    }
  }, []);

  function mostrarToast(tipo, titulo, mensagem) {
    setToast({
      aberto: true,
      tipo,
      titulo,
      mensagem,
    });
  }

  function fecharToast() {
    setToast((atual) => ({ ...atual, aberto: false }));
  }

  useEffect(() => {
    carregarIdosos();
  }, [carregarIdosos]);

  const idososFiltrados = idosos.filter((idoso) =>
    String(idoso.nome || "").toLowerCase().includes(buscaIdoso.toLowerCase()) ||
    String(idoso.cpf || "").includes(buscaIdoso.replace(/\D/g, ""))
  );

  function formatarCPF(valor) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);
    return numeros
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatarTelefone(valor) {
    const numeros = valor.replace(/\D/g, "").slice(0, 9);
    return numeros.replace(/(\d{5})(\d{0,4})$/, "$1-$2").replace(/-$/, "");
  }

  function atualizarCuidador(evento) {
    const { name, value } = evento.target;
    let novoValor = value;

    if (name === "cpf") novoValor = formatarCPF(value);
    if (name === "ddd") novoValor = value.replace(/\D/g, "").slice(0, 2);
    if (name === "telefone") novoValor = formatarTelefone(value);

    setFormCuidador((anterior) => ({ ...anterior, [name]: novoValor }));
  }

  function atualizarIdoso(evento) {
    const { name, value } = evento.target;
    let novoValor = value;

    if (name === "cpf") novoValor = formatarCPF(value);
    if (name === "ddd") novoValor = value.replace(/\D/g, "").slice(0, 2);
    if (name === "telefone") novoValor = formatarTelefone(value);

    setFormIdoso((anterior) => ({ ...anterior, [name]: novoValor }));
  }

  function limparFormCuidador() {
    setFormCuidador({
      cpf: "",
      nome: "",
      email: "",
      senha: "",
      ddd: "",
      telefone: "",
    });
  }

  function limparFormIdoso() {
    setFormIdoso({
      nome: "",
      cpf: "",
      observacoes: "",
      ddd: "",
      telefone: "",
      contatoId: null,
    });
  }

  function abrirCadastroIdoso() {
    setErroIdoso("");
    setIdosoEmEdicao(null);
    limparFormIdoso();
    setModalIdosoAberto(true);
  }

  function abrirEdicaoIdoso(idoso) {
    setErroIdoso("");
    setIdosoEmEdicao(idoso);
    setFormIdoso({
      nome: idoso.nome || "",
      cpf: formatarCPF(String(idoso.cpf || "")),
      observacoes: idoso.observacoes || "",
      ddd: idoso.contato?.ddd ? String(idoso.contato.ddd) : "",
      telefone: idoso.contato?.telefone ? formatarTelefone(String(idoso.contato.telefone)) : "",
      contatoId: idoso.contatoId || idoso.contato?.id || null,
    });
    setModalIdosoAberto(true);
  }

  function fecharModalIdoso() {
    setModalIdosoAberto(false);
    setIdosoEmEdicao(null);
    setErroIdoso("");
    limparFormIdoso();
  }

  function abrirCadastroCuidador() {
    setErroCuidador("");
    limparFormCuidador();
    setModalCuidadorAberto(true);
  }

  function fecharModalCuidador() {
    setErroCuidador("");
    setModalCuidadorAberto(false);
    limparFormCuidador();
  }

  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validarIdoso() {
    if (!formIdoso.nome.trim()) return "Informe o nome do idoso.";
    if (!cpfValido(formIdoso.cpf)) return "CPF invalido.";
    if (formIdoso.ddd.replace(/\D/g, "").length < 2) return "DDD invalido.";
    if (formIdoso.telefone.replace(/\D/g, "").length < 8) return "Telefone invalido.";
    return null;
  }

  function validarCuidador() {
    if (!cpfValido(formCuidador.cpf)) return "CPF invalido.";
    if (!formCuidador.nome.trim()) return "Informe o nome do cuidador.";
    if (!emailValido(formCuidador.email.trim())) return "Informe um e-mail valido.";
    if (!formCuidador.senha.trim()) return "Informe a senha do cuidador.";
    if (formCuidador.ddd.replace(/\D/g, "").length < 2) return "DDD invalido.";
    if (formCuidador.telefone.replace(/\D/g, "").length < 8) return "Telefone invalido.";
    return null;
  }

  async function handleCadastrarCuidador(evento) {
    evento.preventDefault();
    console.log("[cuidador] submit recebido", formCuidador);

    const erroValidacao = validarCuidador();

    if (erroValidacao) {
      console.log("[cuidador] validacao bloqueou cadastro", erroValidacao);
      setErroCuidador(erroValidacao);
      return;
    }

    try {
      setSalvandoCuidador(true);
      setErroCuidador("");
      const cuidadorCadastrado = await cadastrarCuidador(formCuidador);
      console.log("[cuidador] cadastro concluido", cuidadorCadastrado);
      mostrarToast("sucesso", "Cuidador cadastrado", `${formCuidador.nome} foi cadastrado com sucesso.`);
      fecharModalCuidador();
    } catch (erro) {
      console.error("[cuidador] erro ao cadastrar", erro);
      setErroCuidador(erro.message);
      mostrarToast("erro", "Erro ao cadastrar cuidador", erro.message);
    } finally {
      setSalvandoCuidador(false);
    }
  }

  async function handleCadastrarIdoso(evento) {
    evento.preventDefault();

    const erroValidacao = validarIdoso();
    if (erroValidacao) {
      setErroIdoso(erroValidacao);
      return;
    }

    try {
      setSalvandoIdoso(true);
      setErroIdoso("");

      if (idosoEmEdicao) {
        const idosoAtualizado = await atualizarIdosoApi(idosoEmEdicao.id, formIdoso);
        setIdosos((anteriores) =>
          anteriores.map((idoso) => idoso.id === idosoAtualizado?.id ? idosoAtualizado : idoso)
        );
        mostrarToast("sucesso", "Idoso atualizado", `Os dados de ${formIdoso.nome} foram salvos.`);
      } else {
        const idosoCadastrado = await cadastrarIdoso(formIdoso);
        if (idosoCadastrado) {
          setIdosos((anteriores) => [idosoCadastrado, ...anteriores]);
        }
        mostrarToast("sucesso", "Idoso cadastrado", `${formIdoso.nome} foi cadastrado com sucesso.`);
      }

      fecharModalIdoso();
      await carregarIdosos();
    } catch (erro) {
      setErroIdoso(erro.message);
      mostrarToast("erro", idosoEmEdicao ? "Erro ao atualizar idoso" : "Erro ao cadastrar idoso", erro.message);
    } finally {
      setSalvandoIdoso(false);
    }
  }

  async function handleExcluirIdoso(idoso) {
    try {
      setExcluindoIdoso(true);
      setErroIdoso("");
      await deletarIdoso(idoso.id);
      await carregarIdosos();
      mostrarToast("sucesso", "Idoso desativado", `${idoso.nome} foi removido da listagem.`);
    } catch (erro) {
      setErroIdoso(erro.message);
      mostrarToast("erro", "Erro ao desativar idoso", erro.message);
    } finally {
      setExcluindoIdoso(false);
    }
  }

  return (
    <div className="instituicao-home">
      <BcToast
        aberto={toast.aberto}
        tipo={toast.tipo}
        titulo={toast.titulo}
        mensagem={toast.mensagem}
        onFechar={fecharToast}
      />

      <BcTopbar
        title="Painel da Instituição"
        subtitle="Gestão de Cuidadores e Idosos"
        actionLabel="Sair"
        actionIcon={<IconeSair />}
        onAction={onLogout}
      />

      <main className="instituicao-home__content">
        <div className="instituicao-home__grid">
          <BcEmptySection
            title="Cuidadores"
            count={0}
            icon={<IconeCuidadores />}
            buttonLabel="Cadastrar Cuidador"
            emptyIcon={<IconeCuidadoresVazio />}
            emptyText="Nenhum cuidador cadastrado"
            onAction={abrirCadastroCuidador}
          />

          <div className="instituicao-home__listagem">
            <BcListagem
              titulo="Idosos Cadastrados"
              iconeTitulo={<IconeIdosos />}
              itens={idososFiltrados}
              colunas={[
                { chave: "nome", titulo: "Nome", className: "bc-listagem-tdNome" },
                {
                  chave: "cpf",
                  titulo: "CPF",
                  className: "bc-listagem-tdMuted",
                  render: (idoso) => formatarCPF(String(idoso.cpf || "")),
                },
                {
                  chave: "contato",
                  titulo: "Contato",
                  className: "bc-listagem-tdMuted",
                  render: (idoso) => idoso.contato
                    ? `(${idoso.contato.ddd}) ${formatarTelefone(String(idoso.contato.telefone || ""))}`
                    : "-",
                },
                {
                  chave: "observacoes",
                  titulo: "Observacoes",
                  className: "bc-listagem-tdMuted",
                  render: (idoso) => idoso.observacoes || "-",
                },
              ]}
              busca={buscaIdoso}
              placeholderBusca="Buscar por nome ou CPF..."
              onBuscaChange={setBuscaIdoso}
              textoBotao="Cadastrar Idoso"
              onBotaoClick={abrirCadastroIdoso}
              textoVazio={buscaIdoso ? "Nenhum idoso encontrado." : "Nenhum idoso cadastrado ainda."}
              carregando={carregandoIdosos}
              textoCarregando="Carregando idosos..."
              erro={modalIdosoAberto ? "" : erroIdoso}
              onEditar={abrirEdicaoIdoso}
              onExcluir={handleExcluirIdoso}
              tituloConfirmacao="Desativar idoso?"
              mensagemConfirmacao="O idoso sera removido da listagem, mas podera ser reativado ao cadastrar o mesmo CPF."
              textoConfirmar="Sim, desativar"
              textoCarregandoExcluir="Desativando..."
              excluindo={excluindoIdoso}
            />
          </div>
        </div>
      </main>

      <BcModal aberto={modalCuidadorAberto} onFechar={fecharModalCuidador}>
        <section className="instituicao-modal">
          <div className="instituicao-modal__header">
            <h2>Novo Cuidador</h2>
          </div>

          <form className="instituicao-modal__form" onSubmit={handleCadastrarCuidador}>
            {erroCuidador ? <div className="instituicao-modal__error" role="alert">{erroCuidador}</div> : null}

            <BcInput
              label="CPF *"
              name="cpf"
              placeholder="000.000.000-00"
              value={formCuidador.cpf}
              onChange={atualizarCuidador}
              maxLength={14}
            />
            <BcInput
              label="Nome *"
              name="nome"
              placeholder="Insira um nome"
              value={formCuidador.nome}
              onChange={atualizarCuidador}
            />
            <BcInput
              label="E-mail *"
              name="email"
              type="email"
              placeholder="nome@email.com"
              value={formCuidador.email}
              onChange={atualizarCuidador}
            />
            <BcInput
              label="Senha *"
              name="senha"
              type="password"
              value={formCuidador.senha}
              onChange={atualizarCuidador}
            />

            <div className="instituicao-modal__row">
              <BcInput
                label="DDD *"
                name="ddd"
                placeholder="11"
                value={formCuidador.ddd}
                onChange={atualizarCuidador}
                maxLength={2}
              />
              <BcInput
                label="Telefone *"
                name="telefone"
                placeholder="90000-0000"
                value={formCuidador.telefone}
                onChange={atualizarCuidador}
                maxLength={10}
              />
            </div>

            <BcButton type="submit" loading={salvandoCuidador}>Cadastrar</BcButton>
          </form>
        </section>
      </BcModal>

      <BcModal aberto={modalIdosoAberto} onFechar={fecharModalIdoso}>
        <section className="instituicao-modal">
          <div className="instituicao-modal__header">
            <h2>{idosoEmEdicao ? "Editar Idoso" : "Novo Idoso"}</h2>
          </div>

          <form className="instituicao-modal__form" onSubmit={handleCadastrarIdoso}>
            {erroIdoso ? <div className="instituicao-modal__error" role="alert">{erroIdoso}</div> : null}

            <BcInput
              label="Nome *"
              name="nome"
              placeholder="Insira um nome"
              value={formIdoso.nome}
              onChange={atualizarIdoso}
            />
            <BcInput
              label="CPF *"
              name="cpf"
              placeholder="000.000.000-00"
              value={formIdoso.cpf}
              onChange={atualizarIdoso}
              maxLength={14}
            />

            <div className="instituicao-modal__textareaGroup">
              <label htmlFor="observacoes" className="instituicao-modal__label">Observações</label>
              <textarea
                id="observacoes"
                name="observacoes"
                className="instituicao-modal__textarea"
                placeholder="Observações importantes sobre o idoso..."
                value={formIdoso.observacoes}
                onChange={atualizarIdoso}
              />
            </div>

            <div className="instituicao-modal__row">
              <BcInput
                label="DDD *"
                name="ddd"
                placeholder="11"
                value={formIdoso.ddd}
                onChange={atualizarIdoso}
                maxLength={2}
              />
              <BcInput
                label="Telefone *"
                name="telefone"
                placeholder="90000-0000"
                value={formIdoso.telefone}
                onChange={atualizarIdoso}
                maxLength={10}
              />
            </div>

            <BcButton type="submit" loading={salvandoIdoso}>
              {idosoEmEdicao ? "Salvar alteracoes" : "Cadastrar"}
            </BcButton>
          </form>
        </section>
      </BcModal>
    </div>
  );
}
