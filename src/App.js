import { useEffect, useState } from "react";
import { buscarTokenAutenticacao, encerrarSessaoUsuario } from "./api/authApi";
import BcConfirmacao from "./components/BcConfirmacao/BcConfirmacao";
import { IconeSair } from "./components/icones/Icones";
import PainelAdministrador from "./pages/Administrador/PainelAdministrador/PainelAdministrador";
import PaginaLogin from "./pages/Autenticacao/PaginaLogin";
import ConsultasCuidador from "./pages/Cuidador/ConsultasCuidador/ConsultasCuidador";
import PainelCuidador from "./pages/Cuidador/PainelCuidador/PainelCuidador";
import IdososVinculadosCuidador from "./pages/Cuidador/IdososVinculadosCuidador/IdososVinculadosCuidador";
import RemediosPrescricaoCuidador from "./pages/Cuidador/RemediosPrescricaoCuidador/RemediosPrescricaoCuidador";
import PainelInstituicao from "./pages/Instituicao/PainelInstituicao/PainelInstituicao";
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

const PROFILE_ROUTE = {
  ADMINISTRADOR: ROUTES.administrador,
  CUIDADOR: ROUTES.cuidador,
  INSTITUICAO: ROUTES.instituicao,
};

function buscarPerfilArmazenado() {
  return localStorage.getItem("perfil") || sessionStorage.getItem("perfil");
}

function buscarRotaInicialAutenticada() {
  const token = buscarTokenAutenticacao();
  const perfil = buscarPerfilArmazenado();

  if (!token || !PROFILE_ROUTE[perfil]) {
    return ROUTES.login;
  }

  return PROFILE_ROUTE[perfil];
}

function buscarRotaPeloHash(hash) {
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
  const [tela, setTela] = useState(() => buscarRotaPeloHash(window.location.hash));
  const [confirmarSaida, setConfirmarSaida] = useState(false);

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = buscarRotaInicialAutenticada();
    }

    function aoAlterarHashNavegacao() {
      setTela(buscarRotaPeloHash(window.location.hash));
    }

    window.addEventListener("hashchange", aoAlterarHashNavegacao);
    return () => window.removeEventListener("hashchange", aoAlterarHashNavegacao);
  }, []);

  function navegarParaRota(route) {
    window.location.hash = route;
  }

  function aoSolicitarSaidaDoSistema() {
    setConfirmarSaida(true);
  }

  function aoSairDoSistema() {
    encerrarSessaoUsuario();
    setConfirmarSaida(false);
    navegarParaRota(ROUTES.login);
  }

  function aoEntrarNoSistema(role) {
    if (role === "administrador") {
      navegarParaRota(ROUTES.administrador);
      return;
    }

    if (role === "cuidador") {
      navegarParaRota(ROUTES.cuidador);
      return;
    }

    if (role === "instituicao") {
      navegarParaRota(ROUTES.instituicao);
    }
  }

  function verificarAcessoRota(route) {
    const requiredProfile = ROUTE_PROFILE[route];

    if (!requiredProfile) {
      return true;
    }

    return Boolean(buscarTokenAutenticacao()) && buscarPerfilArmazenado() === requiredProfile;
  }

  function renderizarTelaAtual() {
    if (!verificarAcessoRota(tela)) {
      encerrarSessaoUsuario();
      navegarParaRota(ROUTES.login);
      return <PaginaLogin onLogin={aoEntrarNoSistema} />;
    }

    switch (tela) {
      case "login":
        return <PaginaLogin onLogin={aoEntrarNoSistema} />;

      case "dashboard-admin":
        return <PainelAdministrador onLogout={aoSolicitarSaidaDoSistema} />;

      case "area-cuidador":
        return (
          <PainelCuidador
            onLogout={aoSolicitarSaidaDoSistema}
            onOpenIdososVinculados={() => navegarParaRota(ROUTES.cuidadorIdososVinculados)}
            onOpenConsultas={() => navegarParaRota(ROUTES.cuidadorConsultas)}
            onOpenRemedios={() => navegarParaRota(ROUTES.cuidadorRemediosPrescricao)}
          />
        );

      case "cuidador-idosos-vinculados":
        return (
          <IdososVinculadosCuidador
            onLogout={aoSolicitarSaidaDoSistema}
            onBack={() => navegarParaRota(ROUTES.cuidador)}
          />
        );

      case "cuidador-consultas":
        return (
          <ConsultasCuidador
            onLogout={aoSolicitarSaidaDoSistema}
            onBack={() => navegarParaRota(ROUTES.cuidador)}
          />
        );

      case "cuidador-remedios-prescricao":
        return (
          <RemediosPrescricaoCuidador
            onLogout={aoSolicitarSaidaDoSistema}
            onBack={() => navegarParaRota(ROUTES.cuidador)}
          />
        );

      case "area-instituicao":
        return <PainelInstituicao onLogout={aoSolicitarSaidaDoSistema} />;

      default:
        return (
          <div className="app-fallback">
            Tela não encontrada.
          </div>
        );
    }
  }

  return (
    <div className="app-shell">
      {renderizarTelaAtual()}
      <BcConfirmacao
        aberto={confirmarSaida}
        titulo="Sair da conta?"
        mensagem="Ao sair, será necessário fazer login novamente para acessar a plataforma."
        textoConfirmar="Sair"
        icone={<IconeSair />}
        onCancelar={() => setConfirmarSaida(false)}
        onConfirmar={aoSairDoSistema}
      />
    </div>
  );
}
