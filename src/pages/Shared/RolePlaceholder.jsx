import { useState } from "react";
import BcButton from "../../components/Bcbutton/BcButton";
import BcLogo from "../../components/Bclogo/BcLogo";
import BcPerfilModal from "../../components/BcPerfilModal/BcPerfilModal";
import "./RolePlaceholder.css";

export default function RolePlaceholder({
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
          <BcButton variant="ghost" onClick={() => setModalAberto(true)}>
            Meu perfil
          </BcButton>
          <BcButton onClick={onLogout}>{botao}</BcButton>
        </div>
      </section>

      <BcPerfilModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      />
    </main>
  );
}