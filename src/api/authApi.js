import { API_BASE_URL } from "./env";
import { somenteNumeros } from "../utils/validacaoDocumento";

const PERFIL_BACKEND = {
  administrador: "ADMINISTRADOR",
  instituicao: "INSTITUICAO",
  cuidador: "CUIDADOR",
};

function getStorage(rememberMe) {
  return rememberMe ? localStorage : sessionStorage;
}

function salvarSessao(data, rememberMe, identificador) {
  const storage = getStorage(rememberMe);
  storage.setItem("token", data.token);
  storage.setItem("tokenTipo", data.tipo || "Bearer");
  storage.setItem("perfil", data.perfil);
  storage.setItem("usuarioId", String(data.id));
  storage.setItem("usuarioNome", data.nome);
  if (data.email) storage.setItem("usuarioEmail", data.email);
  if (identificador) storage.setItem("usuarioIdentificador", identificador);
}

export async function login({ identificador, senha, perfil, rememberMe = true }) {
  const perfilBackend = PERFIL_BACKEND[perfil] || perfil;
  const identificadorNormalizado = somenteNumeros(identificador);

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identificador: identificadorNormalizado,
        senha,
        perfil: perfilBackend,
      }),
    });
  } catch {
    throw new Error("Falha ao logar.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Erro ao fazer login.");
  }

  if (data.requer2fa) {
    return {
      ...data,
      perfil: perfilBackend,
    };
  }

  salvarSessao(data, rememberMe, identificadorNormalizado);

  return data;
}

export async function verificar2fa({ identificador, codigo, perfil, rememberMe = true }) {
  const perfilBackend = PERFIL_BACKEND[perfil] || perfil;
  const identificadorNormalizado = somenteNumeros(identificador);

  const response = await fetch(`${API_BASE_URL}/auth/verificar-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identificador: identificadorNormalizado,
      codigo,
      perfil: perfilBackend,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Erro ao verificar codigo.");
  }

  salvarSessao(data, rememberMe, identificadorNormalizado);
  return data;
}

export function getAuthToken() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (token && tokenInvalidoOuExpirado(token)) {
    logout();
    return null;
  }

  return token;
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

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("tokenTipo");
  localStorage.removeItem("perfil");
  localStorage.removeItem("usuarioId");
  localStorage.removeItem("usuarioNome");
  localStorage.removeItem("usuarioEmail");
  localStorage.removeItem("usuarioIdentificador");

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("tokenTipo");
  sessionStorage.removeItem("perfil");
  sessionStorage.removeItem("usuarioId");
  sessionStorage.removeItem("usuarioNome");
  sessionStorage.removeItem("usuarioEmail");
  sessionStorage.removeItem("usuarioIdentificador");
}

function tokenInvalidoOuExpirado(token) {
  const payload = decodificarPayloadJwt(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}

function decodificarPayloadJwt(token) {
  try {
    const payloadBase64 = token.split(".")[1];

    if (!payloadBase64) {
      return null;
    }

    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}
