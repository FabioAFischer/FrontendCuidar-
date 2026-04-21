import { useEffect, useState } from "react";
import AdminDashboard from "./pages/Administrador/DashBoard/Admindashboard";
import LoginPage from "./pages/Auth/LoginPage";
import RolePlaceholder from "./pages/Shared/RolePlaceholder";
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
        return <AdminDashboard onLogout={() => navigateTo(ROUTES.login)} />;

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
        return (
          <RolePlaceholder
            titulo="Área da Instituição"
            descricao="O acesso da instituição já está preparado no aplicativo e pode ser ligado ao dashboard correspondente assim que ele for implementado."
            botao="Voltar para o login"
            onLogout={() => navigateTo(ROUTES.login)}
          />
        );

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
