import { useState } from "react";
import BcButton from "../../../components/Bcbutton/BcButton";
import BcInput from "../../../components/Bcinput/BcInput";
import BcEmptySection from "../../../components/BcEmptySection/BcEmptySection";
import BcModal from "../../../components/BcModal/BcModal";
import BcTopbar from "../../../components/BcTopbar/BcTopbar";
import {
  IconeCuidadores,
  IconeCuidadoresVazio,
  IconeIdosos,
  IconeIdososVazio,
  IconeSair,
} from "../../../components/icons/Icons";
import "./InstituicaoProfileHome.css";

export default function InstituicaoProfileHome({ onLogout }) {
  const [modalCuidadorAberto, setModalCuidadorAberto] = useState(false);
  const [modalIdosoAberto, setModalIdosoAberto] = useState(false);
  const [formCuidador, setFormCuidador] = useState({
    nome: "",
    cpf: "",
    login: "",
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
  });

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

  function handleCadastrarCuidador(evento) {
    evento.preventDefault();
    setModalCuidadorAberto(false);
  }

  function handleCadastrarIdoso(evento) {
    evento.preventDefault();
    setModalIdosoAberto(false);
  }

  return (
    <div className="instituicao-home">
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
            onAction={() => setModalCuidadorAberto(true)}
          />

          <BcEmptySection
            title="Idosos"
            count={0}
            icon={<IconeIdosos />}
            buttonLabel="Cadastrar Idoso"
            emptyIcon={<IconeIdososVazio />}
            emptyText="Nenhum idoso cadastrado"
            tone="secondary"
            onAction={() => setModalIdosoAberto(true)}
          />
        </div>
      </main>

      <BcModal aberto={modalCuidadorAberto} onFechar={() => setModalCuidadorAberto(false)}>
        <section className="instituicao-modal">
          <div className="instituicao-modal__header">
            <h2>Novo Cuidador</h2>
          </div>

          <form className="instituicao-modal__form" onSubmit={handleCadastrarCuidador}>
            <BcInput
              label="Nome *"
              name="nome"
              value={formCuidador.nome}
              onChange={atualizarCuidador}
            />
            <BcInput
              label="CPF *"
              name="cpf"
              placeholder="000.000.000-00"
              value={formCuidador.cpf}
              onChange={atualizarCuidador}
              maxLength={14}
            />
            <BcInput
              label="Login *"
              name="login"
              value={formCuidador.login}
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

            <BcButton type="submit">Cadastrar</BcButton>
          </form>
        </section>
      </BcModal>

      <BcModal aberto={modalIdosoAberto} onFechar={() => setModalIdosoAberto(false)}>
        <section className="instituicao-modal">
          <div className="instituicao-modal__header">
            <h2>Novo Idoso</h2>
          </div>

          <form className="instituicao-modal__form" onSubmit={handleCadastrarIdoso}>
            <BcInput
              label="Nome *"
              name="nome"
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

            <BcButton type="submit">Cadastrar</BcButton>
          </form>
        </section>
      </BcModal>
    </div>
  );
}
