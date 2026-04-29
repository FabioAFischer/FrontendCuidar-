import { useEffect, useState } from "react";
import AdminDashboard from "./pages/Administrador/DashBoard/Admindashboard";
import LoginPage from "./pages/Auth/LoginPage";
import InstituicaoProfileHome from "./pages/Instituicao/ProfileHome/InstituicaoProfileHome";
import RolePlaceholder from "./pages/Shared/RolePlaceholder";
import {
  ADMIN_AUTH_CHANGED_EVENT,
  isAdministradorAutenticado,
  logoutAdministrador,
} from "./api/administradorApi";
import "./styles/global.css";
import "./App.css";

const ROUTES = {
  login: "#/login",
  administrador: "#/administrador",
  cuidador: "#/cuidador",
  instituicao: "#/instituicao",
};

function getRouteFromHash(hash) {
  switch (hash) {
    case ROUTES.administrador:
      return isAdministradorAutenticado() ? "dashboard-admin" : "login";
    case ROUTES.cuidador:
      return "area-cuidador";
    case ROUTES.instituicao:
      return "area-instituicao";
    case ROUTES.login:
    case "":
    case "#":
    case "#/":
      return "login";
    default:
      return "not-found";
  }
}

export default function App() {
  const [tela, setTela] = useState(() => getRouteFromHash(window.location.hash));

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = ROUTES.login;
    } else if (
      window.location.hash === ROUTES.administrador &&
      !isAdministradorAutenticado()
    ) {
      window.location.hash = ROUTES.login;
    }

    function handleHashChange() {
      const nextTela = getRouteFromHash(window.location.hash);

      if (window.location.hash === ROUTES.administrador && nextTela === "login") {
        window.location.hash = ROUTES.login;
        return;
      }

      setTela(nextTela);
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    function handleAdminAuthChanged() {
      if (window.location.hash === ROUTES.administrador && !isAdministradorAutenticado()) {
        navigateTo(ROUTES.login);
      }
    }

    window.addEventListener(ADMIN_AUTH_CHANGED_EVENT, handleAdminAuthChanged);
    return () => window.removeEventListener(ADMIN_AUTH_CHANGED_EVENT, handleAdminAuthChanged);
  }, []);

  function navigateTo(route) {
    if (window.location.hash === route) {
      setTela(getRouteFromHash(route));
      return;
    }

    window.location.hash = route;
  }

  function handleLogin(role) {
    if (role === "administrador") {
      navigateTo(ROUTES.administrador);
      return;
    }

    if (role === "cuidador") {
      navigateTo(ROUTES.cuidador);
      return;
    }

    if (role === "instituicao") {
      navigateTo(ROUTES.instituicao);
      return;
    }
  }

  function renderTela() {
    switch (tela) {
      case "login":
        return <LoginPage onLogin={handleLogin} />;

      case "dashboard-admin":
        return (
          <AdminDashboard
            onLogout={() => {
              logoutAdministrador();
              navigateTo(ROUTES.login);
            }}
          />
        );

      case "area-cuidador":
        return (
          <RolePlaceholder
            titulo="Área do Cuidador"
            descricao="A autenticação do cuidador já está conectada ao fluxo de login e pronta para receber a próxima tela."
            botao="Voltar para o login"
            onLogout={() => navigateTo(ROUTES.login)}
          />
        );

      case "area-instituicao":
        return <InstituicaoProfileHome onLogout={() => navigateTo(ROUTES.login)} />;

      default:
        return (
          <div className="app-fallback">
            Tela não encontrada.
          </div>
        );
    }
  }

  return <div className="app-shell">{renderTela()}</div>;
}
