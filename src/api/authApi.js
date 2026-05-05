import { API_BASE_URL } from "./env";

const PERFIL_BACKEND = {
  administrador: "ADMINISTRADOR",
  instituicao: "INSTITUICAO",
  cuidador: "CUIDADOR",
};

function getStorage(rememberMe) {
  return rememberMe ? localStorage : sessionStorage;
}

export async function login({ identificador, senha, perfil, rememberMe = true }) {
  const perfilBackend = PERFIL_BACKEND[perfil] || perfil;

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identificador,
      senha,
      perfil: perfilBackend,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Erro ao fazer login.");
  }

  const storage = getStorage(rememberMe);
  storage.setItem("token", data.token);
  storage.setItem("tokenTipo", data.tipo || "Bearer");
  storage.setItem("perfil", data.perfil);
  storage.setItem("usuarioId", String(data.id));
  storage.setItem("usuarioNome", data.nome);

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
