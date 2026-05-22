import { useEffect, useState } from "react";
import { getAuthToken, logout } from "./api/authApi";
import BcConfirmacao from "./components/BcConfirmacao/BcConfirmacao";
import { IconeSair } from "./components/icons/Icons";
import AdminDashboard from "./pages/Administrador/DashBoard/Admindashboard";
import LoginPage from "./pages/Auth/LoginPage";
import CuidadorConsultas from "./pages/Cuidador/Consultas/CuidadorConsultas";
import CuidadorDashboard from "./pages/Cuidador/Dashboard/CuidadorDashboard";
import CuidadorIdososVinculados from "./pages/Cuidador/IdososVinculados/CuidadorIdososVinculados";
import CuidadorRemediosPrescricao from "./pages/Cuidador/RemediosPrescricao/CuidadorRemediosPrescricao";
import InstituicaoProfileHome from "./pages/Instituicao/ProfileHome/InstituicaoProfileHome";
import "./styles/global.css";
import "./App.css";

const ROUTES = {
  login: "#/login",
  administrador: "#/administrador",
  cuidador: "#/cuidador",
  cuidadorIdososVinculados: "#/cuidador/usuarios-vinculados",
  cuidadorConsultas: "#/cuidador/consultas",
  cuidadorRemediosPrescricao: "#/cuidador/remedios-prescricao",
  instituicao: "#/instituicao",
};

const ROUTE_PROFILE = {
  "dashboard-admin": "ADMINISTRADOR",
  "area-cuidador": "CUIDADOR",
  "cuidador-idosos-vinculados": "CUIDADOR",
  "cuidador-consultas": "CUIDADOR",
  "cuidador-remedios-prescricao": "CUIDADOR",
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
    case ROUTES.cuidadorIdososVinculados:
      return "cuidador-idosos-vinculados";
    case ROUTES.cuidadorConsultas:
      return "cuidador-consultas";
    case ROUTES.cuidadorRemediosPrescricao:
      return "cuidador-remedios-prescricao";
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
  const [confirmarSaida, setConfirmarSaida] = useState(false);

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

  function solicitarLogout() {
    setConfirmarSaida(true);
  }

  function handleLogout() {
    logout();
    setConfirmarSaida(false);
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
    if (tela === "login" && getAuthToken()) {
      navigateTo(getRouteByProfile(getStoredProfile()));
      return null;
    }

    if (!hasAccess(tela)) {
      logout();
      navigateTo(ROUTES.login);
      return <LoginPage onLogin={handleLogin} />;
    }

    switch (tela) {
      case "login":
        return <LoginPage onLogin={handleLogin} />;

      case "dashboard-admin":
        return <AdminDashboard onLogout={solicitarLogout} />;

      case "area-cuidador":
        return (
          <CuidadorDashboard
            onLogout={solicitarLogout}
            onOpenIdososVinculados={() => navigateTo(ROUTES.cuidadorIdososVinculados)}
            onOpenConsultas={() => navigateTo(ROUTES.cuidadorConsultas)}
            onOpenRemedios={() => navigateTo(ROUTES.cuidadorRemediosPrescricao)}
          />
        );

      case "cuidador-idosos-vinculados":
        return (
          <CuidadorIdososVinculados
            onLogout={solicitarLogout}
            onBack={() => navigateTo(ROUTES.cuidador)}
          />
        );

      case "cuidador-consultas":
        return (
          <CuidadorConsultas
            onLogout={solicitarLogout}
            onBack={() => navigateTo(ROUTES.cuidador)}
          />
        );

      case "cuidador-remedios-prescricao":
        return (
          <CuidadorRemediosPrescricao
            onLogout={solicitarLogout}
            onBack={() => navigateTo(ROUTES.cuidador)}
          />
        );

      case "area-instituicao":
        return <InstituicaoProfileHome onLogout={solicitarLogout} />;

      default:
        return (
          <div className="app-fallback">
            Tela nao encontrada.
          </div>
        );
    }
  }

  return (
    <div className="app-shell">
      {renderTela()}
      <BcConfirmacao
        aberto={confirmarSaida}
        titulo="Sair da conta?"
        mensagem="Ao sair, sera necessario fazer login novamente para acessar a plataforma."
        textoConfirmar="Sair"
        icone={<IconeSair />}
        onCancelar={() => setConfirmarSaida(false)}
        onConfirmar={handleLogout}
      />
    </div>
  );
}
