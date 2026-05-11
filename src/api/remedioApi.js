import { getAuthHeaders } from "./authApi";
import { API_BASE_URL } from "./env";

const MOCK_TOKEN = "mock-cuidador-token";
const MOCK_REMEDIOS_KEY = "remediosMockados";

function getAuthTokenAtual() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function usandoCuidadorMockado() {
  return getAuthTokenAtual() === MOCK_TOKEN;
}

async function getErrorMessage(response, fallback) {
  const erro = await response.json().catch(() => ({}));

  if (response.status === 401) {
    return "Sua sessao expirou ou o login nao foi encontrado.";
  }

  if (response.status === 403) {
    return "Seu perfil nao tem permissao para executar esta acao.";
  }

  return erro.message || fallback;
}

async function requestApi(path, { method = "GET", dados, fallback } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: getAuthHeaders(),
    body: dados ? JSON.stringify(dados) : undefined,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, fallback));
  }

  return response.json().catch(() => null);
}

function conteudoPaginado(data) {
  return Array.isArray(data?.content) ? data.content : [];
}

function normalizarRemedio(dados) {
  return {
    id: dados.id,
    nome: dados.nome?.trim(),
    observacao: dados.observacao?.trim() || "",
    status: dados.status || "ATIVO",
  };
}

function listarRemediosMockados() {
  const dados = JSON.parse(localStorage.getItem(MOCK_REMEDIOS_KEY) || "[]");
  return Array.isArray(dados) ? dados : [];
}

function salvarRemediosMockados(remedios) {
  localStorage.setItem(MOCK_REMEDIOS_KEY, JSON.stringify(remedios));
}

export async function listarRemedios(page = 0, size = 100) {
  if (usandoCuidadorMockado()) {
    return listarRemediosMockados().slice(page * size, page * size + size);
  }

  const data = await requestApi(`/remedio/listar_todas?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar remedios.",
  });

  return conteudoPaginado(data);
}

export async function buscarRemedioPorId(id) {
  if (usandoCuidadorMockado()) {
    const remedio = listarRemediosMockados().find((item) => Number(item.id) === Number(id));

    if (!remedio) {
      throw new Error("Remedio nao encontrado.");
    }

    return remedio;
  }

  return requestApi(`/remedio/listar/${id}`, {
    fallback: "Remedio nao encontrado.",
  });
}

export async function cadastrarRemedio(dados) {
  if (usandoCuidadorMockado()) {
    const remedios = listarRemediosMockados();
    const remedio = {
      ...normalizarRemedio(dados),
      id: Date.now(),
      status: "ATIVO",
    };

    salvarRemediosMockados([remedio, ...remedios]);
    return remedio;
  }

  return requestApi("/remedio/cadastrar", {
    method: "POST",
    dados: normalizarRemedio(dados),
    fallback: "Erro ao cadastrar remedio.",
  });
}

export async function atualizarRemedio(id, dados) {
  if (usandoCuidadorMockado()) {
    const remedios = listarRemediosMockados();
    const remedioAtualizado = {
      ...normalizarRemedio(dados),
      id: Number(id),
      status: dados.status || "ATIVO",
    };

    salvarRemediosMockados(
      remedios.map((remedio) => Number(remedio.id) === Number(id) ? remedioAtualizado : remedio)
    );

    return remedioAtualizado;
  }

  return requestApi(`/remedio/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarRemedio(dados),
    fallback: "Erro ao atualizar remedio.",
  });
}

export async function deletarRemedio(id) {
  if (usandoCuidadorMockado()) {
    const remedios = listarRemediosMockados();
    salvarRemediosMockados(remedios.filter((remedio) => Number(remedio.id) !== Number(id)));
    return null;
  }

  return requestApi(`/remedio/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao deletar remedio.",
  });
}
