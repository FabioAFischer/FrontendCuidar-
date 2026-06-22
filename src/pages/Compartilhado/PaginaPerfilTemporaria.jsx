import { useState } from "react";
import BcBotao from "../../components/BcBotao/BcBotao";
import BcLogo from "../../components/Bclogo/BcLogo";
import BcPerfilModal from "../../components/BcPerfilModal/BcPerfilModal";
import "./PaginaPerfilTemporaria.css";

export default function PaginaPerfilTemporaria({
  titulo,
  descricao,
  botao = "Sair",
  onLogout,
}) {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <main className="role-placeholder">
      <section className="role-placeholder__card">
        <BcLogo size="lg" />
        <span className="role-placeholder__tag">Em preparação</span>
        <h1>{titulo}</h1>
        <p>{descricao}</p>

        <div className="role-placeholder__acoes">
          <BcBotao variant="ghost" onClick={() => setModalAberto(true)}>
            Meu perfil
          </BcBotao>
          <BcBotao onClick={onLogout}>{botao}</BcBotao>
        </div>
      </section>

      <BcPerfilModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      />
    </main>
  );
}
