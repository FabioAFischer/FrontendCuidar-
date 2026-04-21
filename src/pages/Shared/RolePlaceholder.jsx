import BcButton from "../../components/Bcbutton/BcButton";
import BcLogo from "../../components/Bclogo/BcLogo";
import "./RolePlaceholder.css";

export default function RolePlaceholder({
  titulo,
  descricao,
  botao = "Sair",
  onLogout,
}) {
  return (
    <main className="role-placeholder">
      <section className="role-placeholder__card">
        <BcLogo size="lg" />
        <span className="role-placeholder__tag">Em preparação</span>
        <h1>{titulo}</h1>
        <p>{descricao}</p>
        <BcButton onClick={onLogout}>{botao}</BcButton>
      </section>
    </main>
  );
}
