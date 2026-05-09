import { API_BASE_URL, MOCK_2FA_ENABLED, MOCK_2FA_USER } from "./env";
import { somenteNumeros } from "../utils/validacaoDocumento";

const PERFIL_BACKEND = {
  administrador: "ADMINISTRADOR",
  instituicao: "INSTITUICAO",
  cuidador: "CUIDADOR",
};

function getStorage(rememberMe) {
  return rememberMe ? localStorage : sessionStorage;
}

function salvarSessao(data, rememberMe) {
  const storage = getStorage(rememberMe);
  storage.setItem("token", data.token);
  storage.setItem("tokenTipo", data.tipo || "Bearer");
  storage.setItem("perfil", data.perfil);
  storage.setItem("usuarioId", String(data.id));
  storage.setItem("usuarioNome", data.nome);
}

function montarSessaoMock2fa(data, perfilBackend) {
  return {
    ...MOCK_2FA_USER,
    perfil: perfilBackend,
    emailMascarado: data.email,
    autenticado: true,
    mock2fa: true,
  };
}

export async function login({ identificador, senha, perfil, rememberMe = true }) {
  const perfilBackend = PERFIL_BACKEND[perfil] || perfil;
  const identificadorNormalizado = somenteNumeros(identificador);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identificador: identificadorNormalizado,
      senha,
      perfil: perfilBackend,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Erro ao fazer login.");
  }

  if (data.requer2fa) {
    if (MOCK_2FA_ENABLED) {
      const sessaoMock = montarSessaoMock2fa(data, perfilBackend);
      salvarSessao(sessaoMock, rememberMe);
      return sessaoMock;
    }

    return {
      ...data,
      perfil: perfilBackend,
    };
  }

  salvarSessao(data, rememberMe);

  return data;
}

export async function verificar2fa({ email, codigo, rememberMe = true }) {
  const response = await fetch(`${API_BASE_URL}/auth/verificar-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      codigo,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Erro ao verificar codigo.");
  }

  salvarSessao(data, rememberMe);
  return data;
}

export function getAuthToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export function getAuthHeaders() {
  const token = getAuthToken();

  return token
    ? {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    : { "Content-Type": "application/json" };
}

export function isMockAuthSession() {
  return getAuthToken() === MOCK_2FA_USER.token;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("tokenTipo");
  localStorage.removeItem("perfil");
  localStorage.removeItem("usuarioId");
  localStorage.removeItem("usuarioNome");

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("tokenTipo");
  sessionStorage.removeItem("perfil");
  sessionStorage.removeItem("usuarioId");
  sessionStorage.removeItem("usuarioNome");
}
