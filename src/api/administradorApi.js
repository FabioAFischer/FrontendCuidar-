// Serviços da API — Administrador
// Agrupa todas as chamadas relacionadas às ações do usuário administrador

import { API_BASE_URL } from "./env";

const ADMIN_AUTH_STORAGE_KEY = "cuidar_admin_auth";
export const ADMIN_AUTH_CHANGED_EVENT = "cuidar_admin_auth_changed";

function notifyAdminAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_AUTH_CHANGED_EVENT));
  }
}

function getStoredAuth() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawAuth = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);

  if (!rawAuth) {
    return null;
  }

  try {
    return JSON.parse(rawAuth);
  } catch {
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    return null;
  }
}

function getTokenExpiration(token) {
  try {
    const base64Payload = token
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const paddedPayload = base64Payload.padEnd(
      base64Payload.length + ((4 - (base64Payload.length % 4)) % 4),
      "="
    );
    const payload = JSON.parse(window.atob(paddedPayload));

    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function getRequiredAuthHeaders(headers = {}) {
  const auth = getAdministradorAuth();

  if (!auth?.token) {
    throw new Error("Sessão de administrador expirada. Faça login novamente.");
  }

  return {
    ...headers,
    Authorization: `${auth.tipo || "Bearer"} ${auth.token}`,
  };
}

export function getAdministradorAuth() {
  const auth = getStoredAuth();

  if (!auth?.token) {
    return null;
  }

  const expiresAt = getTokenExpiration(auth.token);

  if (expiresAt && expiresAt <= Date.now()) {
    logoutAdministrador();
    return null;
  }

  return auth;
}

export function isAdministradorAutenticado() {
  return Boolean(getAdministradorAuth());
}

export function logoutAdministrador() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    notifyAdminAuthChanged();
  }
}

export async function loginAdministrador({ email, senha }) {
  const response = await fetch(`${API_BASE_URL}/auth/login/administrador`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.mensagem || erro.message || erro.error || "Email ou senha inválidos.");
  }

  const data = await response.json();

  if (!data?.token) {
    throw new Error("Token de administrador não retornado pela API.");
  }

  const auth = {
    token: data.token,
    tipo: data.tipo || "Bearer",
    administrador: data.administrador || null,
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(auth));
    notifyAdminAuthChanged();
  }

  return auth;
}

/* ── Instituição ── */

export async function cadastrarInstituicao(dados) {
  const response = await fetch(`${API_BASE_URL}/instituicao/cadastrar`, {
    method: "POST",
    headers: getRequiredAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    if (response.status === 401) {
      logoutAdministrador();
      throw new Error("Sessão de administrador expirada. Faça login novamente.");
    }

    throw new Error(erro.message || "Erro ao cadastrar instituição.");
  }

  return response.json().catch(() => null);
}

export async function listarInstituicoes(page = 0, size = 100) {
  const response = await fetch(
    `${API_BASE_URL}/instituicao/listar_todas?page=${page}&size=${size}`,
    { headers: getRequiredAuthHeaders() }
  );

  if (!response.ok) {
    if (response.status === 401) {
      logoutAdministrador();
      throw new Error("Sessão de administrador expirada. Faça login novamente.");
    }

    throw new Error("Erro ao buscar instituições.");
  }

  // O backend retorna objeto paginado — as instituições ficam em data.content
  const data = await response.json();
  return Array.isArray(data.content) ? data.content : [];
}

export async function buscarInstituicaoPorId(id) {
  const response = await fetch(`${API_BASE_URL}/instituicao/listar/${id}`, {
    headers: getRequiredAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      logoutAdministrador();
      throw new Error("Sessão de administrador expirada. Faça login novamente.");
    }

    throw new Error("Instituição não encontrada.");
  }

  return response.json();
}

export async function atualizarInstituicao(id, dados) {
  const response = await fetch(`${API_BASE_URL}/instituicao/atualizar/${id}`, {
    method: "PUT",
    headers: getRequiredAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    if (response.status === 401) {
      logoutAdministrador();
      throw new Error("Sessão de administrador expirada. Faça login novamente.");
    }

    throw new Error(erro.message || "Erro ao atualizar instituição.");
  }

  return response.json().catch(() => null);
}

export async function deletarInstituicao(id) {
  const response = await fetch(`${API_BASE_URL}/instituicao/deletar/${id}`, {
    method: "DELETE",
    headers: getRequiredAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      logoutAdministrador();
      throw new Error("Sessão de administrador expirada. Faça login novamente.");
    }

    throw new Error("Erro ao deletar instituição.");
  }

  return response.json().catch(() => null);
}
