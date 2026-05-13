import { API_BASE_URL } from "./env";
import { somenteNumeros } from "../utils/validacaoDocumento";

const PERFIL_BACKEND = {
  administrador: "ADMINISTRADOR",
  instituicao: "INSTITUICAO",
  cuidador: "CUIDADOR",
};

const CUIDADOR_MOCK = {
  id: 9001,
  nome: "Phillip MLK",
  email: "phillip.mlk@gmail.com",
  emailMascarado: "p********k@gmail.com",
  cpf: "52998224725",
  identificadoresAceitos: ["52998224725", "52998224725529"],
  senha: "Phillip@123",
  codigo2fa: "123456",
  perfil: "CUIDADOR",
  token: "mock-cuidador-token",
  tipo: "Bearer",
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

  if (data.email) {
    storage.setItem("usuarioEmail", data.email);
  }
}

export async function login({ identificador, senha, perfil, rememberMe = true }) {
  const perfilBackend = PERFIL_BACKEND[perfil] || perfil;
  const identificadorNormalizado = somenteNumeros(identificador);

  if (
    perfilBackend === CUIDADOR_MOCK.perfil &&
    CUIDADOR_MOCK.identificadoresAceitos.includes(identificadorNormalizado) &&
    senha === CUIDADOR_MOCK.senha
  ) {
    return {
      requer2fa: true,
      email: CUIDADOR_MOCK.emailMascarado,
      perfil: CUIDADOR_MOCK.perfil,
    };
  }

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
    return {
      ...data,
      perfil: perfilBackend,
    };
  }

  salvarSessao(data, rememberMe);

  return data;
}

export async function verificar2fa({ email, codigo, perfil, rememberMe = true }) {
  const emailNormalizado = String(email || "").trim().toLowerCase();
  const codigoNormalizado = String(codigo || "").trim();
  const perfilBackend = PERFIL_BACKEND[perfil] || perfil;

  if (emailNormalizado === CUIDADOR_MOCK.email && codigoNormalizado === CUIDADOR_MOCK.codigo2fa) {
    const cuidadorMockado = {
      id: CUIDADOR_MOCK.id,
      nome: CUIDADOR_MOCK.nome,
      email: CUIDADOR_MOCK.email,
      perfil: CUIDADOR_MOCK.perfil,
      token: CUIDADOR_MOCK.token,
      tipo: CUIDADOR_MOCK.tipo,
    };

    salvarSessao(cuidadorMockado, rememberMe);
    return cuidadorMockado;
  }

  const response = await fetch(`${API_BASE_URL}/auth/verificar-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      codigo,
      perfil: perfilBackend,
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

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("tokenTipo");
  localStorage.removeItem("perfil");
  localStorage.removeItem("usuarioId");
  localStorage.removeItem("usuarioNome");
  localStorage.removeItem("usuarioEmail");

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("tokenTipo");
  sessionStorage.removeItem("perfil");
  sessionStorage.removeItem("usuarioId");
  sessionStorage.removeItem("usuarioNome");
  sessionStorage.removeItem("usuarioEmail");
}
