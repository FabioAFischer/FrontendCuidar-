import { API_BASE_URL } from "./env";
import { extrairSomenteNumeros } from "../utils/validacaoDocumento";

const PERFIL_BACKEND = {
  administrador: "ADMINISTRADOR",
  instituicao: "INSTITUICAO",
  cuidador: "CUIDADOR",
};

const SESSION_KEYS = [
  "token",
  "tokenTipo",
  "perfil",
  "usuarioId",
  "usuarioNome",
  "usuarioEmail",
  "usuarioIdentificador",
];

function limparArmazenamento(storage) {
  SESSION_KEYS.forEach((key) => storage.removeItem(key));
}

function selecionarArmazenamentoSessao(rememberMe) {
  return rememberMe ? localStorage : sessionStorage;
}

async function executarRequisicaoComTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function salvarSessao(data, rememberMe, identificador) {
  const storage = selecionarArmazenamentoSessao(rememberMe);
  const storageAlternativo = rememberMe ? sessionStorage : localStorage;

  limparArmazenamento(storageAlternativo);
  storage.setItem("token", data.token);
  storage.setItem("tokenTipo", data.tipo || "Bearer");
  storage.setItem("perfil", data.perfil);
  storage.setItem("usuarioId", String(data.id));
  storage.setItem("usuarioNome", data.nome);
  if (data.email) storage.setItem("usuarioEmail", data.email);
  if (identificador) storage.setItem("usuarioIdentificador", identificador);
}

export async function autenticarUsuario({ identificador, senha, perfil, rememberMe = false }) {
  const perfilBackend = PERFIL_BACKEND[perfil] || perfil;
  const identificadorNormalizado = extrairSomenteNumeros(identificador);

  let response;

  try {
    response = await executarRequisicaoComTimeout(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identificador: identificadorNormalizado,
        senha,
        perfil: perfilBackend,
      }),
    });
  } catch (erro) {
    throw new Error(erro.message || "Falha ao logar.");
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

export async function validarCodigoDoisFatores({ identificador, codigo, perfil, rememberMe = false }) {
  const perfilBackend = PERFIL_BACKEND[perfil] || perfil;
  const identificadorNormalizado = extrairSomenteNumeros(identificador);

  const response = await executarRequisicaoComTimeout(`${API_BASE_URL}/auth/verificar-2fa`, {
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

export function buscarTokenAutenticacao() {
  const tokenLocal = localStorage.getItem("token");
  const tokenSessao = sessionStorage.getItem("token");
  const token = tokenLocal || tokenSessao;

  if (token && verificarTokenInvalidoOuExpirado(token)) {
    encerrarSessaoUsuario();
    return null;
  }

  return token;
}

export function montarCabecalhosAutenticacao() {
  const token = buscarTokenAutenticacao();

  return token
    ? {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    : { "Content-Type": "application/json" };
}

export function encerrarSessaoUsuario() {
  limparArmazenamento(localStorage);
  limparArmazenamento(sessionStorage);
}

function verificarTokenInvalidoOuExpirado(token) {
  const payload = decodificarPayloadTokenJwt(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}

function decodificarPayloadTokenJwt(token) {
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
