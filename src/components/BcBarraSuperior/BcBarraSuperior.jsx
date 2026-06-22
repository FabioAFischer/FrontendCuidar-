import { useState } from "react";
import BcLogo from "../Bclogo/BcLogo";
import BcPerfilModal from "../BcPerfilModal/BcPerfilModal";
import "./BcBarraSuperior.css";

function gerarInicialNome(nome = "") {
  return String(nome).charAt(0).toUpperCase() || "?";
}

export default function BcBarraSuperior({
  title,
  subtitle,
  actionLabel = "Sair",
  actionIcon = null,
  onAction,
  mostrarPerfil = true,
}) {
  const [perfilAberto, setPerfilAberto] = useState(false);
  const nome = localStorage.getItem("usuarioNome") || sessionStorage.getItem("usuarioNome") || "";

  return (
    <>
      <header className="bc-topbar">
        <div className="bc-topbar__inner">
          <div className="bc-topbar__brand">
            <BcLogo size="lg" />
            <div className="bc-topbar__titles">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className="bc-topbar__acoes">
            {mostrarPerfil && (
              <button
                className="bc-topbar__avatar"
                type="button"
                onClick={() => setPerfilAberto(true)}
                title="Ver perfil"
                aria-label="Abrir perfil"
              >
                {gerarInicialNome(nome)}
              </button>
            )}

            <button className="bc-topbar__action" type="button" onClick={onAction}>
              {actionIcon}
              {actionLabel}
            </button>
          </div>
        </div>
      </header>

      {mostrarPerfil && (
        <BcPerfilModal
          aberto={perfilAberto}
          onFechar={() => setPerfilAberto(false)}
        />
      )}
    </>
  );
}