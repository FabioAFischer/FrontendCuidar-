import { useEffect, useState } from "react";
import { getAuthToken, logout } from "./api/authApi";
import AdminDashboard from "./pages/Administrador/DashBoard/Admindashboard";
import LoginPage from "./pages/Auth/LoginPage";
import InstituicaoProfileHome from "./pages/Instituicao/ProfileHome/InstituicaoProfileHome";
import RolePlaceholder from "./pages/Shared/RolePlaceholder";
import "./styles/global.css";
import "./App.css";

const ROUTES = {
  login: "#/login",
  administrador: "#/administrador",
  cuidador: "#/cuidador",
  instituicao: "#/instituicao",
};

const ROUTE_PROFILE = {
  "dashboard-admin": "ADMINISTRADOR",
  "area-cuidador": "CUIDADOR",
  "area-instituicao": "INSTITUICAO",
};

function getStoredProfile() {
  return localStorage.getItem("perfil") || sessionStorage.getItem("perfil");
}

function getRouteByProfile(profile) {
  switch (profile) {
    case "ADMINISTRADOR":
      return ROUTES.administrador;
    case "CUIDADOR":
      return ROUTES.cuidador;
    case "INSTITUICAO":
      return ROUTES.instituicao;
    default:
      return ROUTES.login;
  }
}

function getRouteFromHash(hash) {
  switch (hash) {
    case ROUTES.administrador:
      return "dashboard-admin";
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
    }

    function handleHashChange() {
      setTela(getRouteFromHash(window.location.hash));
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function navigateTo(route) {
    window.location.hash = route;
  }

  function handleLogout() {
    logout();
    navigateTo(ROUTES.login);
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
    }
  }

  function hasAccess(route) {
    const requiredProfile = ROUTE_PROFILE[route];

    if (!requiredProfile) {
      return true;
    }

    return Boolean(getAuthToken()) && getStoredProfile() === requiredProfile;
  }

  function renderTela() {
    if (!hasAccess(tela)) {
      logout();
      navigateTo(ROUTES.login);
      return <LoginPage onLogin={handleLogin} />;
    }

    switch (tela) {
      case "login":
        return <LoginPage onLogin={handleLogin} />;

      case "dashboard-admin":
        return <AdminDashboard onLogout={handleLogout} />;

      case "area-cuidador":
        return (
          <RolePlaceholder
            titulo="Area do Cuidador"
            descricao="A autenticacao do cuidador ja esta conectada ao fluxo de login e pronta para receber a proxima tela."
            botao="Voltar para o login"
            onLogout={handleLogout}
          />
        );

      case "area-instituicao":
        return <InstituicaoProfileHome onLogout={handleLogout} />;

      default:
        return (
          <div className="app-fallback">
            Tela nao encontrada.
          </div>
        );
    }
  }

  return <div className="app-shell">{renderTela()}</div>;
}
